import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { requireToolPermission } from "@/lib/services/auth.service";
import * as notesService from "@/lib/services/notes.service";
import { ActionResult } from "@/lib/types";
import { AI_CONFIG } from "@/lib/ai/config";

export const schema = {
    query: z.string().describe("The search query to find relevant notes"),
};

export const metadata: ToolMetadata = {
    name: "search_notes",
    description:
        "Search the user's notes using semantic search to find relevant information. Use this when the user asks questions about their notes or wants to find specific information.",
    annotations: {
        title: "Search Notes",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
};

export type SearchResult = {
    id: string;
    title: string;
    content: string;
    similarity: string;
};

export default async function searchNotes(
    { query }: InferSchema<typeof schema>,
    { authInfo }: ToolExtraArguments
): Promise<ActionResult<{ notes: SearchResult[] }>> {
    try {
        if (!authInfo?.extra?.userId) {
            return { success: false, error: "Unauthorized: Please provide a valid API key." };
        }

        requireToolPermission({ scopes: authInfo.scopes }, "search-notes");
        const userId = authInfo.extra.userId as string;

        const results = await notesService.searchNotes({
            query,
            userId,
            matchThreshold: AI_CONFIG.search.matchThreshold,
            matchCount: AI_CONFIG.search.matchCount,
        });

        if (results.length === 0) {
            return {
                success: true,
                notes: [],
                message: "No relevant notes found in your database. Suggest creating a note first.",
            };
        }

        // Format results for the AI
        const formattedNotes = results.map((n) => ({
            id: n.note_id,
            title: n.title,
            content: n.chunk_content || n.body,
            similarity: Math.round(n.similarity * 100) + "%",
        }));

        return {
            success: true,
            notes: formattedNotes,
            message: `Found ${results.length} relevant notes.`,
        };
    } catch (error) {
        console.error("Failed to search notes via MCP:", error);
        return {
            success: false,
            error: "Failed to search notes. Please try again.",
        };
    }
}
