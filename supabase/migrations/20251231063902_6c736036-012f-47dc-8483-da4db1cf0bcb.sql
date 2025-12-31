-- Drop the overly permissive policy that exposes all profile columns including email
DROP POLICY IF EXISTS "Anyone can view profile display info" ON public.profiles;