-- Create restaurant_settings table for configurable settings
CREATE TABLE public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (needed for checkout, display)
CREATE POLICY "Anyone can view settings"
ON public.restaurant_settings
FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.restaurant_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_restaurant_settings_updated_at
BEFORE UPDATE ON public.restaurant_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.restaurant_settings (setting_key, setting_value) VALUES
  ('open_time', '10:00'),
  ('close_time', '22:00'),
  ('min_order_price', '100'),
  ('delivery_charge', '50');

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Allow anyone to view menu images
CREATE POLICY "Anyone can view menu images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'menu-images');

-- Allow admins to upload menu images
CREATE POLICY "Admins can upload menu images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'menu-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update menu images
CREATE POLICY "Admins can update menu images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'menu-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete menu images
CREATE POLICY "Admins can delete menu images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'menu-images' AND has_role(auth.uid(), 'admin'::app_role));