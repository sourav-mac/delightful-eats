import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, ChefHat } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/database';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-accent text-accent-foreground', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'bg-primary text-primary-foreground', label: 'Confirmed' },
  preparing: { icon: ChefHat, color: 'bg-accent text-accent-foreground', label: 'Preparing' },
  out_for_delivery: { icon: Truck, color: 'bg-primary text-primary-foreground', label: 'On the way' },
  delivered: { icon: CheckCircle, color: 'bg-success text-success-foreground', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'bg-destructive text-destructive-foreground', label: 'Cancelled' },
};

// Orders can only be cancelled before food preparation starts
const CANCELLABLE_STATUSES = ['pending', 'confirmed'];

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name, name_bn, price)
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as any);
    setIsLoading(false);
  };

  const canCancelOrder = (order: Order) => {
    return CANCELLABLE_STATUSES.includes(order.status);
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to cancel order');
    } else {
      toast.success('Order cancelled successfully');
      fetchOrders();
    }
    setCancellingOrderId(null);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Sign in to view your orders</h1>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 mx-auto max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6 sm:mb-8 text-center sm:text-left">
          My Orders
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 sm:h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="w-full">
            <CardContent className="py-10 sm:py-12 text-center px-4">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-2">No orders yet</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Start ordering delicious food from our menu
              </p>
              <Button asChild>
                <Link to="/menu">Browse Menu</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <Card key={order.id} className="w-full overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors p-4 sm:p-6"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                      {/* Order info - left side */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg break-all leading-tight">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      
                      {/* Status, Price, and Cancel - right side */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                        <Badge className={`${status.color} text-xs sm:text-sm shrink-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <span className="font-bold text-primary text-sm sm:text-base shrink-0">
                          ₹{order.total_amount}
                        </span>
                        {canCancelOrder(order) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-xs sm:text-sm px-3 h-7 sm:h-8 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent 
                              className="w-[95vw] max-w-md mx-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this order? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto">No, keep it</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={cancellingOrderId === order.id}
                                  className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {cancellingOrderId === order.id ? 'Cancelling...' : 'Yes, cancel order'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="border-t border-border pt-4 space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                      <div>
                        <h4 className="font-medium mb-2 text-sm sm:text-base">Items</h4>
                        <div className="space-y-2">
                          {(order.order_items || []).map((item: any) => (
                            <div key={item.id} className="flex justify-between text-xs sm:text-sm gap-2">
                              <span className="break-words">
                                {item.menu_items?.name || 'Item'} × {item.quantity}
                              </span>
                              <span className="shrink-0">₹{item.total_price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-muted-foreground">Delivery Address</p>
                          <p className="break-words">{order.delivery_address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p>{order.delivery_phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment Method</p>
                          <p className="capitalize">{order.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment Status</p>
                          <p className="capitalize">{order.payment_status}</p>
                        </div>
                      </div>

                      {order.delivery_notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-muted-foreground text-xs sm:text-sm">Delivery Notes</p>
                            <p className="text-xs sm:text-sm break-words">{order.delivery_notes}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
