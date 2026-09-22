-- Track free-plan deal usage as a lifetime counter.
-- Deleting a deal must not restore free deal capacity.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deal_creations_used INTEGER NOT NULL DEFAULT 0;

UPDATE users u
SET deal_creations_used = GREATEST(u.deal_creations_used, counts.created_count)
FROM (
  SELECT user_id, COUNT(*)::int AS created_count
  FROM deals
  GROUP BY user_id
) counts
WHERE u.id = counts.user_id;
