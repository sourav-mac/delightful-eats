import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate an unpredictable hashed email from phone number
function generateSecurePhoneEmail(phone: string): string {
  const secret = Deno.env.get("PHONE_HASH_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "default-secret";
  const hash = createHash("sha256")
    .update(phone + secret)
    .digest("hex")
    .substring(0, 16);
  
  return `${hash}@phone.internal`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find valid OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("phone_otps")
      .select("*")
      .eq("phone", phone)
      .eq("otp_code", otp)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching OTP:", fetchError);
      return new Response(
        JSON.stringify({ error: "Verification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("phone_otps")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Check if user exists with this phone
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("phone", phone)
      .maybeSingle();

    let session = null;
    let user = null;

    if (existingProfile) {
      // User exists - sign them in using admin API
      const { data: userData, error: signInError } = await supabase.auth.admin.getUserById(
        existingProfile.id
      );

      if (signInError || !userData.user) {
        console.error("Error getting user:", signInError);
        return new Response(
          JSON.stringify({ error: "Failed to authenticate" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a session for the user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email!,
      });

      if (sessionError) {
        console.error("Error generating session:", sessionError);
      }

      // Return user info - client will handle the magic link
      user = userData.user;
      
      // Update phone_verified status
      await supabase
        .from("profiles")
        .update({ phone_verified: true })
        .eq("id", existingProfile.id);

      console.log(`User ${existingProfile.id} authenticated via phone`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          isNewUser: false,
          userId: user.id,
          email: user.email,
          message: "Phone verified. Please use magic link sent to your email."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // New user - create account with secure hashed email
      const secureEmail = generateSecurePhoneEmail(phone);
      const tempPassword = crypto.randomUUID();

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: secureEmail,
        password: tempPassword,
        email_confirm: true,
        phone: phone,
        phone_confirm: true,
        user_metadata: {
          phone: phone,
          signup_method: "phone",
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profile with phone
      await supabase
        .from("profiles")
        .update({ 
          phone: phone, 
          phone_verified: true 
        })
        .eq("id", newUser.user.id);

      // Generate session token for new user
      const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: secureEmail,
        options: {
          redirectTo: `${req.headers.get("origin")}/`,
        },
      });

      console.log(`New user created with phone: ${phone}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          isNewUser: true,
          userId: newUser.user.id,
          // Return the hashed token for client-side session
          accessToken: tokenData?.properties?.hashed_token,
          redirectUrl: tokenData?.properties?.action_link,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
