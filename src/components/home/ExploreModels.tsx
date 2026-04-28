import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight, ArrowLeft, Cpu, Film } from 'lucide-react';
import { useModelGuides } from '@/hooks/useModelGuides';
import { useModels } from '@/hooks/useModels';
import { useVideoModels } from '@/hooks/useVideoModels';

interface DisplayModel {
  slug: string;
  name_en: string;
  name_ar: string;
  type: 'image' | 'video';
  main_image_url?: string;
}

const IMAGE_MODELS: DisplayModel[] = [
  { slug: 'nano-banana-pro', name_en: 'Nano Banana Pro', name_ar: 'نانو بنانا برو', type: 'image' },
  { slug: 'seedream-4-5', name_en: 'Seedream 4.5', name_ar: 'سيدريم 4.5', type: 'image' },
  { slug: 'nano-banana-2', name_en: 'Nano Banana 2', name_ar: 'نانو بنانا 2', type: 'image' },
  { slug: 'ideogram-v3', name_en: 'Ideogram V3', name_ar: 'آيديوغرام V3', type: 'image' },
  { slug: 'flux-1-1-pro', name_en: 'FLUX 1.1 Pro', name_ar: 'فلَكس 1.1 برو', type: 'image' },
  { slug: 'gpt-image-1-5', name_en: 'GPT Image 1.5', name_ar: 'جي بي تي إيمج 1.5', type: 'image' },
  { slug: 'imagen-4', name_en: 'Imagen 4', name_ar: 'إيميجن 4', type: 'image' },
  { slug: 'qwen-image', name_en: 'Qwen Image', name_ar: 'كوين إيمج', type: 'image' },
];

const VIDEO_MODELS: DisplayModel[] = [
  { slug: 'kling-v2-6-pro', name_en: 'Kling v2.6 Pro', name_ar: 'كلينج v2.6 برو', type: 'video' },
  { slug: 'seedance-1-5-pro', name_en: 'Seedance 1.5 Pro', name_ar: 'سيدانس 1.5 برو', type: 'video' },
  { slug: 'wan-2-6', name_en: 'Wan 2.6', name_ar: 'وان 2.6', type: 'video' },
  { slug: 'hailuo-2-3', name_en: 'Hailuo 2.3', name_ar: 'هايلو 2.3', type: 'video' },
  { slug: 'veo-3-1', name_en: 'Veo 3.1', name_ar: 'فيو 3.1', type: 'video' },
  { slug: 'grok-imagine', name_en: 'Grok Imagine', name_ar: 'جروك إماجن', type: 'video' },
  { slug: 'seedream-5-0-lite', name_en: 'Seedream 5.0 Lite', name_ar: 'سيدريم 5.0 لايت', type: 'video' },
  { slug: 'kling-v3-pro', name_en: 'Kling v3.0 Pro', name_ar: 'كلينج v3.0 برو', type: 'video' },
];

const MARQUEE_CSS = `
@keyframes em-marquee-left {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}
@keyframes em-marquee-right {
  0% { transform: translate3d(-50%, 0, 0); }
  100% { transform: translate3d(0, 0, 0); }
}
.em-track:hover { animation-play-state: paused; }
`;

function hueFromSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % 360;
}

