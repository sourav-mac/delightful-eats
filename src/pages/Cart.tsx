import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';

export default function Cart() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings: restaurantSettings } = useRestaurantSettings();

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Sign in to view your cart</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to add items and place orders.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Explore our menu and add delicious dishes to your cart.</p>
          <Button asChild>
            <Link to="/menu">Browse Menu</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const deliveryFee = restaurantSettings.delivery_charge;
  const grandTotal = total + deliveryFee;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-display font-bold mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.menuItem.image_url ? (
                        <img src={item.menuItem.image_url} alt={item.menuItem.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bengali text-primary/50">
                          {item.menuItem.name_bn?.charAt(0) || item.menuItem.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-lg">{item.menuItem.name}</h3>
                      {item.menuItem.name_bn && (
                        <p className="text-sm font-bengali text-muted-foreground">{item.menuItem.name_bn}</p>
                      )}
                      <p className="text-primary font-bold mt-1">₹{item.menuItem.price}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeItem(item.menuItem.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2 border border-border rounded-lg">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
                  Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
