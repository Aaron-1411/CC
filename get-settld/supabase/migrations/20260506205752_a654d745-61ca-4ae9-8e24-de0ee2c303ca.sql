CREATE TABLE public.calculator_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_upfront numeric,
  source text NOT NULL DEFAULT 'web',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calculator_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.calculator_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

CREATE POLICY "Admins read leads"
  ON public.calculator_leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_calculator_leads_created_at ON public.calculator_leads (created_at DESC);
CREATE INDEX idx_calculator_leads_email ON public.calculator_leads (lower(email));