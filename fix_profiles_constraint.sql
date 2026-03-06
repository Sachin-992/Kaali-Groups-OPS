-- Remove the foreign key constraint that forces profiles to have a matching auth.user
-- This allows creating "offline" profiles for labourers/partners who don't need to login,
-- bypassing Auth rate limits and email validation issues.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Optional: If you want to keep the relationship for *some* users but not enforce it for all:
-- We just dropped the strict enforcement. 
-- Real users will still share the same ID (auth.uid() = profile.id) because of how we insert them.
-- Offline users will just have a random UUID.
