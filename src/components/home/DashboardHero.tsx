import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '@/context/AppThemeContext';

const HERO_CONFIG_KEYS = [
  'video_hero_video_url',
  'video_hero_poster_url',
  'video_hero_headline1_en',
  'video_hero_headline2_en',
  'video_hero_subtitle_en',
  'video_hero_headline1_ar',
  'video_hero_headline2_ar',
  'video_hero_subtitle_ar',
  'video_hero_overlay_intensity',
  'video_hero_text_align',
  'video_hero_enabled',
  'video_hero_poster_enabled',
] as const;

const DEFAULTS: Record<string, string> = {
  video_hero_video_url: 'https://njenobbxlbhbzwpkylha.supabase.co/storage/v1/object/public/tool-covers/hero-video.mp4',
  video_hero_poster_url: '',
  video_hero_headline1_en: 'Imagine',
  video_hero_headline2_en: 'More',
  video_hero_subtitle_en: 'Create striking images and cinematic videos with AI built for modern creators.',
  video_hero_headline1_ar: 'تخيّل',
  video_hero_headline2_ar: 'أكثر',
  video_hero_subtitle_ar: 'أنشئ صوراً مدهشة وفيديوهات سينمائية بالذكاء الاصطناعي، مصممة للمبدعين العصريين.',
  video_hero_overlay_intensity: '0.40',
  video_hero_text_align: 'center',
  video_hero_enabled: 'true',
  video_hero_poster_enabled: 'false',
};

const CACHE_KEY = 'video_hero_config_cache';

function readCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function DashboardHero() {
  const { lang } = useLanguage();
  const { mode } = useAppTheme();
  const isLight = mode === 'light';
  const isAr = lang === 'ar';
  const [initial] = useState(() => readCache());

  const { data: config } = useQuery({
    queryKey: ['video-hero-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_config')
        .select('config_key, config_value')
        .in('config_key', [...HERO_CONFIG_KEYS]);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.config_key] = r.config_value; });
      return map;
    },
    placeholderData: initial,
    staleTime: 30000,
  });

  useEffect(() => {
    if (config) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(config)); } catch {}
    }
  }, [config]);

  const c = { ...DEFAULTS, ...(config || {}) };
  const videoUrl = c.video_hero_video_url;
  const posterUrl = c.video_hero_poster_url;
  const posterEnabled = c.video_hero_poster_enabled === 'true';
  const baseOverlay = parseFloat(c.video_hero_overlay_intensity) || 0.4;
  const overlay = isLight ? Math.min(baseOverlay + 0.2, 0.75) : baseOverlay;
  const align = c.video_hero_text_align || 'center';

  const h1 = isAr ? c.video_hero_headline1_ar : c.video_hero_headline1_en;
  const h2 = isAr ? c.video_hero_headline2_ar : c.video_hero_headline2_en;
  const subtitle = isAr ? c.video_hero_subtitle_ar : c.video_hero_subtitle_en;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100vh', minHeight: 520, marginTop: 'calc(-3.5rem - var(--banner-h, 0px))' }}
    >
      {/* Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        {...(posterEnabled && posterUrl ? { poster: posterUrl } : {})}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${overlay * 0.6}) 0%, rgba(0,0,0,${overlay}) 50%, rgba(0,0,0,${overlay * 1.2}) 100%)`,
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center h-full px-6"
        style={{ textAlign: align as any }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Headline */}
        <h1
          className="tracking-tight drop-shadow-2xl"
          style={{
            fontFamily: isAr ? "'Cairo', sans-serif" : undefined,
            fontSize: isAr ? 'clamp(52px, 12vw, 110px)' : 'clamp(56px, 13vw, 130px)',
            lineHeight: isAr ? 1.1 : 0.95,
            letterSpacing: isAr ? 0 : '-0.04em',
            fontWeight: 900,
          }}
        >
          <span className="block text-white">{h1}</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(135deg, #F03E1B 0%, #FF6B35 40%, #FFB347 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {h2}
          </span>
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="mt-5 md:mt-7 max-w-[560px] mx-auto drop-shadow-lg"
            style={{
              fontSize: isAr ? 'clamp(15px, 2vw, 19px)' : 'clamp(14px, 1.8vw, 18px)',
              lineHeight: isAr ? 1.8 : 1.7,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: isAr ? "'Cairo', sans-serif" : undefined,
              fontWeight: 400,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom fade to page bg */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))',
          zIndex: 2,
        }}
      />
    </section>
  );
}
