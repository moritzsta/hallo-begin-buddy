-- T17: Neue Dateien-Indikator
-- Add last_seen_at field to profiles to track when user last viewed their files

ALTER TABLE public.profiles
ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

COMMENT ON COLUMN public.profiles.last_seen_at IS 'Timestamp when user last viewed their file list - used to show new file badges';