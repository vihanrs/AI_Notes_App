import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { headers as xmcpHeaders } from "xmcp/dist/runtime/headers";

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
 * Checks both standard Next.js session and MCP bearer tokens
 */
export async function getMcpAuthenticatedUser(): Promise<User> {
    // 1. Try traditional session (Next.js context / Server Actions)
    // This reuses the standard auth function for internal calls
    try {
        return await getAuthenticatedUser();
    } catch (e) {
        // Fallback to MCP bearer token if session auth fails
    }

    // 2. Try MCP Bearer token from xmcp headers
    // This is used when tools are called via the /mcp endpoint by an external agent
    try {
        const h = xmcpHeaders();
        const authHeaderValue = h["authorization"];

        if (authHeaderValue && authHeaderValue.startsWith("Bearer ")) {
            const token = authHeaderValue.split(" ")[1];
            const supabase = await createClient();
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (user && !error) {
                return user;
            }
        }
    } catch (e) {
        // This might error if xmcp headers are not available (e.g. not in an xmcp request)
    }

    throw new Error("Unauthorized: Please log in to use this tool.");
}
