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

// API Keys table for external MCP client authentication
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), // User-friendly name like "Claude Desktop"
    keyHash: text("key_hash").notNull().unique(), // SHA-256 hash of the actual key
    userId: uuid("user_id").notNull(),
    // Scoped permissions: array of allowed operations
    // Example: ["notes:read", "notes:write", "notes:delete"]
    // "notes:read" = search_notes, list_notes
    // "notes:write" = create_note, update_note
    // "notes:delete" = delete_note
    scopes: text("scopes").array().notNull().default(["notes:read"]),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_api_keys_user_id").on(table.userId),
    index("idx_api_keys_key_hash").on(table.keyHash),
  ]
);

// Type exports for use throughout the app
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteEmbedding = typeof noteEmbeddings.$inferSelect;
export type NewNoteEmbedding = typeof noteEmbeddings.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
