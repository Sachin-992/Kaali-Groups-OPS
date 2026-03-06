-- Backfill missing profiles for existing auth users
-- This ensures that every auth user has a corresponding profile record
-- which is required for foreign key constraints in tables like 'attendance'

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'System User'), 
  COALESCE(raw_user_meta_data->>'role', 'admin') -- Default to admin if role is missing (safe for dev)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
