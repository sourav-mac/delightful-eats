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
  Settings,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/menu', label: 'Menu Items', icon: UtensilsCrossed },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/reservations', label: 'Reservations', icon: CalendarDays },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  // Close mobile menu on route change
  const location = useLocation();
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-primary">পেটুক</span>
          <span className="text-sm font-medium text-muted-foreground">Admin</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="hover:bg-muted"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-card border-r border-border z-50 flex flex-col",
          "transition-all duration-300 ease-in-out",
          "hidden lg:flex",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {/* Logo Header - Desktop only */}
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "font-medium whitespace-nowrap transition-all duration-300",
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button - Desktop */}
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

      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 flex flex-col",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Logo Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-display font-bold text-primary">পেটুক</span>
            <span className="text-sm font-medium text-muted-foreground">Admin</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileOpen(false)}
            className="hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0",
                  isActive && "scale-110"
                )} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button - Mobile (always visible at bottom) */}
        <div className="shrink-0 p-3 border-t border-border bg-card">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen transition-[margin] duration-300 ease-in-out",
        "lg:ml-16",
        !collapsed && "lg:ml-64",
        "pt-14 lg:pt-0"
      )}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
