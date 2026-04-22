-- Add error_message column to generation_logs
ALTER TABLE public.generation_logs ADD COLUMN error_message TEXT NULL;

-- Insert missing profile for user 2366424e-fb4e-4445-96ea-c783000f60c0
INSERT INTO public.profiles (
  user_id, email, full_name, first_name, last_name, credits, plan, language, theme_preference, status
) VALUES (
  '2366424e-fb4e-4445-96ea-c783000f60c0',
  'kalshuaib96@gmail.com',
  'Khaled A',
  'Khaled',
  'A',
  50,
  'free',
  'en',
  'dark',
  'active'
);