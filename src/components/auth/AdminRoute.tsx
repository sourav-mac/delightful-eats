import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const verificationAttempted = useRef(false);

  // Double-check admin status directly from database for extra security
  useEffect(() => {
    const verifyAdminRole = async () => {
      // Wait until auth is fully loaded
      if (isLoading) {
        return;
      }

      // If no user after auth is loaded, stop verifying
      if (!user) {
        setIsVerifying(false);
        setIsVerifiedAdmin(false);
        return;
      }

      // Prevent duplicate verification attempts for the same user
      if (verificationAttempted.current) {
        return;
      }
      verificationAttempted.current = true;

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Admin verification failed:', error);
          setIsVerifiedAdmin(false);
        } else {
          setIsVerifiedAdmin(!!data);
        }
      } catch (err) {
        console.error('Admin verification error:', err);
        setIsVerifiedAdmin(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdminRole();
  }, [user, isLoading]);

  // Reset verification state when user changes
  useEffect(() => {
    if (!user) {
      verificationAttempted.current = false;
      setIsVerifying(true);
      setIsVerifiedAdmin(false);
    }
  }, [user]);

  // Show loading while checking auth and admin status
  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to admin login page
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in but not admin (either context or verified) - redirect to home silently
  if (!isAdmin || !isVerifiedAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
