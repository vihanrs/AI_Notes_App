import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { resolveToolUser, requireToolPermission } from "@/lib/services/auth.service";
import * as notesService from "@/lib/services/notes.service";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types";

export const schema = {
    noteId: z.string().describe("The ID of the note to delete"),
};

export const metadata: ToolMetadata = {
    name: "delete_note",
    description:
        "Delete a note permanently. Use this when the user asks to delete or remove a note. You need the note ID which can be obtained from search_notes or list_notes. Always confirm with the user before deleting.",
    annotations: {
        title: "Delete Note",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
    },
};

export default async function deleteNote(
    { noteId }: InferSchema<typeof schema>,
    { authInfo }: ToolExtraArguments
): Promise<ActionResult<{ noteId: string }>> {
    try {
        const { userId, scopes } = await resolveToolUser(authInfo);
        requireToolPermission({ scopes }, "delete-note");

        // Get the note first to return its title in the response
        const note = await notesService.getNote({
            noteId,
            userId,
        });

        if (!note) {
            return {
                success: false,
                error: "Note not found or you don't have permission to delete it.",
            };
        }

        await notesService.deleteNote({
            noteId,
            userId,
        });

        revalidatePath("/notes");

        return {
            success: true,
            message: `Note "${note.title}" deleted successfully!`,
            noteId,
        };
    } catch (error) {
        console.error("Failed to delete note via MCP:", error);
        return {
            success: false,
            error: "Failed to delete note. Please try again.",
        };
    }
}
