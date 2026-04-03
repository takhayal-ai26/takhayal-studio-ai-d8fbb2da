
ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS max_image_inputs integer NOT NULL DEFAULT 1;

-- Seedream 4.5 & 5.0 Lite: up to 10
UPDATE public.models SET max_image_inputs = 10 WHERE endpoint_id ILIKE '%seedream%';

-- GPT Image 1.5: multiple references, cap at 10
UPDATE public.models SET max_image_inputs = 10 WHERE endpoint_id ILIKE '%gpt-image%';

-- Nano Banana 2 & Pro: multiple via chat, cap at 10
UPDATE public.models SET max_image_inputs = 10 WHERE endpoint_id ILIKE '%nano-banana%';

-- Ideogram V3: 1 main + style refs, cap at 4
UPDATE public.models SET max_image_inputs = 4 WHERE endpoint_id ILIKE '%ideogram%';

-- Flux, Qwen: single image only (already default 1)
-- Imagen 4: no image input (supports_image_input = false, so irrelevant)
