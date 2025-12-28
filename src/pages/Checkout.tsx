import { useState } from 'react';
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

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { settings, isLoading: settingsLoading } = useRestaurantSettings();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const deliveryFee = settings.delivery_charge;
  const grandTotal = total + deliveryFee;
  const minOrderMet = total >= settings.min_order_price;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    if (!minOrderMet) {
      toast.error(`Minimum order amount is ৳${settings.min_order_price}`);
      return;
    }

    if (!settings.isOpen) {
      toast.error('Sorry, we are currently closed');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: grandTotal,
          delivery_address: formData.get('address') as string,
          delivery_phone: formData.get('phone') as string,
          delivery_notes: formData.get('notes') as string,
          payment_method: paymentMethod,
          status: 'pending',
          payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        total_price: item.menuItem.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart();
      setOrderPlaced(true);
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // User auth is now handled by ProtectedRoute wrapper

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
                    Minimum order amount is ৳{settings.min_order_price}. Add ৳{(settings.min_order_price - total).toFixed(2)} more to proceed.
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" name="phone" required placeholder="+880 1XXX-XXXXXX" className="pl-10" />
                    </div>
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
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
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
                      <RadioGroupItem value="bkash" id="bkash" />
                      <Label htmlFor="bkash" className="flex items-center gap-3 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-pink-500" />
                        <div>
                          <p className="font-medium">bKash / Mobile Banking</p>
                          <p className="text-sm text-muted-foreground">Pay using mobile wallet</p>
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
                      <span>৳{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>৳{deliveryFee}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">৳{grandTotal.toFixed(2)}</span>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={isSubmitting || !minOrderMet || !settings.isOpen || settingsLoading}
                  >
                    {isSubmitting ? 'Placing Order...' : !settings.isOpen ? 'Restaurant Closed' : !minOrderMet ? `Add ৳${(settings.min_order_price - total).toFixed(2)} more` : 'Place Order'}
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
