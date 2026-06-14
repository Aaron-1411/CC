
-- Job type enum
CREATE TYPE public.job_type AS ENUM ('spreadsheet', 'research');
CREATE TYPE public.job_status AS ENUM ('active', 'completed', 'failed');
CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system', 'tool');

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- JOBS
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.job_type NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled job',
  status public.job_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own jobs" ON public.jobs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX jobs_user_idx ON public.jobs(user_id, updated_at DESC);

-- WORKBOOKS
CREATE TABLE public.workbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'source', -- source | working | output
  size_bytes BIGINT,
  sheet_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workbooks TO authenticated;
GRANT ALL ON public.workbooks TO service_role;
ALTER TABLE public.workbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workbooks" ON public.workbooks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX workbooks_job_idx ON public.workbooks(job_id);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  role public.message_role NOT NULL,
  content TEXT,
  parts JSONB,
  step_log JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX messages_job_idx ON public.messages(job_id, created_at);

-- RECIPES
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recipes" ON public.recipes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RESEARCH REPORTS
CREATE TABLE public.research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  subject_url TEXT,
  subject_summary TEXT,
  competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_reports TO authenticated;
GRANT ALL ON public.research_reports TO service_role;
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports" ON public.research_reports FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.research_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for workbooks bucket (files keyed by user_id/...)
CREATE POLICY "users read own workbook files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'workbooks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users insert own workbook files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'workbooks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users update own workbook files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'workbooks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users delete own workbook files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'workbooks' AND (storage.foldername(name))[1] = auth.uid()::text);
