ALTER TABLE public.hackathons ADD COLUMN survey_open boolean NOT NULL DEFAULT false;

CREATE TABLE public.survey_questions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  question     text NOT NULL,
  type         text NOT NULL CHECK (type IN ('text', 'rating')),
  "order"      int NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.survey_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  question_id  uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_text  text,
  answer_rating int CHECK (answer_rating BETWEEN 1 AND 5),
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, question_id)
);
