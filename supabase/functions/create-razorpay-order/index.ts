import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers - permissive to support various preview and production environments
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the order belongs to the authenticated user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, user_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('Order not found or unauthorized:', orderError?.message);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating Razorpay order for order:', orderId, 'amount:', order.total_amount);

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId) {
      throw new Error('Razorpay key ID not configured');
    }

    if (!keySecret) {
      throw new Error('Razorpay secret key not configured');
    }

    // Use server-verified total amount from the order
    const amount = Number(order.total_amount);
    const shortReceipt = `order_${orderId}`.slice(0, 40);

    // Create order using Razorpay API
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: 'INR',
        receipt: shortReceipt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error:', errorText);
      throw new Error(`Razorpay API error: ${response.status}`);
    }

    const razorpayOrder = await response.json();
    console.log('Razorpay order created:', razorpayOrder.id);

    return new Response(JSON.stringify({ 
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating Razorpay order:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