function ModelCard({ model, isAr }: { model: DisplayModel; isAr: boolean }) {
  const navigate = useNavigate();
  const name = isAr ? model.name_ar || model.name_en : model.name_en;
  const isVideo = model.type === 'video';
  const hue = hueFromSlug(model.slug);
  const fallbackBg = `linear-gradient(135deg, hsl(${hue}, 55%, 16%) 0%, hsl(${(hue + 35) % 360}, 65%, 26%) 100%)`;

  return (
    <button
      onClick={() => navigate(`/models/${model.slug}`)}
      className="group relative block flex-shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-card/30 shadow-[0_4px_18px_-8px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_18px_36px_-12px_hsl(var(--primary)/0.35)] text-start w-[200px] sm:w-[230px] md:w-[250px] lg:w-[268px] xl:w-[284px]"
      aria-label={name}
      dir="ltr"
    >
      <div
        className="relative aspect-video overflow-hidden"
        style={!model.main_image_url ? { background: fallbackBg } : undefined}
      >
        {model.main_image_url ? (
          <img
            src={model.main_image_url}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15"
              style={{ boxShadow: `0 0 0 1px hsl(${hue}, 70%, 50%, 0.25)` }}
            >
              {isVideo ? (
                <Film size={24} className="text-white/85" />
              ) : (
                <Cpu size={24} className="text-white/85" />
              )}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white/95 uppercase tracking-[0.12em]">
          {isVideo ? <Film size={11} strokeWidth={2.5} /> : <Cpu size={11} strokeWidth={2.5} />}
          <span>{isVideo ? (isAr ? 'فيديو' : 'Video') : (isAr ? 'صورة' : 'Image')}</span>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-4" dir={isAr ? 'rtl' : 'ltr'}>
          <h3 className="text-white font-bold text-[15px] md:text-base leading-tight truncate drop-shadow-md">
            {name}
          </h3>
        </div>
      </div>
    </button>
  );
}

function MarqueeHalf({ items, isAr, ariaHidden }: { items: DisplayModel[]; isAr: boolean; ariaHidden?: boolean }) {
  return (
    <div className="flex flex-shrink-0" aria-hidden={ariaHidden}>
      {items.map((m, i) => (
        <div key={`${m.slug}-${i}`} className="flex-shrink-0" style={{ marginRight: 16 }}>
          <ModelCard model={m} isAr={isAr} />
        </div>
      ))}
    </div>
  );
}

interface InfiniteModelRowProps {
  models: DisplayModel[];
  direction: 'left' | 'right';
  isAr: boolean;
  speedSeconds?: number;
}

function InfiniteModelRow({ models, direction, isAr, speedSeconds = 60 }: InfiniteModelRowProps) {
  if (models.length === 0) return null;

  const minPerHalf = 16;
  const repeats = Math.max(1, Math.ceil(minPerHalf / models.length));
  const half: DisplayModel[] = [];
  for (let i = 0; i < repeats; i++) half.push(...models);

  const animationName = direction === 'left' ? 'em-marquee-left' : 'em-marquee-right';

  return (
    <div
      className="relative w-full overflow-hidden"
      dir="ltr"
      style={{
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
      }}
    >
      <div
        className="em-track flex"
        style={{
          width: 'max-content',
          animation: `${animationName} ${speedSeconds}s linear infinite`,
          willChange: 'transform',
        }}
      >
        <MarqueeHalf items={half} isAr={isAr} />
        <MarqueeHalf items={half} isAr={isAr} ariaHidden />
      </div>
    </div>
  );
}

export function ExploreModels() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { guides } = useModelGuides();
  const { models: imageModelRows } = useModels();
  const { models: videoModelRows } = useVideoModels(true);

  const { imageModels, videoModels } = useMemo(() => {
    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const thumbBySlug = new Map<string, string>();

    for (const g of guides) {
      if (g.slug && g.main_image_url) thumbBySlug.set(g.slug, g.main_image_url);
    }

    for (const m of imageModelRows) {
      if (m.preview_image_url && m.model_name) {
        thumbBySlug.set(slugify(m.model_name), m.preview_image_url);
      }
    }

    for (const vm of videoModelRows) {
      if (vm.preview_image_url && vm.name) {
        thumbBySlug.set(slugify(vm.name), vm.preview_image_url);
      }
      if (vm.preview_image_url && vm.display_name) {
        const displayNameSlug = slugify(vm.display_name);
        if (!thumbBySlug.has(displayNameSlug)) thumbBySlug.set(displayNameSlug, vm.preview_image_url);
      }
    }

    const enrich = (m: DisplayModel): DisplayModel => {
      const url = thumbBySlug.get(m.slug);
      return url ? { ...m, main_image_url: url } : m;
    };

    return {
      imageModels: IMAGE_MODELS.map(enrich),
      videoModels: VIDEO_MODELS.map(enrich),
    };
  }, [guides, imageModelRows, videoModelRows]);

  return (
    <section className="relative w-full py-16">
      <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />

      <div className="text-center px-5 md:px-8 mb-10">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          {isAr ? 'استكشف نماذجنا' : 'Explore Our Models'}
        </h2>
        <div className="mx-auto mt-3 w-10 h-0.5 rounded-full bg-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          {isAr
            ? 'محركات الذكاء الاصطناعي التي تشغّل إبداعاتك'
            : 'Powerful AI engines behind your creations'}
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <InfiniteModelRow models={imageModels} direction="left" isAr={isAr} speedSeconds={60} />
        <InfiniteModelRow models={videoModels} direction="right" isAr={isAr} speedSeconds={60} />
      </div>

      <div className="text-center mt-12 px-5 md:px-8">
        <button
          onClick={() => navigate('/models')}
          className="inline-flex min-h-11 items-center gap-2.5 px-8 py-3.5 rounded-full text-[15px] font-semibold bg-primary text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.35)] shadow-[0_4px_16px_hsl(var(--primary)/0.2)] active:scale-[0.98]"
        >
          {isAr ? 'تصفح جميع النماذج' : 'Browse All Models'}
          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </section>
  );
}
