-- ===========================================
-- 005: Add simple storage policies for authenticated uploads
-- RLS on tables is disabled, but storage needs explicit policies
-- ===========================================

-- Allow authenticated users to read all files (buckets are public anyway)
create policy "Authenticated can read all files"
  on storage.objects for select
  using (auth.uid() is not null);

-- Allow authenticated users to upload files
create policy "Authenticated can upload files"
  on storage.objects for insert
  with check (auth.uid() is not null);

-- Allow authenticated users to update/overwrite their uploads
create policy "Authenticated can update files"
  on storage.objects for update
  using (auth.uid() is not null);

-- Allow authenticated users to delete files
create policy "Authenticated can delete files"
  on storage.objects for delete
  using (auth.uid() is not null);
