-- Create validation function for restaurant settings
CREATE OR REPLACE FUNCTION public.validate_restaurant_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate based on setting_key
  CASE NEW.setting_key
    WHEN 'min_order_price' THEN
      -- Must be a valid non-negative number with reasonable max
      IF NEW.setting_value !~ '^\d+(\.\d+)?$' OR 
         NEW.setting_value::NUMERIC < 0 OR 
         NEW.setting_value::NUMERIC > 10000 THEN
        RAISE EXCEPTION 'min_order_price must be a number between 0 and 10000';
      END IF;
      
    WHEN 'delivery_charge' THEN
      -- Must be a valid non-negative number with reasonable max
      IF NEW.setting_value !~ '^\d+(\.\d+)?$' OR 
         NEW.setting_value::NUMERIC < 0 OR 
         NEW.setting_value::NUMERIC > 1000 THEN
        RAISE EXCEPTION 'delivery_charge must be a number between 0 and 1000';
      END IF;
      
    WHEN 'open_time', 'close_time' THEN
      -- Must be valid HH:MM format (00:00 to 23:59)
      IF NEW.setting_value !~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$' THEN
        RAISE EXCEPTION '% must be in HH:MM format (00:00 to 23:59)', NEW.setting_key;
      END IF;
      
    WHEN 'is_open' THEN
      -- Must be 'true' or 'false'
      IF NEW.setting_value NOT IN ('true', 'false') THEN
        RAISE EXCEPTION 'is_open must be true or false';
      END IF;
      
    ELSE
      -- Unknown setting keys are allowed but logged
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate settings before insert or update
DROP TRIGGER IF EXISTS validate_restaurant_settings_trigger ON public.restaurant_settings;

CREATE TRIGGER validate_restaurant_settings_trigger
BEFORE INSERT OR UPDATE ON public.restaurant_settings
FOR EACH ROW
EXECUTE FUNCTION public.validate_restaurant_settings();