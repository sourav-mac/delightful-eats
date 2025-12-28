import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, MapPin, Phone, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Input validation schema
const checkoutSchema = z.object({
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters')
    .transform(val => val.trim()),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use format: +919876543210)')
    .transform(val => val.replace(/[\s\-()]/g, '')),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .transform(val => val.trim())
    .optional()
    .nullable(),
  payment_method: z.enum(['cash', 'razorpay'], {
    errorMap: () => ({ message: 'Please select a valid payment method' })
  })
});

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { settings, isLoading: settingsLoading } = useRestaurantSettings();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'razorpay'>('cash');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const deliveryFee = settings.delivery_charge;
  const grandTotal = total + deliveryFee;
  const minOrderMet = total >= settings.min_order_price;

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const processRazorpayPayment = async (orderId: string, userPhone: string) => {
    try {
      // Create Razorpay order using server-verified amount
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { orderId },
      });

      if (error) throw new Error(error.message);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Your Restaurant',
        description: `Order #${orderId.slice(0, 8)}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          // Payment successful
          try {
            await supabase
              .from('orders')
              .update({ payment_status: 'paid' })
              .eq('id', orderId);

            setOrderPlaced(true);
            toast.success('Payment successful! Order placed.');
          } catch (err) {
            toast.error('Order placed but status update failed');
          }
          setIsSubmitting(false);
        },
        prefill: {
          name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          contact: userPhone,
        },
        theme: {
          color: '#f97316',
        },
        modal: {
          ondismiss: function () {
            // Payment cancelled, delete the pending order
            supabase.from('orders').delete().eq('id', orderId);
            setIsSubmitting(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      // Delete pending order on error
      await supabase.from('orders').delete().eq('id', orderId);
      toast.error(error.message || 'Payment failed');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setValidationErrors({});

    if (!minOrderMet) {
      toast.error(`Minimum order amount is ₹${settings.min_order_price}`);
      return;
    }

    if (!settings.isOpen) {
      toast.error('Sorry, we are currently closed');
      return;
    }

    if (paymentMethod === 'razorpay' && !razorpayLoaded) {
      toast.error('Payment system loading, please wait...');
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    // Validate inputs using Zod
    const rawData = {
      address: formData.get('address') as string,
      phone: (formData.get('phone') as string)?.replace(/[\s\-()]/g, ''),
      notes: formData.get('notes') as string || null,
      payment_method: paymentMethod,
    };

    const validationResult = checkoutSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach(err => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setValidationErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    const validatedData = validationResult.data;
    setIsSubmitting(true);

    try {
      // Create order via secure edge function (server-side price verification)
      const { data: orderResponse, error: orderError } = await supabase.functions.invoke('create-order', {
        body: {
          delivery_address: validatedData.address,
          delivery_phone: validatedData.phone,
          delivery_notes: validatedData.notes,
          payment_method: validatedData.payment_method,
        },
      });

      if (orderError) {
        throw new Error(orderError.message || 'Failed to create order');
      }

      if (!orderResponse?.order) {
        throw new Error(orderResponse?.error || 'Failed to create order');
      }

      const order = orderResponse.order;

      // Send SMS notification to admin
      supabase.functions.invoke('send-sms', {
        body: {
          type: 'new_order',
          data: {
            orderId: order.id,
            amount: orderResponse.total_amount,
            phone: validatedData.phone,
            address: validatedData.address,
          },
        },
      }).catch(console.error);

      // Clear local cart (server already cleared it)
      await clearCart();

      // Process payment based on method
      if (paymentMethod === 'razorpay') {
        await processRazorpayPayment(order.id, validatedData.phone);
      } else {
        // Cash on delivery
        setOrderPlaced(true);
        toast.success('Order placed successfully!');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  if (orderPlaced) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <CheckCircle className="h-20 w-20 mx-auto text-success mb-6" />
          <h1 className="text-3xl font-display font-bold mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Thank you for your order. We'll start preparing your delicious meal right away.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/orders')}>View Orders</Button>
            <Button variant="outline" onClick={() => navigate('/menu')}>Continue Shopping</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Delivery Details */}
            <div className="lg:col-span-2 space-y-6">
              {!settings.isOpen && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    We are currently closed. Operating hours: {settings.open_time} - {settings.close_time}
                  </AlertDescription>
                </Alert>
              )}
              
              {!minOrderMet && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Minimum order amount is ₹{settings.min_order_price}. Add ₹{(settings.min_order_price - total).toFixed(2)} more to proceed.
                  </AlertDescription>
                </Alert>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Textarea id="address" name="address" required placeholder="House no, Street, Area, City" rows={3} />
                    {validationErrors.address && (
                      <p className="text-sm text-destructive">{validationErrors.address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" name="phone" required placeholder="+919876543210" className="pl-10" />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-sm text-destructive">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea id="notes" name="notes" placeholder="Any special instructions for delivery" className="pl-10" rows={2} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'cash' | 'razorpay')} className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Banknote className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex items-center gap-3 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Pay Online (Razorpay)</p>
                          <p className="text-sm text-muted-foreground">Cards, UPI, NetBanking, Wallets</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.menuItem.name} × {item.quantity}</span>
                      <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={isSubmitting || !minOrderMet || !settings.isOpen || settingsLoading}
                  >
                    {isSubmitting ? 'Processing...' : !settings.isOpen ? 'Restaurant Closed' : !minOrderMet ? `Add ₹${(settings.min_order_price - total).toFixed(2)} more` : paymentMethod === 'razorpay' ? 'Pay Now' : 'Place Order'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
