-- Allow users to request an API key
alter table profiles add column api_key_requested boolean not null default false;
alter table profiles add column api_key_requested_at timestamptz;
