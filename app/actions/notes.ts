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
