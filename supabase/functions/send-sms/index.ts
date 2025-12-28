import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = 'AC0b9882ecf7a29b073f8b887d7946b7eb';
const TWILIO_PHONE = '+15707985443';
const ADMIN_PHONE = '+919733674981';

serve(async (req) => {
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

    const { type, data } = await req.json();
    
    // Validate the user has permission for the requested action
    // For new_order: verify the order belongs to the user
    // For order_status/reservation_status: verify admin role or ownership
    if (type === 'new_order' && data.orderId) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, user_id')
        .eq('id', data.orderId)
        .eq('user_id', user.id)
        .single();
      
      if (orderError || !order) {
        console.error('Order verification failed:', orderError?.message);
        return new Response(JSON.stringify({ error: 'Order not found or unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (type === 'order_status' || type === 'reservation_status') {
      // Check if user is admin for status update notifications
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (!roleData) {
        console.error('Admin verification failed for status update');
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (type === 'new_reservation' && data.reservationId) {
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('id, user_id')
        .eq('id', data.reservationId)
        .eq('user_id', user.id)
        .single();
      
      if (resError || !reservation) {
        console.error('Reservation verification failed');
        return new Response(JSON.stringify({ error: 'Reservation not found or unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!authToken) {
      throw new Error('Twilio auth token not configured');
    }

    let messages: { to: string; body: string }[] = [];

    switch (type) {
      case 'new_order':
        // Notify admin about new order
        messages.push({
          to: ADMIN_PHONE,
          body: `🍽️ New Order #${data.orderId.slice(0, 8)}!\nAmount: ₹${data.amount}\nPhone: ${data.phone}\nAddress: ${data.address?.slice(0, 50)}...`,
        });
        break;

      case 'order_status':
        // Notify user about order status change (admin only)
        if (data.userPhone) {
          const statusMessages: Record<string, string> = {
            confirmed: '✅ Your order has been confirmed and is being prepared!',
            preparing: '👨‍🍳 Your order is now being prepared.',
            ready: '📦 Your order is ready for delivery!',
            out_for_delivery: '🚗 Your order is out for delivery!',
            delivered: '🎉 Your order has been delivered. Enjoy your meal!',
            cancelled: '❌ Your order has been cancelled.',
          };
          messages.push({
            to: data.userPhone,
            body: `Order #${data.orderId.slice(0, 8)}: ${statusMessages[data.status] || `Status updated to: ${data.status}`}`,
          });
        }
        break;

      case 'new_reservation':
        // Notify admin about new reservation
        messages.push({
          to: ADMIN_PHONE,
          body: `📅 New Reservation!\nGuest: ${data.guestName}\nDate: ${data.date} at ${data.time}\nParty: ${data.partySize} guests\nPhone: ${data.phone}`,
        });
        break;

      case 'reservation_status':
        // Notify user about reservation status change (admin only)
        if (data.userPhone) {
          const statusMessages: Record<string, string> = {
            confirmed: '✅ Your reservation has been confirmed! We look forward to seeing you.',
            cancelled: '❌ Your reservation has been cancelled.',
            completed: '🎉 Thank you for dining with us!',
          };
          messages.push({
            to: data.userPhone,
            body: `Reservation for ${data.date}: ${statusMessages[data.status] || `Status updated to: ${data.status}`}`,
          });
        }
        break;

      default:
        throw new Error('Invalid SMS type');
    }

    // Send all messages
    const results = [];
    for (const msg of messages) {
      console.log(`Sending SMS to ${msg.to}: ${msg.body}`);
      
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: msg.to,
          From: TWILIO_PHONE,
          Body: msg.body,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Twilio error:', result);
        results.push({ success: false, error: result.message });
      } else {
        console.log('SMS sent successfully:', result.sid);
        results.push({ success: true, sid: result.sid });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending SMS:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
