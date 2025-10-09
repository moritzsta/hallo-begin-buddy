-- Create shared_links table for secure document sharing
CREATE TABLE public.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Users can create share links for their own files
CREATE POLICY "Users can create share links for own files"
ON public.shared_links
FOR INSERT
WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = shared_links.file_id
    AND files.owner_id = auth.uid()
  )
);

-- Users can view their own share links
CREATE POLICY "Users can view own share links"
ON public.shared_links
FOR SELECT
USING (auth.uid() = owner_id);

-- Users can delete their own share links
CREATE POLICY "Users can delete own share links"
ON public.shared_links
FOR DELETE
USING (auth.uid() = owner_id);

-- Public access to valid, non-expired share links (for unauthenticated users)
CREATE POLICY "Public can view valid share links"
ON public.shared_links
FOR SELECT
USING (
  expires_at IS NULL OR expires_at > now()
);

-- Create index for token lookups
CREATE INDEX idx_shared_links_token ON public.shared_links(token);
CREATE INDEX idx_shared_links_file_id ON public.shared_links(file_id);

-- Add trigger for updated_at
CREATE TRIGGER update_shared_links_updated_at
BEFORE UPDATE ON public.shared_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();