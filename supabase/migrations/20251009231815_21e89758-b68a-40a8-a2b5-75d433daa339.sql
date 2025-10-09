-- Fix: Make increment function handle negative values correctly
-- and ensure counts never go below 0
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
    -- Ensure count never goes below 0
    INSERT INTO public.folder_unread_counts (user_id, folder_id, count)
    VALUES (p_user_id, v_current_folder_id, GREATEST(0, p_increment))
    ON CONFLICT (user_id, folder_id)
    DO UPDATE SET 
      count = GREATEST(0, folder_unread_counts.count + p_increment),
      updated_at = now();
    
    -- Get the parent folder
    SELECT parent_id INTO v_current_folder_id
    FROM public.folders
    WHERE id = v_current_folder_id;
  END LOOP;
END;
$$;