-- Allow anyone to view basic profile info for display purposes
CREATE POLICY "Anyone can view profile display info" 
ON public.profiles 
FOR SELECT 
USING (true);