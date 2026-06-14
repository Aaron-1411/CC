
CREATE TABLE public.validation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  workbook_id uuid REFERENCES public.workbooks(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  scorecard jsonb NOT NULL DEFAULT '{}'::jsonb,
  reconciliation jsonb NOT NULL DEFAULT '[]'::jsonb,
  lineage jsonb NOT NULL DEFAULT '[]'::jsonb,
  anomalies jsonb NOT NULL DEFAULT '[]'::jsonb,
  formula_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.validation_reports TO authenticated;
GRANT ALL ON public.validation_reports TO service_role;
ALTER TABLE public.validation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own validation_reports" ON public.validation_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_validation_reports_updated BEFORE UPDATE ON public.validation_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.commentary_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  workbook_id uuid REFERENCES public.workbooks(id) ON DELETE SET NULL,
  validation_report_id uuid REFERENCES public.validation_reports(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  body_markdown text NOT NULL DEFAULT '',
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commentary_drafts TO authenticated;
GRANT ALL ON public.commentary_drafts TO service_role;
ALTER TABLE public.commentary_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own commentary_drafts" ON public.commentary_drafts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_commentary_drafts_updated BEFORE UPDATE ON public.commentary_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  gate text NOT NULL,
  target_id uuid NOT NULL,
  decision text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own approvals" ON public.approvals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_validation_reports_job ON public.validation_reports(job_id);
CREATE INDEX idx_commentary_drafts_job ON public.commentary_drafts(job_id);
CREATE INDEX idx_approvals_job ON public.approvals(job_id);
