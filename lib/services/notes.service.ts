import { db, notes, noteEmbeddings, Note } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { generateEmbeddings } from "@/lib/embeddings";

/**
 * Notes Service - Core business logic for note operations
 * Used by both Server Actions and MCP Tools
 */

export type NoteSource = "local" | "ai" | "notion" | "google";

export type CreateNoteInput = {
    title: string;
    body: string;
    userId: string;
    source?: NoteSource;
};

export type UpdateNoteInput = {
    noteId: string;
    title: string;
    body: string;
    userId: string;
};

export type DeleteNoteInput = {
    noteId: string;
    userId: string;
};

export type ListNotesInput = {
    userId: string;
    limit?: number;
};

export type GetNoteInput = {
    noteId: string;
    userId: string;
};

/**
 * Create a new note with embeddings
 */
export async function createNote({ title, body, userId, source = "local" }: CreateNoteInput): Promise<Note> {
    // Generate embeddings for semantic search
    const embeddings = await generateNoteEmbeddings(title, body);

    // Use transaction to insert note and embeddings together
    const note = await db.transaction(async (tx) => {
        // Insert the note
        const [createdNote] = await tx
            .insert(notes)
            .values({
                title,
                body,
                userId,
                source,
            })
            .returning();

        // Insert the embeddings
        const embeddingRecords = embeddings.map((emb) => ({
            content: emb.content,
            embedding: emb.embedding,
            noteId: createdNote.id,
            userId,
        }));

        await tx.insert(noteEmbeddings).values(embeddingRecords);

        return createdNote;
    });

    return note;
}

/**
 * Update an existing note and regenerate embeddings
 */
export async function updateNote({ noteId, title, body, userId }: UpdateNoteInput): Promise<void> {
    const embeddings = await generateNoteEmbeddings(title, body);

    await db.transaction(async (tx) => {
        // Update the note
        await tx
            .update(notes)
            .set({ title, body, updatedAt: new Date() })
            .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

        // Delete old embeddings
        await tx.delete(noteEmbeddings).where(eq(noteEmbeddings.noteId, noteId));

        // Insert new embeddings
        const embeddingRecords = embeddings.map((emb) => ({
            content: emb.content,
            embedding: emb.embedding,
            noteId,
            userId,
        }));

        await tx.insert(noteEmbeddings).values(embeddingRecords);
    });
}

/**
 * Delete a note (embeddings cascade automatically)
 */
export async function deleteNote({ noteId, userId }: DeleteNoteInput): Promise<void> {
    await db
        .delete(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
}

/**
 * Get a single note by ID
 */
export async function getNote({ noteId, userId }: GetNoteInput): Promise<Note | null> {
    const [note] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
        .limit(1);

    return note || null;
}

/**
 * List all notes for a user
 */
export async function listNotes({ userId, limit = 50 }: ListNotesInput): Promise<Note[]> {
    const userNotes = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.createdAt))
        .limit(limit);

    return userNotes;
}

/**
 * Helper to generate embeddings for note content
 */
async function generateNoteEmbeddings(title: string, body: string) {
    const textToEmbed = `${title}\n\n${body}`;
    try {
        return await generateEmbeddings(textToEmbed);
    } catch (error) {
        console.error("Failed to generate AI embeddings:", error);
        throw new Error("Failed to generate embeddings for note");
    }
}
