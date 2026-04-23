
-- Safety reports table for Facebook-sourced incident data
CREATE TABLE public.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_page_id TEXT,
  source_page_name TEXT,
  source_query TEXT,
  verified BOOLEAN DEFAULT false,

  -- LLM-classified fields
  is_incident BOOLEAN DEFAULT true,
  category TEXT,
  severity TEXT DEFAULT 'low',
  summary TEXT,
  location_extracted TEXT,

  -- Content
  message TEXT NOT NULL,
  message_url TEXT,
  author_name TEXT,
  author_url TEXT,
  image_url TEXT,
  video_url TEXT,

  -- Engagement
  reactions_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,

  -- Location
  barangay TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  location_confidence TEXT DEFAULT 'low',

  -- Timestamps
  posted_at TIMESTAMPTZ NOT NULL,
  archive_status TEXT DEFAULT 'active',
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ DEFAULT now(),

  raw_payload JSONB,

  UNIQUE(external_id, source)
);

-- Indexes
CREATE INDEX idx_safety_reports_category ON public.safety_reports(category);
CREATE INDEX idx_safety_reports_source ON public.safety_reports(source);
CREATE INDEX idx_safety_reports_posted_at ON public.safety_reports(posted_at DESC);
CREATE INDEX idx_safety_reports_is_incident ON public.safety_reports(is_incident) WHERE is_incident = true;
CREATE INDEX idx_safety_reports_archive ON public.safety_reports(archive_status);

-- RLS
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "safety_reports_public_read" ON public.safety_reports
  FOR SELECT USING (true);

CREATE POLICY "safety_reports_service_write" ON public.safety_reports
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role'
  );
