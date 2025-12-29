import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  FolderOpen, 
  CalendarDays, 
  MessageSquare,
  ChevronLeft,
  LogOut,
  BarChart3,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const fetchCounts = async () => {
      const [ordersRes, reviewsRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false)
      ]);
      setPendingOrdersCount(ordersRes.count || 0);
      setPendingReviewsCount(reviewsRes.count || 0);
    };
    fetchCounts();

    const ordersChannel = supabase
      .channel('orders-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchCounts)
      .subscribe();

    const reviewsChannel = supabase
      .channel('reviews-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(reviewsChannel);
    };
  }, []);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: pendingOrdersCount },
    { href: '/admin/menu', label: 'Menu Items', icon: UtensilsCrossed },
    { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { href: '/admin/reservations', label: 'Reservations', icon: CalendarDays },
    { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare, badge: pendingReviewsCount },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-screen overflow-hidden flex bg-muted/30">
      {/* Sidebar - Fixed position with full screen height */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-screen bg-card border-r border-border z-50 flex flex-col overflow-hidden",
          "transition-[width] duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Header - Always visible */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <span className="text-xl font-display font-bold text-primary whitespace-nowrap">পেটুক</span>
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Admin</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "shrink-0 transition-transform duration-300 hover:bg-muted",
              collapsed && "mx-auto"
            )}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform duration-300", 
              collapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation - Scrollable middle section */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {navItems.map((item, index) => {
            const isActive = item.exact 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative shrink-0">
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  {item.badge > 0 && collapsed && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "font-medium whitespace-nowrap transition-all duration-300 flex-1",
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                )}>
                  {item.label}
                </span>
                {item.badge > 0 && !collapsed && (
                  <Badge 
                    variant="destructive" 
                    className={cn(
                      "h-5 min-w-5 flex items-center justify-center text-[10px] font-bold px-1.5",
                      isActive && "bg-destructive-foreground text-destructive"
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button - Fixed at bottom, always visible */}
        <div className="shrink-0 p-2 border-t border-border bg-card">
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "text-destructive hover:bg-destructive/10 hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(
              "font-medium whitespace-nowrap transition-all duration-300",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
            )}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content - with proper margin for fixed sidebar */}
      <main className={cn(
        "flex-1 h-screen overflow-y-auto transition-[margin] duration-300 ease-in-out",
        collapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}