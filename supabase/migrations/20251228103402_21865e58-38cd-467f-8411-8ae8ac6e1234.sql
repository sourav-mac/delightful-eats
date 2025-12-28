-- Add WhatsApp number to restaurant settings
INSERT INTO public.restaurant_settings (setting_key, setting_value)
VALUES ('whatsapp_number', '+8801XXXXXXXXX')
ON CONFLICT (setting_key) DO NOTHING;