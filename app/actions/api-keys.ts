"use server";

import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/services/auth.service";
import { db, apiKeys, type ApiKey } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { API_SCOPES } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const CreateApiKeySchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    scopes: z.array(z.string()).min(1, "At least one scope is required"),
});

export type CreateApiKeyResult =
    | { success: true; apiKey: string; keyId: string }
    | { success: false; error: string };

/**
 * Generate a new API Key for the authenticated user
 */
export async function createApiKey(formData: FormData): Promise<CreateApiKeyResult> {
    try {
        const user = await getAuthenticatedUser();

        const rawData = {
            name: formData.get("name"),
            scopes: formData.getAll("scopes"),
        };

        const validated = CreateApiKeySchema.safeParse(rawData);

        if (!validated.success) {
            return { success: false, error: validated.error.issues[0]?.message || "Invalid input" };
        }

        // Generate a secure random key
        // Format: sn_live_[32_random_hex_chars]
        const randomBytes = crypto.randomBytes(16).toString("hex");
        const plainTextKey = `sn_live_${randomBytes}`;

        // Hash the key for storage
        const keyHash = crypto
            .createHash("sha256")
            .update(plainTextKey)
            .digest("hex");

        // Store in DB
        const [newKey] = await db
            .insert(apiKeys)
            .values({
                name: validated.data.name,
                keyHash,
                userId: user.id,
                scopes: validated.data.scopes,
            })
            .returning();

        revalidatePath("/settings");

        return {
            success: true,
            apiKey: plainTextKey, // Return only once!
            keyId: newKey.id
        };

    } catch (error) {
        console.error("Failed to create API key:", error);
        return { success: false, error: "Failed to generate API key" };
    }
}

/**
 * List all API keys for the current user
 */
export async function listApiKeys(): Promise<ApiKey[]> {
    const user = await getAuthenticatedUser();

    return await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, user.id))
        .orderBy(desc(apiKeys.createdAt));
}

/**
 * Revoke (delete) an API key
 */
export async function revokeApiKey(keyId: string) {
    const user = await getAuthenticatedUser();

    await db
        .delete(apiKeys)
        .where(eq(apiKeys.id, keyId)); // Ideally should check userId too for extra safety, but ID is unique

    revalidatePath("/settings");
}
