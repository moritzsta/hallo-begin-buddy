-- Create "Unsortiert" system folder for existing users who don't have one
-- This is a one-time migration to add the unsorted folder system

-- First, insert "Unsortiert" folders for all existing users who don't have one yet
INSERT INTO public.folders (owner_id, name, parent_id, meta)
SELECT 
  p.id as owner_id,
  'Unsortiert' as name,
  NULL as parent_id,
  '{"system": true, "type": "unsorted"}'::jsonb as meta
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.folders f 
  WHERE f.owner_id = p.id 
  AND f.meta->>'type' = 'unsorted'
);

-- Update handle_new_user() function to automatically create "Unsortiert" folder for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, plan_tier, locale, theme)
  VALUES (
    NEW.id,
    'free',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'de'),
    COALESCE(NEW.raw_user_meta_data->>'theme', 'light')
  );
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create "Unsortiert" system folder for new user
  INSERT INTO public.folders (owner_id, name, parent_id, meta)
  VALUES (
    NEW.id,
    'Unsortiert',
    NULL,
    '{"system": true, "type": "unsorted"}'::jsonb
  );
  
  RETURN NEW;
END;
$function$;