
-- Model Guides CMS table
CREATE TABLE public.model_guides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  subtitle_ar text NOT NULL DEFAULT '',
  short_description_en text NOT NULL DEFAULT '',
  short_description_ar text NOT NULL DEFAULT '',
  tags_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags_ar jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_image_url text NOT NULL DEFAULT '',
  comparison_enabled boolean NOT NULL DEFAULT false,
  comparison_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  comparison_model_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  best_for_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  speed text NOT NULL DEFAULT 'fast',
  quality text NOT NULL DEFAULT 'high',
  best_for_line_en text NOT NULL DEFAULT '',
  best_for_line_ar text NOT NULL DEFAULT '',
  linked_model_id uuid REFERENCES public.models(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.model_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read model_guides" ON public.model_guides FOR SELECT USING (true);
CREATE POLICY "Admin insert model_guides" ON public.model_guides FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update model_guides" ON public.model_guides FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete model_guides" ON public.model_guides FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_model_guides_updated_at BEFORE UPDATE ON public.model_guides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for model guide images
INSERT INTO storage.buckets (id, name, public) VALUES ('model-guide-images', 'model-guide-images', true);

CREATE POLICY "Anyone can view model guide images" ON storage.objects FOR SELECT USING (bucket_id = 'model-guide-images');
CREATE POLICY "Admin upload model guide images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'model-guide-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update model guide images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'model-guide-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete model guide images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'model-guide-images' AND has_role(auth.uid(), 'admin'::app_role));
