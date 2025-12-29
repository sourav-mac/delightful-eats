-- Create table to store allowed admin email addresses
CREATE TABLE public.allowed_admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can manage allowed emails
CREATE POLICY "Admins can manage allowed emails"
ON public.allowed_admin_emails
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can check if email is allowed (needed for login validation)
CREATE POLICY "Anyone can check allowed emails"
ON public.allowed_admin_emails
FOR SELECT
USING (true);

-- Insert the initial allowed admin email
INSERT INTO public.allowed_admin_emails (email) VALUES ('mandalsourav026@gmail.com');