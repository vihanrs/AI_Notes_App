"use server";

import { revalidatePath } from "next/cache";
import * as notesService from "@/lib/services/notes.service";
import { getAuthenticatedUser } from "@/lib/services/auth.service";
import { ActionResult } from "@/lib/types";
import { Note } from "@/lib/db";

export async function createNoteAction(title: string, body: string): Promise<ActionResult<{ note: Note }>> {
    const user = await getAuthenticatedUser();

    try {
        const note = await notesService.createNote({
            title,
            body,
            userId: user.id,
        });

        revalidatePath("/notes");

        return {
            success: true,
            message: "Note created successfully",
            note
        };
    } catch (error) {
        console.error("Failed to create note:", error);
        return {
            success: false,
            error: "Failed to create note"
        };
    }
}

export async function deleteNoteAction(noteId: string): Promise<ActionResult> {
    const user = await getAuthenticatedUser();

    try {
        await notesService.deleteNote({
            noteId,
            userId: user.id,
        });

        // Revalidate the page
        revalidatePath("/notes");

        return {
            success: true,
            message: "Note deleted successfully"
        };
    } catch (error) {
        console.error("Failed to delete note:", error);
        return {
            success: false,
            error: "Failed to delete note"
        };
    }
}

export async function updateNoteAction(noteId: string, title: string, body: string): Promise<ActionResult> {
    const user = await getAuthenticatedUser();

    try {
        await notesService.updateNote({
            noteId,
            title,
            body,
            userId: user.id,
        });

        // Revalidate the page
        revalidatePath("/notes");

        return {
            success: true,
            message: "Note updated successfully"
        };
    } catch (error) {
        console.error("Failed to update note:", error);
        return {
            success: false,
            error: "Failed to update note"
        };
    }
}
