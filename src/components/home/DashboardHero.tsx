import { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase, supabaseConfigMissing } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '@/context/AppThemeContext';
import heroPoster768 from '@/assets/landing/hero-video-poster-768.avif';
import heroPoster960 from '@/assets/landing/hero-video-poster-960.avif';
import heroPosterFallback from '@/assets/landing/hero-video-poster.jpg';
const HERO_CONFIG_KEYS = [
  'video_hero_video_url',
  'video_hero_webm_url',
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
  video_hero_video_url: 'https://junmnibsurnslpcqhjle.supabase.co/storage/v1/object/public/tool-covers/hero-video-optimized.mp4',
  video_hero_webm_url: 'https://junmnibsurnslpcqhjle.supabase.co/storage/v1/object/public/tool-covers/hero-video-optimized.webm',
  video_hero_poster_url: '',
  video_hero_headline1_en: 'Imagine',
  video_hero_headline2_en: 'More',
  video_hero_subtitle_en: 'Create striking images and cinematic videos with AI built for modern creators.',
  video_hero_headline1_ar: 'تخيّل',
  video_hero_headline2_ar: 'أكثر',
  video_hero_subtitle_ar: 'حوّل أفكارك إلى صور وفيديوهات مذهلة خلال ثوانٍ، واصنع محتوى يلفت الأنظار.',
  video_hero_overlay_intensity: '0.40',
  video_hero_text_align: 'center',
  video_hero_enabled: 'true',
  video_hero_poster_enabled: 'false',
};

const CACHE_KEY = 'video_hero_config_cache';

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

function readCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function canAutoplayHeroVideo() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  const connection = (navigator as NavigatorWithConnection).connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && /(^|-)2g$/.test(connection.effectiveType)) return false;

  return true;
}

export function DashboardHero() {
  const { lang } = useLanguage();
  const { mode } = useAppTheme();
  const isLight = mode === 'light';
  const isAr = lang === 'ar';
  const [initial] = useState(() => readCache());
  const [shouldLoadVideo] = useState(() => canAutoplayHeroVideo());
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    enabled: !supabaseConfigMissing,
  });

  useEffect(() => {
    if (config) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(config)); } catch { return; }
    }
  }, [config]);

  // Attempt autoplay on mount — handles mobile Safari restrictions
  const stallTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.then(() => {
        // Playback started — clear any stall timer
        clearTimeout(stallTimerRef.current);
      }).catch(() => {
        // Autoplay explicitly blocked — show poster fallback
        setVideoFailed(true);
        clearTimeout(stallTimerRef.current);
      });
    }

    // iOS Low Power Mode: play() may resolve but video stays paused.
    // Only start stall detection AFTER play attempt, not from mount.
    stallTimerRef.current = setTimeout(() => {
      if (v.paused && v.currentTime === 0) {
        setVideoFailed(true);
      }
    }, 4000);
  }, []);

  useEffect(() => {
    if (!shouldLoadVideo) return;

    const v = videoRef.current;
    if (!v) return;

    // If metadata already loaded, try immediately
    if (v.readyState >= 1) {
      tryPlay();
    } else {
      v.addEventListener('loadedmetadata', tryPlay, { once: true });
    }

    // Also handle network/source errors
    const onError = () => setVideoFailed(true);
    v.addEventListener('error', onError);

    return () => {
      v.removeEventListener('loadedmetadata', tryPlay);
      v.removeEventListener('error', onError);
      clearTimeout(stallTimerRef.current);
    };
  }, [shouldLoadVideo, tryPlay]);

  const c = { ...DEFAULTS, ...(config || {}) };
  const videoUrl = c.video_hero_video_url;
  const webmUrl = c.video_hero_webm_url;
  const posterUrl = c.video_hero_poster_url;
  const posterEnabled = c.video_hero_poster_enabled === 'true';
  const heroEnabled = c.video_hero_enabled !== 'false';
  const baseOverlay = parseFloat(c.video_hero_overlay_intensity) || 0.4;
  const overlay = isLight ? Math.min(baseOverlay + 0.2, 0.75) : baseOverlay;
  const align = c.video_hero_text_align || 'center';

  // Use admin poster, or built-in fallback
  const usingCustomPoster = posterEnabled && !!posterUrl;
  const fallbackPoster = usingCustomPoster ? posterUrl : heroPosterFallback;

  const h1 = isAr ? c.video_hero_headline1_ar : c.video_hero_headline1_en;
  const h2 = isAr ? c.video_hero_headline2_ar : c.video_hero_headline2_en;
  const subtitle = isAr ? c.video_hero_subtitle_ar : c.video_hero_subtitle_en;

  return (
    <section
      className="relative w-full overflow-hidden mt-[calc(-3.5rem-var(--banner-h,0px))] md:mt-[calc(-2.75rem-var(--banner-h,0px))]"
      style={{ height: '100svh', minHeight: 520 }}
      data-desktop-hero
    >
      {usingCustomPoster ? (
        <img
          src={fallbackPoster}
          alt=""
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
      ) : (
        <picture>
          <source media="(max-width: 768px)" srcSet={heroPoster768} type="image/avif" />
          <source media="(max-width: 1280px)" srcSet={heroPoster960} type="image/avif" />
          <img
            src={heroPosterFallback}
            alt=""
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
        </picture>
      )}

      {/* Video — autoplay by default with poster fallback if playback fails */}
      {heroEnabled && shouldLoadVideo && !videoFailed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          poster={fallbackPoster}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          {webmUrl && <source src={webmUrl} type="video/webm" />}
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

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
        style={{
          textAlign: align as any,
          paddingTop: 'calc(3.5rem + var(--banner-h, 0px) + env(safe-area-inset-top, 0px))',
        }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <h1
          className="tracking-tight drop-shadow-2xl"
          style={{
            fontFamily: isAr ? "'Noto Kufi Arabic', 'IBM Plex Sans Arabic', 'Cairo', sans-serif" : undefined,
            fontSize: isAr ? 'clamp(52px, 12vw, 110px)' : 'clamp(56px, 13vw, 130px)',
            lineHeight: isAr ? 1.12 : 0.95,
            letterSpacing: isAr ? 0 : '-0.04em',
            fontWeight: 900,
          }}
        >
          <span className="block text-white">{h1}</span>
          <span
            className="block"
            style={{
              color: 'hsl(var(--primary))',
              marginTop: isAr ? '0.03em' : undefined,
              textShadow: '0 10px 30px rgba(240, 62, 27, 0.24)',
            }}
          >
            {h2}
          </span>
        </h1>

        {subtitle && (
          <p
            className="mt-5 md:mt-7 max-w-[560px] mx-auto drop-shadow-lg"
            style={{
              fontSize: isAr ? 'clamp(15px, 2vw, 19px)' : 'clamp(14px, 1.8vw, 18px)',
              lineHeight: isAr ? 1.8 : 1.7,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: isAr ? "'IBM Plex Sans Arabic', 'Cairo', sans-serif" : undefined,
              fontWeight: isAr ? 500 : 400,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: isLight ? 64 : 128,
          background: isLight
            ? 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.18))'
            : 'linear-gradient(to bottom, transparent, hsl(var(--background)))',
          zIndex: 2,
        }}
      />
    </section>
  );
}
