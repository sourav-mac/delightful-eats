import { useState, useEffect } from 'react';
import { Eye, Clock, CheckCircle, Truck, ChefHat, XCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-accent' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-primary' },
  { value: 'preparing', label: 'Preparing', icon: ChefHat, color: 'bg-accent' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-primary' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-success' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-destructive' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`*, order_items (*, menu_items (name, price))`)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setIsLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Order status updated');
      
      // Send SMS notification to user
      if (order?.delivery_phone) {
        supabase.functions.invoke('send-sms', {
          body: {
            type: 'order_status',
            data: {
              orderId,
              status: newStatus,
              userPhone: order.delivery_phone,
            },
          },
        }).catch(console.error);
      }
      
      fetchOrders();
    }
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const getStatusBadge = (status: string) => {
    const config = statusOptions.find(s => s.value === status) || statusOptions[0];
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage customer orders</p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              {statusOptions.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No orders found</div>
            ) : (
              <div className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="space-y-1">
                      <p className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'MMM d, h:mm a')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(order.status)}
                      <span className="font-bold">৳{order.total_amount}</span>
                      <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Status:</span> {getStatusBadge(selectedOrder.status)}</div>
                  <div><span className="text-muted-foreground">Payment:</span> {selectedOrder.payment_method}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {selectedOrder.delivery_phone || 'N/A'}</div>
                  <div><span className="text-muted-foreground">Date:</span> {format(new Date(selectedOrder.created_at), 'PPp')}</div>
                </div>
                <div><span className="text-muted-foreground text-sm">Address:</span><p>{selectedOrder.delivery_address || 'N/A'}</p></div>
                {selectedOrder.delivery_notes && <div><span className="text-muted-foreground text-sm">Notes:</span><p>{selectedOrder.delivery_notes}</p></div>}
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Items</h4>
                  {(selectedOrder.order_items || []).map((item: any) => (
                    <div key={item.id} className="flex justify-between py-1 text-sm">
                      <span>{item.menu_items?.name} × {item.quantity}</span>
                      <span>৳{item.total_price}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>৳{selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
