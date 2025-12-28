import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RestaurantSettings {
  open_time: string;
  close_time: string;
  min_order_price: number;
  delivery_charge: number;
  whatsapp_number: string;
  isOpen: boolean;
}

export function useRestaurantSettings() {
  const [settings, setSettings] = useState<RestaurantSettings>({
    open_time: '10:00',
    close_time: '22:00',
    min_order_price: 100,
    delivery_charge: 50,
    whatsapp_number: '',
    isOpen: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const parseSettings = (data: { setting_key: string; setting_value: string }[]) => {
    const settingsMap: Record<string, string> = {};
    data.forEach((row) => {
      settingsMap[row.setting_key] = row.setting_value;
    });

    const openTime = settingsMap.open_time || '10:00';
    const closeTime = settingsMap.close_time || '22:00';
    const minOrderPrice = parseFloat(settingsMap.min_order_price) || 100;
    const deliveryCharge = parseFloat(settingsMap.delivery_charge) || 50;
    const whatsappNumber = settingsMap.whatsapp_number || '';

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const isOpen = currentTime >= openTime && currentTime <= closeTime;

    return {
      open_time: openTime,
      close_time: closeTime,
      min_order_price: minOrderPrice,
      delivery_charge: deliveryCharge,
      whatsapp_number: whatsappNumber,
      isOpen,
    };
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*');

    if (error) {
      console.error('Failed to load settings:', error);
    } else if (data) {
      setSettings(parseSettings(data));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('restaurant-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_settings',
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, isLoading, refetch: fetchSettings };
}
