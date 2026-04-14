
CREATE TABLE public.video_model_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_model_id UUID NOT NULL REFERENCES public.video_models(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  resolution TEXT NOT NULL,
  audio_enabled BOOLEAN NOT NULL DEFAULT false,
  api_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  our_credits INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_model_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read video model pricing"
  ON public.video_model_pricing FOR SELECT USING (true);

CREATE POLICY "Admins can insert video model pricing"
  ON public.video_model_pricing FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update video model pricing"
  ON public.video_model_pricing FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete video model pricing"
  ON public.video_model_pricing FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_video_model_pricing_updated_at
  BEFORE UPDATE ON public.video_model_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_video_model_pricing_model_id ON public.video_model_pricing(video_model_id);
CREATE INDEX idx_video_model_pricing_lookup ON public.video_model_pricing(video_model_id, duration_seconds, resolution, audio_enabled);
