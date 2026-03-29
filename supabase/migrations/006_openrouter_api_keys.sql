-- Add OpenRouter API key fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS openrouter_api_key text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS openrouter_key_hash text;
