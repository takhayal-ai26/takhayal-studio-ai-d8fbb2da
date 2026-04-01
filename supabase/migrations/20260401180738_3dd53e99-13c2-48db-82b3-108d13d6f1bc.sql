
CREATE TABLE public.promo_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL DEFAULT '',
  title_ar TEXT NOT NULL DEFAULT '',
  subtitle_en TEXT NOT NULL DEFAULT '',
  subtitle_ar TEXT NOT NULL DEFAULT '',
  badge_en TEXT NOT NULL DEFAULT '',
  badge_ar TEXT NOT NULL DEFAULT '',
  cta_label_en TEXT NOT NULL DEFAULT '',
  cta_label_ar TEXT NOT NULL DEFAULT '',
  cta_action_type TEXT NOT NULL DEFAULT 'open_signup_modal',
  cta_url TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT 'logged_out_only',
  active BOOLEAN NOT NULL DEFAULT true,
  dismissible BOOLEAN NOT NULL DEFAULT true,
  dismissal_days INTEGER NOT NULL DEFAULT 7,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  background_style TEXT NOT NULL DEFAULT 'brand_orange',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read promo_banners" ON public.promo_banners FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated read promo_banners" ON public.promo_banners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write promo_banners" ON public.promo_banners FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update promo_banners" ON public.promo_banners FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete promo_banners" ON public.promo_banners FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
