
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL DEFAULT '',
  name_ar TEXT NOT NULL DEFAULT '',
  role_en TEXT NOT NULL DEFAULT '',
  role_ar TEXT NOT NULL DEFAULT '',
  testimonial_en TEXT NOT NULL DEFAULT '',
  testimonial_ar TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  location_en TEXT NOT NULL DEFAULT '',
  location_ar TEXT NOT NULL DEFAULT '',
  company_en TEXT NOT NULL DEFAULT '',
  company_ar TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read testimonials"
  ON public.testimonials FOR SELECT
  USING (true);

CREATE POLICY "Admin write testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
