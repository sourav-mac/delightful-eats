-- Drop the overly permissive RLS policy on phone_otps
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.phone_otps;

-- Create a restrictive policy that only allows service role (edge functions) to access OTPs
-- Regular users should never be able to read OTP codes from the client
-- This works because edge functions use the service role key, not anon key
CREATE POLICY "No public access to OTPs"
ON public.phone_otps
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Create function to cleanup expired OTPs (can be called by edge functions)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM phone_otps WHERE expires_at < now();
END;
$$;