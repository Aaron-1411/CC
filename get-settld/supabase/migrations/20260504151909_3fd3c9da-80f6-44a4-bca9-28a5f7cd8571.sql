
CREATE TABLE IF NOT EXISTS public.hpi_cache (
  lad_code text PRIMARY KEY,
  lad_name text,
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hpi_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read hpi_cache" ON public.hpi_cache FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.rental_cache (
  region text PRIMARY KEY,
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rental_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read rental_cache" ON public.rental_cache FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.boe_rate_cache (
  id text PRIMARY KEY DEFAULT 'base_rate',
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.boe_rate_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read boe_rate_cache" ON public.boe_rate_cache FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.epc_cache (
  postcode text PRIMARY KEY,
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.epc_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read epc_cache" ON public.epc_cache FOR SELECT USING (true);
