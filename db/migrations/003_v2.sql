-- Migration 003 — V2: Rules Engine, Analysis, Planning, Generation
-- Run in Supabase SQL editor

-- ============================================================
-- Extend entries type constraint to include v2 types
-- ============================================================
ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_type_check;
ALTER TABLE entries ADD CONSTRAINT entries_type_check
  CHECK (type IN ('task', 'note', 'decision', 'meet', 'idea', 'log', 'analysis', 'plan', 'post', 'file'));

-- ============================================================
-- rules — AI behavior rules injected at session start
-- ============================================================
CREATE TABLE IF NOT EXISTS rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text NOT NULL,
  category    text CHECK (category IN ('behavior', 'memory', 'output', 'general')),
  active      boolean NOT NULL DEFAULT true,
  priority    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER rules_updated_at
  BEFORE UPDATE ON rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default rules
INSERT INTO rules (title, content, category, priority) VALUES
  ('Language',       'Always respond in Portuguese (PT)',                                                    'behavior', 10),
  ('No duplicates',  'Before creating an entry, search for duplicates using search_memory first',           'memory',    9),
  ('Tag discipline', 'Always tag entries with the relevant project name',                                   'memory',    8),
  ('Concise output', 'Keep responses under 150 words unless detail is explicitly requested',                'output',    7),
  ('Session close',  'Always close the session with a summary entry (type: log) when work is done',        'behavior',  6)
ON CONFLICT DO NOTHING;

-- ============================================================
-- generation_profiles — per-platform content generation config
-- ============================================================
CREATE TABLE IF NOT EXISTS generation_profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform       text NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'newsletter')),
  intent         text NOT NULL,
  tone           text NOT NULL,
  topics         text[] NOT NULL DEFAULT '{}',
  avoid          text[] NOT NULL DEFAULT '{}',
  post_frequency text,
  language       text DEFAULT 'english',
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform)
);

CREATE TRIGGER generation_profiles_updated_at
  BEFORE UPDATE ON generation_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Extend embeddings for file chunk support
-- ============================================================
ALTER TABLE embeddings
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'entry'
    CHECK (source_type IN ('entry', 'file')),
  ADD COLUMN IF NOT EXISTS file_path   text;

-- file_path is only set when source_type = 'file'
-- entry_id is nullable for file chunks (no matching entry needed)
ALTER TABLE embeddings ALTER COLUMN entry_id DROP NOT NULL;
