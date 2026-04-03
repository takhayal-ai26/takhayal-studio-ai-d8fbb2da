
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _full_name text;
  _first_name text;
  _last_name text;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  -- Split full_name into first and last
  _first_name := COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(_full_name, ' ', 1), '');
  _last_name := COALESCE(NEW.raw_user_meta_data->>'family_name', 
    CASE WHEN position(' ' in _full_name) > 0 
      THEN substring(_full_name from position(' ' in _full_name) + 1)
      ELSE '' 
    END, '');

  INSERT INTO public.profiles (user_id, full_name, first_name, last_name, email, avatar_url)
  VALUES (
    NEW.id,
    _full_name,
    _first_name,
    _last_name,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$;
