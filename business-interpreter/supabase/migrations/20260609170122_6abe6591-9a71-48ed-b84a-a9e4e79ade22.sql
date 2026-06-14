-- Process onboarding Q&A thread
CREATE TABLE public.process_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('ai','user')),
  content text NOT NULL,
  kind text NOT NULL DEFAULT 'message' CHECK (kind IN ('message','question','answer','suggestion')),
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.process_questions TO authenticated;
GRANT ALL ON public.process_questions TO service_role;
ALTER TABLE public.process_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own process_questions" ON public.process_questions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_pq_process ON public.process_questions(process_id, created_at);

-- Demonstration recordings
CREATE TABLE public.process_demonstrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES public.processes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  duration_sec int,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','transcribing','outlining','ready','failed')),
  transcript text,
  outline jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.process_demonstrations TO authenticated;
GRANT ALL ON public.process_demonstrations TO service_role;
ALTER TABLE public.process_demonstrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own demos" ON public.process_demonstrations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_demo_updated BEFORE UPDATE ON public.process_demonstrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sheet analyzer
CREATE TABLE public.sheet_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scanning','questioning','analyzing','ready','failed')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  tab_map jsonb,
  lineage jsonb,
  narrative text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sheet_analyses TO authenticated;
GRANT ALL ON public.sheet_analyses TO service_role;
ALTER TABLE public.sheet_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sheet_analyses" ON public.sheet_analyses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_sa_updated BEFORE UPDATE ON public.sheet_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sheet_analysis_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.sheet_analyses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('ai','user')),
  content text NOT NULL,
  topic text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sheet_analysis_questions TO authenticated;
GRANT ALL ON public.sheet_analysis_questions TO service_role;
ALTER TABLE public.sheet_analysis_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saq" ON public.sheet_analysis_questions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_saq_analysis ON public.sheet_analysis_questions(analysis_id, created_at);