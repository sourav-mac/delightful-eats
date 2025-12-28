import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Save } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile as ProfileType } from '@/types/database';
import { toast } from 'sonner';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) setProfile(data as ProfileType);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully');
      fetchProfile();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <h1 className="text-3xl font-display font-bold mb-8">My Profile</h1>

        <div className="space-y-6">
          {/* Avatar Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={profile?.avatar_url || user.user_metadata?.avatar_url} 
                    alt={profile?.full_name || 'User'} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-display font-semibold truncate">
                    {profile?.full_name || 'User'}
                  </h2>
                  <p className="text-muted-foreground text-sm break-all">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        name="full_name"
                        defaultValue={profile?.full_name || ''}
                        placeholder="Your name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email || ''}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={profile?.phone || ''}
                        placeholder="+880 1XXX-XXXXXX"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Sign Out</CardTitle>
              <CardDescription>Sign out from your account on this device</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
