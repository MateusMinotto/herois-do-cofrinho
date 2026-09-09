
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M','F','O'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _role_text TEXT;
  _gender TEXT;
BEGIN
  _gender := NEW.raw_user_meta_data->>'gender';
  IF _gender NOT IN ('M','F','O') THEN _gender := NULL; END IF;

  INSERT INTO public.profiles (id, full_name, email, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    _gender
  );

  _role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');
  IF _role_text NOT IN ('admin', 'parent', 'child') THEN
    _role_text := 'parent';
  END IF;
  _role := _role_text::public.app_role;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;
