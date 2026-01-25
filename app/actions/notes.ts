"use server";

import { createClient } from "@/lib/supabase/server";
import { db, notes, noteEmbeddings } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { generateEmbeddings } from "@/lib/embeddings";
import { revalidatePath } from "next/cache";

export async function createNoteAction(title: string, body: string) {
    const user = await getAuthenticatedUser();
    const embeddings = await generateNoteEmbeddings(title, body);

    // Use transaction to insert note and embeddings together
    let note;
    try {
        note = await db.transaction(async (tx) => {
            // Insert the note
            const [createdNote] = await tx
                .insert(notes)
                .values({
                    title,
                    body,
                    userId: user.id,
                    source: "local",
                })
                .returning();

            // Insert the embeddings
            const embeddingRecords = embeddings.map((emb) => ({
                content: emb.content,
                embedding: emb.embedding,
                noteId: createdNote.id,
                userId: user.id,
            }));

            await tx.insert(noteEmbeddings).values(embeddingRecords);

            return createdNote;
        });
    } catch (error) {
        console.error("Failed to create note:", error);
        throw new Error("Failed to create note");
    }

    // Revalidate the notes page so it shows the new data instantly
    revalidatePath("/notes");

    return { success: true, note };
}

export async function deleteNoteAction(noteId: string) {
    const user = await getAuthenticatedUser();

    // Note: Embeddings are deleted automatically via CASCADE constraint in the DB schema
    // (note_embeddings.note_id references notes.id with ON DELETE CASCADE)
    try {
        await db
            .delete(notes)
            .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)));
    } catch (error) {
        console.error("Failed to delete note:", error);
        throw new Error("Failed to delete note");
    }

    // Revalidate the page
    revalidatePath("/notes");

    return { success: true };
}

export async function updateNoteAction(noteId: string, title: string, body: string) {
    const user = await getAuthenticatedUser();
    const embeddings = await generateNoteEmbeddings(title, body);

    // Use transaction to update note and embeddings together
    try {
        await db.transaction(async (tx) => {
            // Update the note
            await tx
                .update(notes)
                .set({ title, body, updatedAt: new Date() })
                .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)));

            // Delete old embeddings
            await tx.delete(noteEmbeddings).where(eq(noteEmbeddings.noteId, noteId));

            // Insert new embeddings
            const embeddingRecords = embeddings.map((emb) => ({
                content: emb.content,
                embedding: emb.embedding,
                noteId: noteId,
                userId: user.id,
            }));

            await tx.insert(noteEmbeddings).values(embeddingRecords);
        });
    } catch (error) {
        console.error("Failed to update note:", error);
        throw new Error("Failed to update note");
    }

    // Revalidate the page
    revalidatePath("/notes");

    return { success: true };
}

// Helper to get authenticated user or throw
async function getAuthenticatedUser() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    return user;
}

// Helper to generate embeddings for note content
async function generateNoteEmbeddings(title: string, body: string) {
    const textToEmbed = `${title}\n\n${body}`;
    try {
        return await generateEmbeddings(textToEmbed);
    } catch (error) {
        console.error("Failed to generate AI embeddings:", error);
        throw new Error("Failed to generate embeddings for note");
    }
}