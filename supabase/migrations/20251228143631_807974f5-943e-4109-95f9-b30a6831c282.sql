-- Create table for storing OTP codes
CREATE TABLE public.phone_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- Allow edge functions with service role to manage OTPs
CREATE POLICY "Service role can manage OTPs"
ON public.phone_otps
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_phone_otps_phone ON public.phone_otps(phone);
CREATE INDEX idx_phone_otps_expires_at ON public.phone_otps(expires_at);

-- Add phone column to profiles if not exists (for linking phone to user)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;