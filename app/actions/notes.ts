"use server";

import { revalidatePath } from "next/cache";
import * as notesService from "@/lib/services/notes.service";
import { getAuthenticatedUser } from "@/lib/services/auth.service";

export async function createNoteAction(title: string, body: string) {
    const user = await getAuthenticatedUser();

    try {
        const note = await notesService.createNote({
            title,
            body,
            userId: user.id,
        });

        // Revalidate the notes page so it shows the new data instantly
        revalidatePath("/notes");

        return { success: true, note };
    } catch (error) {
        console.error("Failed to create note:", error);
        throw new Error("Failed to create note");
    }
}

export async function deleteNoteAction(noteId: string) {
    const user = await getAuthenticatedUser();

    try {
        await notesService.deleteNote({
            noteId,
            userId: user.id,
        });

        // Revalidate the page
        revalidatePath("/notes");

        return { success: true };
    } catch (error) {
        console.error("Failed to delete note:", error);
        throw new Error("Failed to delete note");
    }
}

export async function updateNoteAction(noteId: string, title: string, body: string) {
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

        return { success: true };
    } catch (error) {
        console.error("Failed to update note:", error);
        throw new Error("Failed to update note");
    }
}

