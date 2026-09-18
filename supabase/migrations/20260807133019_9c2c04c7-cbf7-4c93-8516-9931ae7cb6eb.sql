CREATE TABLE public.contact_submission_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  session_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.contact_submission_log TO service_role;

ALTER TABLE public.contact_submission_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX contact_submission_log_ip_created_idx
  ON public.contact_submission_log (ip_hash, created_at DESC);

CREATE INDEX contact_submission_log_session_created_idx
  ON public.contact_submission_log (session_hash, created_at DESC);