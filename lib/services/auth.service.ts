import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { hasToolPermission } from "@/lib/permissions";


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
 * Resolve the user for xmcp tool handlers — works for both paths:
 * - MCP path: reads userId from authInfo.extra (set by withAuth in route.ts)
 * - Chatbot path: falls back to Supabase session when authInfo is absent
 */
export async function resolveToolUser(
    authInfo?: { scopes: string[]; extra?: Record<string, unknown> }
): Promise<{ userId: string; scopes?: string[] }> {
    if (authInfo?.extra?.userId) {
        return { userId: authInfo.extra.userId as string, scopes: authInfo.scopes };
    }
    const user = await getAuthenticatedUser();
    return { userId: user.id };
}


/**
 * Check if the current context has permission to use a specific tool
 * @throws Error if permission is denied
 */
export function requireToolPermission(context: { scopes?: string[] }, toolName: string): void {
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
