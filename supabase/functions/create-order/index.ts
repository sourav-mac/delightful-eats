import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Input validation helpers
function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

function validateAddress(address: string): boolean {
  return address.length >= 10 && address.length <= 500;
}

function validateNotes(notes: string | null): boolean {
  if (!notes) return true;
  return notes.length <= 1000;
}

function validatePaymentMethod(method: string): boolean {
  return ['cash', 'razorpay'].includes(method);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // User client for auth verification
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service client for database operations (bypasses RLS for reading cart)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating order for user:', user.id);

    // Parse and validate input
    const { delivery_address, delivery_phone, delivery_notes, payment_method } = await req.json();

    // Validate inputs
    const errors: string[] = [];
    
    if (!delivery_address || !validateAddress(delivery_address.trim())) {
      errors.push('Address must be between 10 and 500 characters');
    }
    
    if (!delivery_phone || !validatePhone(delivery_phone)) {
      errors.push('Invalid phone number format');
    }
    
    if (!validateNotes(delivery_notes)) {
      errors.push('Notes must be less than 1000 characters');
    }
    
    if (!payment_method || !validatePaymentMethod(payment_method)) {
      errors.push('Invalid payment method');
    }

    if (errors.length > 0) {
      console.error('Validation errors:', errors);
      return new Response(JSON.stringify({ error: errors.join(', ') }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch cart items from database (server-side truth)
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        quantity,
        menu_item_id,
        menu_items (
          id,
          price,
          name,
          is_available
        )
      `)
      .eq('user_id', user.id);

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return new Response(JSON.stringify({ error: 'Failed to fetch cart items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Type helper for cart item with joined menu_items
    type CartItemWithMenu = typeof cartItems[number] & {
      menu_items: { id: string; price: number; name: string; is_available: boolean } | null;
    };

    // Check all items are available
    const unavailableItems = (cartItems as CartItemWithMenu[]).filter(item => !item.menu_items?.is_available);
    if (unavailableItems.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Some items in your cart are no longer available',
        unavailable_items: unavailableItems.map(i => i.menu_items?.name)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate subtotal server-side
    const subtotal = (cartItems as CartItemWithMenu[]).reduce((sum, item) => {
      const price = item.menu_items?.price ?? 0;
      return sum + (item.quantity * Number(price));
    }, 0);

    console.log('Server-calculated subtotal:', subtotal);

    // Get delivery charge from settings
    const { data: deliverySetting, error: settingsError } = await supabaseAdmin
      .from('restaurant_settings')
      .select('setting_value')
      .eq('setting_key', 'delivery_charge')
      .maybeSingle();

    const deliveryCharge = deliverySetting ? parseFloat(deliverySetting.setting_value) : 0;
    
    // Get minimum order price
    const { data: minOrderSetting } = await supabaseAdmin
      .from('restaurant_settings')
      .select('setting_value')
      .eq('setting_key', 'min_order_price')
      .maybeSingle();

    const minOrderPrice = minOrderSetting ? parseFloat(minOrderSetting.setting_value) : 0;

    // Check minimum order
    if (subtotal < minOrderPrice) {
      return new Response(JSON.stringify({ 
        error: `Minimum order amount is ₹${minOrderPrice}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if restaurant is open
    const { data: isOpenSetting } = await supabaseAdmin
      .from('restaurant_settings')
      .select('setting_value')
      .eq('setting_key', 'is_open')
      .maybeSingle();

    const isOpen = isOpenSetting?.setting_value !== 'false';
    if (!isOpen) {
      return new Response(JSON.stringify({ error: 'Restaurant is currently closed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate verified total
    const verifiedTotal = subtotal + deliveryCharge;
    console.log('Server-verified total:', verifiedTotal);

    // Create order with verified total (using user's client so RLS applies)
    const { data: order, error: orderError } = await supabaseUser
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: verifiedTotal,
        delivery_address: delivery_address.trim(),
        delivery_phone: delivery_phone.replace(/[\s\-()]/g, ''),
        delivery_notes: delivery_notes?.trim() || null,
        payment_method,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Order created:', order.id);

    // Create order items
    const orderItems = (cartItems as CartItemWithMenu[]).map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.menu_items?.price ?? 0,
      total_price: (item.menu_items?.price ?? 0) * item.quantity,
    }));

    const { error: itemsError } = await supabaseUser
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Clean up the order
      await supabaseUser.from('orders').delete().eq('id', order.id);
      return new Response(JSON.stringify({ error: 'Failed to create order items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clear cart items
    await supabaseUser.from('cart_items').delete().eq('user_id', user.id);

    console.log('Order completed successfully:', order.id);

    return new Response(JSON.stringify({ 
      order,
      total_amount: verifiedTotal,
      subtotal,
      delivery_charge: deliveryCharge
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating order:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
