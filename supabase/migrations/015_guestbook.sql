-- Guestbook for Geocities mode
CREATE TABLE public.guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  message text NOT NULL CHECK (char_length(message) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Allow anyone to read
ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guestbook_read" ON public.guestbook FOR SELECT USING (true);
CREATE POLICY "guestbook_insert" ON public.guestbook FOR INSERT WITH CHECK (true);
