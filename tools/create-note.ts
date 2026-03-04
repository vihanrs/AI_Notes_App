import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";
import { resolveToolUser, requireToolPermission } from "@/lib/services/auth.service";
import * as notesService from "@/lib/services/notes.service";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types";
import { type Note } from "@/lib/db";

export const schema = {
    title: z.string().describe("The title of the note to create"),
    body: z.string().describe("The body/content of the note"),
};

export const metadata: ToolMetadata = {
    name: "create_note",
    description:
        "Create a new note for the user. Use this when the user asks to create, add, or save a new note.",
    annotations: {
        title: "Create Note",
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
    },
};

export default async function createNote(
    { title, body }: InferSchema<typeof schema>,
    { authInfo }: ToolExtraArguments
): Promise<ActionResult<{ note: Note }>> {
    try {
        const { userId, scopes } = await resolveToolUser(authInfo);
        requireToolPermission({ scopes }, "create-note");

        const note = await notesService.createNote({
            title,
            body,
            userId,
            source: "ai",
        });

        revalidatePath("/notes");

        return {
            success: true,
            message: `Note "${title}" created successfully!`,
            note,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            error: `Failed to create note: ${errorMessage}`,
        };
    }
}
