-- ─── Migration 008: constraints, indexes, triggers ───────────────────────────
-- BUG-004: Unique constraint for watcher deduplication
ALTER TABLE agent_messages
  ADD CONSTRAINT agent_messages_dedupe_unique
  UNIQUE (session_id, from_agent, created_at);

-- BUG-013: CHECK constraints on agent tables
ALTER TABLE agent_sessions
  ADD CONSTRAINT agent_sessions_status_check
  CHECK (status IN ('active', 'completed', 'failed'));

ALTER TABLE agent_messages
  ADD CONSTRAINT agent_messages_type_check
  CHECK (type IN ('task', 'result', 'request', 'question', 'answer', 'context', 'state', 'error'));

ALTER TABLE agent_messages
  ADD CONSTRAINT agent_messages_verdict_check
  CHECK (verdict IS NULL OR verdict IN ('pass', 'fail', 'weak'));

-- BUG-016: Index on embeddings.entry_id for faster JOINs
CREATE INDEX IF NOT EXISTS embeddings_entry_id_idx ON embeddings(entry_id);

-- BUG-020: Add updated_at to people
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS people_updated_at ON people;
CREATE TRIGGER people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- BUG-021: UNIQUE constraint on people.name
ALTER TABLE people
  ADD CONSTRAINT people_name_unique UNIQUE (name);

-- BUG-015: Trigger for chat_sessions.message_count
CREATE OR REPLACE FUNCTION increment_chat_message_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_count ON chat_messages;
CREATE TRIGGER chat_messages_count
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION increment_chat_message_count();
