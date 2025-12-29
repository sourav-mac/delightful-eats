import { useState, useEffect } from 'react';
import { Save, Clock, DollarSign, Truck } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Settings {
  open_time: string;
  close_time: string;
  min_order_price: string;
  delivery_charge: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    open_time: '10:00',
    close_time: '22:00',
    min_order_price: '100',
    delivery_charge: '50',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*');

    if (error) {
      toast.error('Failed to load settings');
      console.error(error);
    } else if (data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((row: { setting_key: string; setting_value: string }) => {
        settingsMap[row.setting_key] = row.setting_value;
      });
      setSettings({
        open_time: settingsMap.open_time || '10:00',
        close_time: settingsMap.close_time || '22:00',
        min_order_price: settingsMap.min_order_price || '100',
        delivery_charge: settingsMap.delivery_charge || '50',
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const updates = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
    }));

    // Upsert each setting
    for (const update of updates) {
      const { error } = await supabase
        .from('restaurant_settings')
        .update({ setting_value: update.setting_value })
        .eq('setting_key', update.setting_key);

      if (error) {
        toast.error(`Failed to update ${update.setting_key}`);
        console.error(error);
        setIsSaving(false);
        return;
      }
    }

    toast.success('Settings saved successfully');
    setIsSaving(false);
  };

  const handleChange = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage restaurant settings</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Operating Hours
              </CardTitle>
              <CardDescription>Set when your restaurant is open for orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="open_time">Opening Time</Label>
                <Input
                  id="open_time"
                  type="time"
                  value={settings.open_time}
                  onChange={(e) => handleChange('open_time', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="close_time">Closing Time</Label>
                <Input
                  id="close_time"
                  type="time"
                  value={settings.close_time}
                  onChange={(e) => handleChange('close_time', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Order Settings
              </CardTitle>
              <CardDescription>Configure minimum order and delivery charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_price">Minimum Order Price (₹)</Label>
                <Input
                  id="min_order_price"
                  type="number"
                  min="0"
                  step="1"
                  value={settings.min_order_price}
                  onChange={(e) => handleChange('min_order_price', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Customers must order at least this amount
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_charge">Delivery Charge (₹)</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="delivery_charge"
                    type="number"
                    min="0"
                    step="1"
                    className="pl-10"
                    value={settings.delivery_charge}
                    onChange={(e) => handleChange('delivery_charge', e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be added to each order
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Settings Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Opens At</p>
                <p className="text-2xl font-bold text-primary">{settings.open_time}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Closes At</p>
                <p className="text-2xl font-bold text-primary">{settings.close_time}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Min Order</p>
                <p className="text-2xl font-bold text-primary">₹{settings.min_order_price}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Delivery</p>
                <p className="text-2xl font-bold text-primary">₹{settings.delivery_charge}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
