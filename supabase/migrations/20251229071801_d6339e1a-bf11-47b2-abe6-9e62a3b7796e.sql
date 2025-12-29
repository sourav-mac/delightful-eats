-- Create table for admin login rate limiting
CREATE TABLE public.admin_login_rate_limits (
  email text NOT NULL PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  locked_until timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.admin_login_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only edge functions with service role can access
CREATE POLICY "No public access to admin login rate limits"
ON public.admin_login_rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- Function to check admin login rate limit
-- Returns: 'allowed', 'rate_limited', or 'locked'
CREATE OR REPLACE FUNCTION public.check_admin_login_rate_limit(
  p_email text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15,
  p_lockout_minutes integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record admin_login_rate_limits%ROWTYPE;
  v_window_cutoff timestamp with time zone;
  v_now timestamp with time zone := now();
BEGIN
  v_window_cutoff := v_now - (p_window_minutes || ' minutes')::interval;
  
  -- Get current rate limit record
  SELECT * INTO v_record
  FROM admin_login_rate_limits
  WHERE email = lower(trim(p_email));
  
  -- Check if currently locked out
  IF v_record.locked_until IS NOT NULL AND v_record.locked_until > v_now THEN
    RETURN jsonb_build_object(
      'status', 'locked',
      'locked_until', v_record.locked_until,
      'remaining_seconds', EXTRACT(EPOCH FROM (v_record.locked_until - v_now))::integer
    );
  END IF;
  
  -- If no record exists, create one
  IF v_record IS NULL THEN
    INSERT INTO admin_login_rate_limits (email, attempts, last_attempt_at)
    VALUES (lower(trim(p_email)), 1, v_now);
    
    RETURN jsonb_build_object(
      'status', 'allowed',
      'attempts', 1,
      'max_attempts', p_max_attempts
    );
  END IF;
  
  -- If last attempt was outside the window, reset counter
  IF v_record.last_attempt_at < v_window_cutoff THEN
    UPDATE admin_login_rate_limits
    SET attempts = 1, last_attempt_at = v_now, locked_until = NULL
    WHERE email = lower(trim(p_email));
    
    RETURN jsonb_build_object(
      'status', 'allowed',
      'attempts', 1,
      'max_attempts', p_max_attempts
    );
  END IF;
  
  -- Increment attempts
  UPDATE admin_login_rate_limits
  SET attempts = attempts + 1, last_attempt_at = v_now
  WHERE email = lower(trim(p_email))
  RETURNING * INTO v_record;
  
  -- Check if we've exceeded max attempts
  IF v_record.attempts >= p_max_attempts THEN
    -- Apply lockout
    UPDATE admin_login_rate_limits
    SET locked_until = v_now + (p_lockout_minutes || ' minutes')::interval
    WHERE email = lower(trim(p_email));
    
    RETURN jsonb_build_object(
      'status', 'locked',
      'locked_until', v_now + (p_lockout_minutes || ' minutes')::interval,
      'remaining_seconds', p_lockout_minutes * 60
    );
  END IF;
  
  RETURN jsonb_build_object(
    'status', 'allowed',
    'attempts', v_record.attempts,
    'max_attempts', p_max_attempts
  );
END;
$$;

-- Function to reset rate limit on successful login
CREATE OR REPLACE FUNCTION public.reset_admin_login_rate_limit(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM admin_login_rate_limits
  WHERE email = lower(trim(p_email));
END;
$$;

-- Function to cleanup old rate limit records (can be called by cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_admin_login_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM admin_login_rate_limits
  WHERE last_attempt_at < now() - INTERVAL '24 hours'
    AND (locked_until IS NULL OR locked_until < now());
END;
$$;