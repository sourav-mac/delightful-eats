-- Fix 1: Add explicit INSERT policy for user_roles table (only admins can insert)
CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));