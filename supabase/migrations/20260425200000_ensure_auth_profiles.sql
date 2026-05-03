CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name text;
  _first_name text;
  _last_name text;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  _first_name := COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(_full_name, ' ', 1), '');
  _last_name := COALESCE(
    NEW.raw_user_meta_data->>'family_name',
    CASE
      WHEN position(' ' in _full_name) > 0 THEN substring(_full_name from position(' ' in _full_name) + 1)
      ELSE ''
    END,
    ''
  );

  INSERT INTO public.profiles (
    user_id,
    full_name,
    first_name,
    last_name,
    email,
    avatar_url
  )
  VALUES (
    NEW.id,
    _full_name,
    _first_name,
    _last_name,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  first_name,
  last_name,
  avatar_url,
  last_sign_in_at
)
SELECT
  users.id,
  COALESCE(users.email, ''),
  COALESCE(users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name', ''),
  COALESCE(
    users.raw_user_meta_data->>'given_name',
    split_part(COALESCE(users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name', ''), ' ', 1),
    ''
  ),
  COALESCE(
    users.raw_user_meta_data->>'family_name',
    CASE
      WHEN position(' ' in COALESCE(users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name', '')) > 0
        THEN substring(
          COALESCE(users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name', '')
          from position(' ' in COALESCE(users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name', '')) + 1
        )
      ELSE ''
    END,
    ''
  ),
  COALESCE(users.raw_user_meta_data->>'avatar_url', users.raw_user_meta_data->>'picture', ''),
  users.last_sign_in_at
FROM auth.users AS users
LEFT JOIN public.profiles AS profiles
  ON profiles.user_id = users.id
WHERE profiles.user_id IS NULL;
