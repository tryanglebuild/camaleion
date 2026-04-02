-- Migration: add pinned column to entries
-- Run in Supabase SQL Editor

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

-- Partial index — only indexes rows where pinned = true (keeps it small)
CREATE INDEX IF NOT EXISTS entries_pinned_idx
  ON entries (created_at DESC)
  WHERE pinned = true;

-- Comment
COMMENT ON COLUMN entries.pinned IS 'User-starred entries appear at the top of lists and in the Overview pinned widget';
