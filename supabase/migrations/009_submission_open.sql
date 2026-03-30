-- Add submission open toggle to app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS submission_open boolean DEFAULT false;
