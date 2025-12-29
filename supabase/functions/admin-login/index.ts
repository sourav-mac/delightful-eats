import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminLoginRequest {
  email: string;
  password: string;
}

interface RateLimitResult {
  status: 'allowed' | 'locked';
  attempts?: number;
  max_attempts?: number;
  locked_until?: string;
  remaining_seconds?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Service role client for rate limiting (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Anon client for user authentication
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const { email, password }: AdminLoginRequest = await req.json();

    if (!email || !password) {
      console.log('[admin-login] Missing email or password');
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[admin-login] Login attempt for: ${normalizedEmail}`);

    // Step 1: Check rate limit
    const { data: rateLimitData, error: rateLimitError } = await adminClient.rpc(
      'check_admin_login_rate_limit',
      { p_email: normalizedEmail }
    );

    if (rateLimitError) {
      console.error('[admin-login] Rate limit check error:', rateLimitError);
      return new Response(
        JSON.stringify({ error: 'Rate limit check failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rateLimit = rateLimitData as RateLimitResult;
    console.log(`[admin-login] Rate limit status: ${rateLimit.status}, attempts: ${rateLimit.attempts}/${rateLimit.max_attempts}`);

    if (rateLimit.status === 'locked') {
      const remainingMinutes = Math.ceil((rateLimit.remaining_seconds || 0) / 60);
      console.log(`[admin-login] Account locked for ${remainingMinutes} more minutes`);
      return new Response(
        JSON.stringify({
          error: `Too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
          locked: true,
          remaining_seconds: rateLimit.remaining_seconds
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check if email is in allowed admin emails
    const { data: allowedEmail, error: allowedError } = await adminClient
      .from('allowed_admin_emails')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (allowedError) {
      console.error('[admin-login] Allowed email check error:', allowedError);
      return new Response(
        JSON.stringify({ error: 'Access verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!allowedEmail) {
      console.log(`[admin-login] Email not in allowed list: ${normalizedEmail}`);
      // Don't reveal that the email isn't in the allowed list (security)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid credentials',
          attempts: rateLimit.attempts,
          max_attempts: rateLimit.max_attempts
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Attempt authentication
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData.user) {
      console.log(`[admin-login] Auth failed for ${normalizedEmail}: ${authError?.message}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid credentials',
          attempts: rateLimit.attempts,
          max_attempts: rateLimit.max_attempts
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Verify admin role
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('[admin-login] Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Role verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData) {
      console.log(`[admin-login] User ${normalizedEmail} is not an admin`);
      return new Response(
        JSON.stringify({ 
          error: 'Access denied. Admin credentials required.',
          attempts: rateLimit.attempts,
          max_attempts: rateLimit.max_attempts
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Success - reset rate limit
    await adminClient.rpc('reset_admin_login_rate_limit', { p_email: normalizedEmail });
    console.log(`[admin-login] Login successful for admin: ${normalizedEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        session: authData.session,
        user: authData.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-login] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
