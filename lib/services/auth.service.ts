import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { headers as xmcpHeaders } from "xmcp/dist/runtime/headers";
import { db, apiKeys } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hasToolPermission } from "@/lib/permissions";
import crypto from "crypto";

/**
 * Extended user context with optional API key scopes
 */
export type AuthenticatedContext = {
    user: User;
    scopes?: string[]; // Present if authenticated via API key
};

/**
 * Get the authenticated user from the current session
 * Used by Server Actions (Next.js context)
 * @throws Error if user is not authenticated
 */
export async function getAuthenticatedUser(): Promise<User> {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    return user;
}

/**
 * Get the authenticated user specifically for MCP tools
 * Checks: Session → Custom API Key
 * Returns user context with optional scopes for permission checking
 */
export async function getMcpAuthenticatedUser(): Promise<AuthenticatedContext> {
    // 1. Try traditional session (Next.js context / Server Actions)
    // This reuses the standard auth function for internal calls
    try {
        const user = await getAuthenticatedUser();
        return { user }; // No scopes = full access (internal call)
    } catch (e) {
        // Fallback to API key authentication
    }

    // 2. Try custom API key from xmcp headers
    // This is used when tools are called via the /mcp endpoint by an external agent
    try {
        const h = xmcpHeaders();
        const authHeaderValue = h["authorization"];

        if (authHeaderValue && authHeaderValue.startsWith("Bearer ")) {
            const token = authHeaderValue.split(" ")[1];

            // Validate custom API key
            const apiKeyContext = await validateApiKey(token);
            if (apiKeyContext) {
                return apiKeyContext;
            }
        }
    } catch (e) {
        // This might error if xmcp headers are not available
    }

    throw new Error("Unauthorized: Please provide a valid API key.");
}

/**
 * Validate a custom API key and return the user context with scopes
 */
async function validateApiKey(apiKey: string): Promise<AuthenticatedContext | null> {
    try {
        // Hash the provided key to compare with stored hash
        const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

        // Look up the API key in the database
        const [apiKeyRecord] = await db
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.keyHash, keyHash))
            .limit(1);

        if (!apiKeyRecord) {
            return null;
        }

        // Update last used timestamp (fire and forget)
        db.update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, apiKeyRecord.id))
            .execute()
            .catch(() => { }); // Ignore errors

        // Get the user associated with this API key
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.admin.getUserById(apiKeyRecord.userId);

        if (!user || error) {
            return null;
        }

        return {
            user,
            scopes: apiKeyRecord.scopes,
        };
    } catch (error) {
        console.error("API key validation error:", error);
        return null;
    }
}

/**
 * Check if the current context has permission to use a specific tool
 * @throws Error if permission is denied
 */
export function requireToolPermission(context: AuthenticatedContext, toolName: string): void {
    // If no scopes are present, it's an internal call with full access
    if (!context.scopes) {
        return;
    }

    // Check if the API key has the required scope
    if (!hasToolPermission(context.scopes, toolName)) {
        throw new Error(
            `Permission denied: This API key does not have access to the '${toolName}' tool.`
        );
    }
}
