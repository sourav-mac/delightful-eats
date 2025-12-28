-- Create rate limits table for OTP requests
CREATE TABLE public.otp_rate_limits (
  phone TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow access via service role (edge functions)
CREATE POLICY "No public access to rate limits" 
ON public.otp_rate_limits 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Function to check and update rate limit (returns true if allowed, false if rate limited)
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(p_phone TEXT, p_max_attempts INTEGER DEFAULT 5, p_window_minutes INTEGER DEFAULT 60)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_window_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_cutoff := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current rate limit record
  SELECT attempts, window_start INTO v_attempts, v_window_start
  FROM otp_rate_limits
  WHERE phone = p_phone;
  
  IF NOT FOUND THEN
    -- First request, create record
    INSERT INTO otp_rate_limits (phone, attempts, window_start)
    VALUES (p_phone, 1, now());
    RETURN TRUE;
  ELSIF v_window_start < v_window_cutoff THEN
    -- Window expired, reset
    UPDATE otp_rate_limits
    SET attempts = 1, window_start = now()
    WHERE phone = p_phone;
    RETURN TRUE;
  ELSIF v_attempts >= p_max_attempts THEN
    -- Rate limited
    RETURN FALSE;
  ELSE
    -- Increment attempts
    UPDATE otp_rate_limits
    SET attempts = attempts + 1
    WHERE phone = p_phone;
    RETURN TRUE;
  END IF;
END;
$$;

-- Cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM otp_rate_limits WHERE window_start < now() - INTERVAL '24 hours';
END;
$$;