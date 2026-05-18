-- 1. Lock down scenario_collaborators UPDATE: prevent privilege escalation.
-- Only allow invitees to set accepted_at + collaborator_user_id, and never change role/owner/scenario.
DROP POLICY IF EXISTS "Invitee accepts own invite" ON public.scenario_collaborators;

CREATE POLICY "Invitee accepts own invite"
ON public.scenario_collaborators
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = collaborator_user_id)
  OR (lower(invited_email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text)))
)
WITH CHECK (
  -- After update, the row must still belong to the same invitee, with original role/owner/scenario.
  (auth.uid() = collaborator_user_id)
  AND role = (SELECT sc.role FROM public.scenario_collaborators sc WHERE sc.id = scenario_collaborators.id)
  AND owner_id = (SELECT sc.owner_id FROM public.scenario_collaborators sc WHERE sc.id = scenario_collaborators.id)
  AND scenario_id = (SELECT sc.scenario_id FROM public.scenario_collaborators sc WHERE sc.id = scenario_collaborators.id)
  AND invited_email = (SELECT sc.invited_email FROM public.scenario_collaborators sc WHERE sc.id = scenario_collaborators.id)
);

-- 2. Revoke EXECUTE on internal handle_new_user from PUBLIC/authenticated.
-- It is invoked by an auth trigger as service-role; signed-in users must not be able to call it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3. Add an index to speed up collaborator lookups (scalability).
CREATE INDEX IF NOT EXISTS idx_scenario_collaborators_scenario ON public.scenario_collaborators(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_collaborators_user ON public.scenario_collaborators(collaborator_user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_collaborators_email ON public.scenario_collaborators(lower(invited_email));
CREATE INDEX IF NOT EXISTS idx_saved_properties_user ON public.saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_scenarios_user ON public.saved_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_verdict_snapshots_user ON public.verdict_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_mip_assessments_user ON public.mip_assessments(user_id);

-- 4. Cache freshness indexes (scalability).
CREATE INDEX IF NOT EXISTS idx_comparables_cache_fetched ON public.comparables_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_crime_cache_fetched ON public.crime_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_transport_cache_fetched ON public.transport_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_epc_cache_fetched ON public.epc_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_hpi_cache_fetched ON public.hpi_cache(fetched_at);