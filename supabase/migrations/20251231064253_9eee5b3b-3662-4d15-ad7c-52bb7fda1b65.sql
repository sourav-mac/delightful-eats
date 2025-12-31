-- Drop the public SELECT policy that exposes admin email addresses
-- The admin-login edge function uses service role client, so this won't break functionality
DROP POLICY IF EXISTS "Anyone can check allowed emails" ON public.allowed_admin_emails;