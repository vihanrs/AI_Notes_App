import { xmcpHandler, withAuth, type VerifyToken } from "@xmcp/adapter";
import { db, apiKeys } from "@/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const verifyToken: VerifyToken = async (req: Request, bearerToken?: string) => {
    if (!bearerToken) return undefined;

    try {
        const keyHash = crypto.createHash("sha256").update(bearerToken).digest("hex");

        const [apiKeyRecord] = await db
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.keyHash, keyHash))
            .limit(1);

        if (!apiKeyRecord) return undefined;

        // Update last used timestamp (fire and forget)
        db.update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, apiKeyRecord.id))
            .execute()
            .catch(() => {});

        return {
            token: bearerToken,
            clientId: apiKeyRecord.id,
            scopes: apiKeyRecord.scopes,
            extra: {
                userId: apiKeyRecord.userId,
            },
        };
    } catch (err) {
        console.error("MCP Auth Error:", err);
        return undefined;
    }
};

const handler = withAuth(xmcpHandler, {
    verifyToken,
    required: true,
});

export { handler as GET, handler as POST };
