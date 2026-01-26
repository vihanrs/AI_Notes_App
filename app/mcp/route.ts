import { xmcpHandler, withAuth, type VerifyToken } from "@xmcp/adapter";
import { createClient } from "@/lib/supabase/server";

const verifyToken: VerifyToken = async (req: Request, bearerToken?: string) => {
    if (!bearerToken) return undefined;

    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser(bearerToken);

        if (error || !user) {
            console.error("MCP Auth Error:", error?.message);
            return undefined;
        }

        return {
            token: bearerToken,
            clientId: "nextjs-chat",
            scopes: [],
            extra: {
                userId: user.id,
                email: user.email,
            },
        };
    } catch (err) {
        console.error("MCP Auth Crash:", err);
        return undefined;
    }
};

const handler = withAuth(xmcpHandler, {
    verifyToken,
    required: true,
});

export { handler as GET, handler as POST };
