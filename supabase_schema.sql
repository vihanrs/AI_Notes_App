-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'local',  -- 'local' | 'notion' | 'google'
  source_id TEXT,                         -- external ID (notion page id, google doc id)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note embeddings table (separate for vector search)
CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User integrations table (for Phase 7+)
-- CREATE TABLE user_integrations (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   provider TEXT NOT NULL,              -- 'notion' | 'google'
--   access_token TEXT NOT NULL,
--   refresh_token TEXT,                  -- Google tokens expire
--   workspace_name TEXT,                 -- Display name
--   last_synced_at TIMESTAMPTZ,
--   created_at TIMESTAMPTZ DEFAULT NOW(),

--   UNIQUE(user_id, provider)
-- );

-- Indexes for performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_source ON notes(source);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX idx_note_embeddings_user_id ON note_embeddings(user_id);
-- CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);

-- Vector index for similarity search
CREATE INDEX idx_note_embeddings_vector ON note_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;
--  ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Note embeddings policies
CREATE POLICY "Users can view their own embeddings"
  ON note_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings"
  ON note_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings"
  ON note_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- User integrations policies
-- CREATE POLICY "Users can view their own integrations"
--   ON user_integrations FOR SELECT
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own integrations"
--   ON user_integrations FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own integrations"
--   ON user_integrations FOR UPDATE
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own integrations"
--   ON user_integrations FOR DELETE
--   USING (auth.uid() = user_id);

-- Function to search notes by semantic similarity
CREATE OR REPLACE FUNCTION search_notes(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_user_id UUID
)
RETURNS TABLE (
  note_id UUID,
  title TEXT,
  body TEXT,
  source TEXT,
  chunk_content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (n.id)
    n.id AS note_id,
    n.title,
    n.body,
    n.source,
    ne.content AS chunk_content,
    1 - (ne.embedding <=> query_embedding) AS similarity,
    n.created_at
  FROM note_embeddings ne
  JOIN notes n ON ne.note_id = n.id
  WHERE ne.user_id = filter_user_id
    AND 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY n.id, similarity DESC
  LIMIT match_count;
END;
$$;

-- Step 1: Create a function that sets updated_at to NOW()
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Tell the notes table to use that function whenever a row is updated
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();