
CREATE TABLE public.barangay_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  geometry JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

ALTER TABLE public.barangay_boundaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barangay_boundaries_public_read" ON public.barangay_boundaries
  FOR SELECT USING (true);

CREATE POLICY "barangay_boundaries_admin_write" ON public.barangay_boundaries
  FOR ALL USING ((SELECT auth.role()) = 'service_role' OR public.is_admin());
