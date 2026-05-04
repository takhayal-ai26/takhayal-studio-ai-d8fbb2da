-- Let the admin CMS manage both image and video tools from the same tools table.

ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS selected_video_model_id uuid REFERENCES public.video_models(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tools_media_type_check'
      AND conrelid = 'public.tools'::regclass
  ) THEN
    ALTER TABLE public.tools
      ADD CONSTRAINT tools_media_type_check CHECK (media_type IN ('image', 'video'));
  END IF;
END $$;

UPDATE public.tools
SET media_type = 'video'
WHERE result_type = 'video'
   OR route LIKE '/video/%';

UPDATE public.tools
SET media_type = 'image'
WHERE media_type IS NULL
   OR media_type NOT IN ('image', 'video');

INSERT INTO public.tools (
  slug, route, media_type, input_type, icon_name, active, featured,
  title_en, title_ar,
  description_en, description_ar,
  short_desc_en, short_desc_ar,
  hero_title_en, hero_title_ar,
  hero_subtitle_en, hero_subtitle_ar,
  cover_image_url,
  provider_name, provider_endpoint,
  default_credit_cost, internal_provider_cost_estimate,
  result_type, sort_order,
  tool_mode, selected_model_id, selected_video_model_id,
  default_prompt_en, default_prompt_ar,
  cta_label_en, cta_label_ar,
  upload_label_en, upload_label_ar,
  upload_helper_en, upload_helper_ar,
  requires_upload, auto_run, prompt_hidden
) VALUES (
  'generate-video', '/video/generate-video', 'video', 'prompt', 'Film', true, true,
  'Generate Video', 'توليد فيديو',
  'Create short AI videos from a prompt, image, or reference frames.',
  'أنشئ فيديوهات قصيرة بالذكاء الاصطناعي من وصف أو صورة أو لقطات مرجعية.',
  'Create videos from text or image', 'أنشئ فيديو من نص أو صورة',
  'Bring your idea into motion', 'حوّل فكرتك إلى حركة',
  'Choose a video model, add a prompt, and generate a clip ready for your campaign.',
  'اختر نموذج فيديو، أضف وصفك، وولّد مقطعاً جاهزاً لحملتك.',
  '/assets/tools/video-cover.jpg',
  'fal.ai', '',
  25, 0,
  'video', 5,
  'video', null,
  (SELECT id FROM public.video_models WHERE is_active = true ORDER BY sort_order ASC LIMIT 1),
  '', '',
  'Generate Video', 'توليد الفيديو',
  'Upload start image', 'رفع صورة البداية',
  'Optional image reference', 'صورة مرجعية اختيارية',
  false, false, false
)
ON CONFLICT (slug) DO UPDATE SET
  route = EXCLUDED.route,
  media_type = EXCLUDED.media_type,
  result_type = EXCLUDED.result_type,
  tool_mode = EXCLUDED.tool_mode,
  icon_name = EXCLUDED.icon_name,
  selected_video_model_id = COALESCE(tools.selected_video_model_id, EXCLUDED.selected_video_model_id),
  updated_at = now();
