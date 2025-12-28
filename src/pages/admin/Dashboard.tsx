import { useState, useEffect } from 'react';
import { ShoppingBag, Users, CalendarDays, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  todayReservations: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, todayReservations: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [ordersRes, pendingRes, reservationsRes] = await Promise.all([
      supabase.from('orders').select('total_amount'),
      supabase.from('orders').select('id').eq('status', 'pending'),
      supabase.from('reservations').select('id').eq('reservation_date', today),
    ]);

    const totalRevenue = (ordersRes.data || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

    setStats({
      totalOrders: ordersRes.data?.length || 0,
      pendingOrders: pendingRes.data?.length || 0,
      todayReservations: reservationsRes.data?.length || 0,
      totalRevenue,
    });
    setIsLoading(false);
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRecentOrders(data);
  };

  const statCards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-primary' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-accent' },
    { title: "Today's Reservations", value: stats.todayReservations, icon: CalendarDays, color: 'text-success' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Petuk Admin Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{isLoading ? '...' : stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{order.total_amount}</p>
                      <p className="text-sm capitalize text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
