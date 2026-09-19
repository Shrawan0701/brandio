ALTER TABLE users ADD COLUMN IF NOT EXISTS public_slug TEXT;

UPDATE users
SET public_slug = lower(regexp_replace(username, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(id::text), 1, 3)
WHERE public_slug IS NULL OR public_slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS users_public_slug_unique
ON users (lower(public_slug))
WHERE public_slug IS NOT NULL;
