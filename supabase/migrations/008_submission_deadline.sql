-- Add submission deadline to app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS submission_deadline timestamptz;
