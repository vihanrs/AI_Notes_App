"use server";

import { createClient } from "@/lib/supabase/server";
import { generateEmbeddings } from "@/lib/embeddings";
import { revalidatePath } from "next/cache";

export async function createNoteAction(title: string, body: string) {
    const supabase = await createClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // Insert the note into the 'notes' table
    const { data: note, error: noteError } = await supabase
        .from("notes")
        .insert({
            title,
            body,
            user_id: user.id,
            source: "local",
        })
        .select()
        .single();

    if (noteError) {
        throw new Error(noteError.message);
    }

    try {
        // Generate AI embeddings for the note content
        // We combine title and body for better context
        const textToEmbed = `${title}\n\n${body}`;
        const embeddings = await generateEmbeddings(textToEmbed);

        // Insert the embeddings into the 'note_embeddings' table
        const embeddingRecords = embeddings.map((emb) => ({
            content: emb.content,
            embedding: emb.embedding,
            note_id: note.id,
            user_id: user.id,
        }));

        const { error: embeddingError } = await supabase
            .from("note_embeddings")
            .insert(embeddingRecords);

        if (embeddingError) {
            console.error("Error inserting embeddings:", embeddingError);
            // We could delete the note here if embeddings are critical
            await supabase.from('notes').delete().eq('id', note.id);
        }
    } catch (error) {
        console.error("Failed to generate AI embeddings:", error);
        // We don't throw here so the note is still saved even if AI fails
    }

    // Revalidate the notes page so it shows the new data instantly
    revalidatePath("/notes");

    return { success: true, note };
}

export async function deleteNoteAction(noteId: string) {
    const supabase = await createClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // Delete the note (embeddings will be deleted automatically due to CASCADE in DB)
    const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id); // Ensure user can only delete their own notes

    if (error) {
        throw new Error(error.message);
    }

    // Revalidate the page
    revalidatePath("/notes");

    return { success: true };
}

export async function updateNoteAction(noteId: string, title: string, body: string) {
    const supabase = await createClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // Update the note
    const { error: noteError } = await supabase
        .from("notes")
        .update({ title, body, updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .eq("user_id", user.id);

    if (noteError) {
        throw new Error(noteError.message);
    }

    try {
        // Delete old embeddings
        await supabase.from("note_embeddings").delete().eq("note_id", noteId);

        // Generate new embeddings
        const textToEmbed = `${title}\n\n${body}`;
        const embeddings = await generateEmbeddings(textToEmbed);

        const embeddingRecords = embeddings.map((emb) => ({
            content: emb.content,
            embedding: emb.embedding,
            note_id: noteId,
            user_id: user.id,
        }));

        await supabase.from("note_embeddings").insert(embeddingRecords);
    } catch (error) {
        console.error("Failed to update AI embeddings:", error);
    }

    // Revalidate the page
    revalidatePath("/notes");

    return { success: true };
}
