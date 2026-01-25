import {
  pgTable,
  uuid,
  text,
  timestamp,
  vector,
  index,
} from "drizzle-orm/pg-core";

// Notes table
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    userId: uuid("user_id").notNull(),
    source: text("source").notNull().default("local"), // 'local' | 'notion' | 'google'
    sourceId: text("source_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_notes_user_id").on(table.userId),
    index("idx_notes_source").on(table.source),
    index("idx_notes_created_at").on(table.createdAt),
  ]
);

// Note embeddings table for vector search
export const noteEmbeddings = pgTable(
  "note_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_note_embeddings_note_id").on(table.noteId),
    index("idx_note_embeddings_user_id").on(table.userId),
  ]
);

// Type exports for use throughout the app
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteEmbedding = typeof noteEmbeddings.$inferSelect;
export type NewNoteEmbedding = typeof noteEmbeddings.$inferInsert;
