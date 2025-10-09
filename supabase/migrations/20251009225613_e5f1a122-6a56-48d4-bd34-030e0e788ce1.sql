-- Create table for per-user folder unread counts
CREATE TABLE public.folder_unread_counts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  folder_id uuid NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT folder_unread_counts_user_folder_unique UNIQUE (user_id, folder_id),
  CONSTRAINT folder_unread_counts_count_check CHECK (count >= 0)
);

-- Enable RLS
ALTER TABLE public.folder_unread_counts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own counts
CREATE POLICY "Users can view own folder counts"
ON public.folder_unread_counts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folder counts"
ON public.folder_unread_counts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folder counts"
ON public.folder_unread_counts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folder counts"
ON public.folder_unread_counts
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_folder_unread_counts_user_folder ON public.folder_unread_counts(user_id, folder_id);
CREATE INDEX idx_folder_unread_counts_folder ON public.folder_unread_counts(folder_id);

-- Add trigger for updated_at
CREATE TRIGGER update_folder_unread_counts_updated_at
BEFORE UPDATE ON public.folder_unread_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment unread count for a folder and all its parents
CREATE OR REPLACE FUNCTION public.increment_folder_unread_count(
  p_user_id uuid,
  p_folder_id uuid,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_folder_id uuid;
BEGIN
  -- Start with the target folder
  v_current_folder_id := p_folder_id;
  
  -- Loop through the folder hierarchy
  WHILE v_current_folder_id IS NOT NULL LOOP
    -- Insert or update the count for the current folder
    INSERT INTO public.folder_unread_counts (user_id, folder_id, count)
    VALUES (p_user_id, v_current_folder_id, p_increment)
    ON CONFLICT (user_id, folder_id)
    DO UPDATE SET 
      count = folder_unread_counts.count + p_increment,
      updated_at = now();
    
    -- Get the parent folder
    SELECT parent_id INTO v_current_folder_id
    FROM public.folders
    WHERE id = v_current_folder_id;
  END LOOP;
END;
$$;

-- Function to reset unread count when visiting a folder
CREATE OR REPLACE FUNCTION public.reset_folder_unread_count(
  p_user_id uuid,
  p_folder_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_count integer;
  v_current_folder_id uuid;
BEGIN
  -- Get the current count for the folder
  SELECT count INTO v_old_count
  FROM public.folder_unread_counts
  WHERE user_id = p_user_id AND folder_id = p_folder_id;
  
  -- If no count exists, nothing to reset
  IF v_old_count IS NULL OR v_old_count = 0 THEN
    RETURN 0;
  END IF;
  
  -- Reset the count for the visited folder
  UPDATE public.folder_unread_counts
  SET count = 0, updated_at = now()
  WHERE user_id = p_user_id AND folder_id = p_folder_id;
  
  -- Decrement parent folders by the old count
  SELECT parent_id INTO v_current_folder_id
  FROM public.folders
  WHERE id = p_folder_id;
  
  WHILE v_current_folder_id IS NOT NULL LOOP
    UPDATE public.folder_unread_counts
    SET count = GREATEST(0, count - v_old_count), updated_at = now()
    WHERE user_id = p_user_id AND folder_id = v_current_folder_id;
    
    SELECT parent_id INTO v_current_folder_id
    FROM public.folders
    WHERE id = v_current_folder_id;
  END LOOP;
  
  RETURN v_old_count;
END;
$$;