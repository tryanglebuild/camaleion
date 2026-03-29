 ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_status_check;
 ALTER TABLE entries ADD CONSTRAINT entries_status_check 
   CHECK (status IN ('pending', 'in_progress', 'done', 'blocked'));