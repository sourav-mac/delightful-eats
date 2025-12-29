import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Shield, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  // Detect password reset token from URL hash
  useEffect(() => {
    const handlePasswordRecovery = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        // Set the session with the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });
        
        if (error) {
          toast.error('Invalid or expired reset link');
          // Clear the hash
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          setShowResetPassword(true);
          // Clear the hash for security
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    handlePasswordRecovery();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully!');
        setShowResetPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        // Sign out to force re-login with new password
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      console.error('Update password error:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // First, check if the email is in the allowed admin emails list
      const { data: allowedEmail, error: allowedError } = await supabase
        .from('allowed_admin_emails')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (allowedError) {
        console.error('Allowed email check error:', allowedError);
        toast.error('Access verification failed');
        setIsLoading(false);
        return;
      }

      if (!allowedEmail) {
        toast.error('This email is not authorized for admin access');
        setIsLoading(false);
        return;
      }

      // Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast.error(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Authentication failed');
        setIsLoading(false);
        return;
      }

      // Verify admin role from database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('Role verification error:', roleError);
        await supabase.auth.signOut();
        toast.error('Access verification failed');
        setIsLoading(false);
        return;
      }

      if (!roleData) {
        // Not an admin - sign them out immediately
        await supabase.auth.signOut();
        toast.error('Access denied. Admin credentials required.');
        setIsLoading(false);
        return;
      }

      // Admin verified - redirect to dashboard
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if email is in allowed admin emails
      const { data: allowedEmail } = await supabase
        .from('allowed_admin_emails')
        .select('email')
        .eq('email', forgotEmail.toLowerCase().trim())
        .maybeSingle();

      if (!allowedEmail) {
        toast.error('This email is not authorized for admin access');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/admin/login`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset link sent to your email');
        setShowForgotPassword(false);
        setForgotEmail('');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Show Reset Password Form
  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
        <Card className="w-full max-w-md shadow-elevated border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Set New Password</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your new password below.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="new-password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    placeholder="••••••••"
                    className="bg-background pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-full hover:bg-transparent" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="bg-background"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                <Lock className="h-4 w-4" />
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Forgot Password Form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
        <Card className="w-full max-w-md shadow-elevated border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Reset Password</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your admin email to receive a password reset link.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Admin Email</Label>
                <Input 
                  id="forgot-email" 
                  type="email" 
                  required 
                  placeholder="admin@example.com"
                  className="bg-background"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full gap-2" 
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-md shadow-elevated border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Admin Portal</CardTitle>
            <CardDescription className="text-muted-foreground">
              Restricted access. Authorized personnel only.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                required 
                placeholder="admin@example.com"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••"
                  className="bg-background pr-10"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-full hover:bg-transparent" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              <Lock className="h-4 w-4" />
              {isLoading ? 'Verifying...' : 'Access Admin Panel'}
            </Button>
            <Button 
              type="button" 
              variant="link" 
              className="w-full text-sm text-muted-foreground" 
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </Button>
          </form>
          
          <p className="mt-4 text-center text-xs text-muted-foreground">
            This area is for authorized administrators only.
            <br />
            Unauthorized access attempts are logged.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
