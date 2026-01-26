// Supabase client for MCP tools (uses xmcp headers instead of Next.js cookies)
import { createServerClient } from "@supabase/ssr";
import { headers } from "xmcp/dist/runtime/headers";

// Debug info that can be accessed by callers
export let mcpDebugInfo: string[] = [];

export function createMcpClient() {
    mcpDebugInfo = [];
    const requestHeaders = headers();
    const cookieHeader = requestHeaders["cookie"] || "";

    mcpDebugInfo.push(`Cookie header: ${cookieHeader ? "present" : "MISSING"}`);
    mcpDebugInfo.push(`All headers: ${JSON.stringify(Object.keys(requestHeaders))}`);

    // Parse cookies from the cookie header string
    const parsedCookies: { name: string; value: string }[] = [];
    if (cookieHeader) {
        cookieHeader.split(";").forEach((cookie) => {
            const [name, ...valueParts] = cookie.trim().split("=");
            if (name) {
                parsedCookies.push({
                    name: name.trim(),
                    value: valueParts.join("=").trim(),
                });
            }
        });
    }

    mcpDebugInfo.push(`Parsed cookies: ${parsedCookies.map((c) => c.name).join(", ") || "NONE"}`);

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return parsedCookies;
                },
                setAll() {
                    // MCP tools are stateless, we don't need to set cookies
                },
            },
        }
    );
}
