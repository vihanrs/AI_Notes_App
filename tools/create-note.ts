import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getMcpAuthenticatedUser, requireToolPermission } from "@/lib/services/auth.service";
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

export default async function createNote({
    title,
    body,
}: InferSchema<typeof schema>): Promise<ActionResult<{ note: Note }>> {
    const debugInfo: string[] = [];
    debugInfo.push(`Tool called with title: "${title}", body length: ${body?.length}`);

    try {
        debugInfo.push("Getting authenticated user...");
        const authContext = await getMcpAuthenticatedUser();
        requireToolPermission(authContext, "create-note");
        const { user } = authContext;

        debugInfo.push(`User obtained: ${user.id}`);

        debugInfo.push("Creating note...");
        const note = await notesService.createNote({
            title,
            body,
            userId: user.id,
            source: "ai",
        });
        debugInfo.push(`Note created: ${note.id}`);

        // Revalidate for server-side cache
        revalidatePath("/notes");

        return {
            success: true,
            message: `Note "${title}" created successfully!`,
            note: note, // We return the whole note object now
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debugInfo.push(`Error: ${errorMessage}`);
        return {
            success: false,
            error: `Failed to create note: ${errorMessage}`,
            debug: debugInfo,
        };
    }
}
