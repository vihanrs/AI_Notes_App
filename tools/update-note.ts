import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getMcpAuthenticatedUser } from "@/lib/services/auth.service";
import * as notesService from "@/lib/services/notes.service";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types";

export const schema = {
    noteId: z.string().describe("The ID of the note to update"),
    title: z.string().describe("The new title for the note"),
    body: z.string().describe("The new body/content for the note"),
};

export const metadata: ToolMetadata = {
    name: "update_note",
    description:
        "Update an existing note. Use this when the user asks to edit, modify, or update a note. You need the note ID which can be obtained from search_notes or list_notes.",
    annotations: {
        title: "Update Note",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
};

export default async function updateNote({
    noteId,
    title,
    body,
}: InferSchema<typeof schema>): Promise<ActionResult<{ noteId: string }>> {
    try {
        const user = await getMcpAuthenticatedUser();

        await notesService.updateNote({
            noteId,
            title,
            body,
            userId: user.id,
        });

        revalidatePath("/notes");

        return {
            success: true,
            message: `Note "${title}" updated successfully!`,
            noteId,
        };
    } catch (error) {
        console.error("Failed to update note via MCP:", error);
        return {
            success: false,
            error: "Failed to update note. Please try again.",
        };
    }
}
