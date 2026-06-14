CREATE TABLE public.process_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  input_workbook_id uuid REFERENCES public.workbooks(id) ON DELETE SET NULL,
  expected_workbook_id uuid REFERENCES public.workbooks(id) ON DELETE SET NULL,
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  tolerance_numeric numeric NOT NULL DEFAULT 0.0001,
  last_run_at timestamptz,
  last_run_status text,
  last_run_diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.process_fixtures TO authenticated;
GRANT ALL ON public.process_fixtures TO service_role;

ALTER TABLE public.process_fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fixtures"
  ON public.process_fixtures FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_process_fixtures_updated_at
  BEFORE UPDATE ON public.process_fixtures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_process_fixtures_process ON public.process_fixtures(process_id);