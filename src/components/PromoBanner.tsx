import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface PromoBanner {
  id: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  badge_en: string;
  badge_ar: string;
  cta_label_en: string;
  cta_label_ar: string;
  cta_action_type: string;
  cta_url: string;
  audience: string;
  active: boolean;
  dismissible: boolean;
  dismissal_days: number;
  start_date: string | null;
  end_date: string | null;
  background_style: string;
  text_color: string;
  sort_order: number;
}

const DISMISS_KEY = 'promo_banner_dismissed_';

function isDismissed(banner: PromoBanner): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY + banner.id);
    if (!raw) return false;
    const dismissed = JSON.parse(raw);
    const expiry = new Date(dismissed.expiry);
    if (expiry <= new Date()) {
      localStorage.removeItem(DISMISS_KEY + banner.id);
      return false;
    }
    return true;
  } catch { return false; }
}

function dismissBanner(banner: PromoBanner) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + banner.dismissal_days);
  localStorage.setItem(DISMISS_KEY + banner.id, JSON.stringify({ expiry: expiry.toISOString() }));
}

const bgStyles: Record<string, string> = {
  brand_orange: 'bg-gradient-to-r from-primary via-primary/90 to-primary/80',
  brand_lime: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500',
  dark: 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900',
  custom: '',
};

// Shared state for banner visibility
let _bannerVisible = false;
const _listeners = new Set<(v: boolean) => void>();
function setBannerVisible(v: boolean) {
  _bannerVisible = v;
  _listeners.forEach(fn => fn(v));
}

export function usePromoBannerVisible() {
  const [visible, setVisible] = useState(_bannerVisible);
  useEffect(() => {
    _listeners.add(setVisible);
    return () => { _listeners.delete(setVisible); };
  }, []);
  return visible;
}

export function PromoBannerStrip() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    (supabase as any)
      .from('promo_banners')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }: any) => {
        if (data && Array.isArray(data)) setBanners(data);
      });
  }, []);

  const visibleBanners = useMemo(() => {
    if (loading) return [];
    const now = new Date();
    return banners.filter(b => {
      if (b.audience === 'logged_out_only' && isAuthenticated) return false;
      if (b.audience === 'logged_in_only' && !isAuthenticated) return false;
      if (b.start_date && new Date(b.start_date) > now) return false;
      if (b.end_date && new Date(b.end_date) < now) return false;
      if (b.dismissible && (isDismissed(b) || dismissed.has(b.id))) return false;
      return true;
    });
  }, [banners, isAuthenticated, loading, dismissed]);

  useEffect(() => {
    setBannerVisible(visibleBanners.length > 0);
  }, [visibleBanners]);

  const handleDismiss = (banner: PromoBanner) => {
    dismissBanner(banner);
    setDismissed(prev => new Set(prev).add(banner.id));
  };

  if (visibleBanners.length === 0) return null;

  const banner = visibleBanners[0];

  return <BannerRow banner={banner} onDismiss={() => handleDismiss(banner)} />;
}

function BannerRow({ banner, onDismiss }: { banner: PromoBanner; onDismiss: () => void }) {
  const { lang, isRTL } = useLanguage();
  const { openAuthModal } = useApp();
  const navigate = useNavigate();

  const isAr = lang === 'ar';
  const title = (isAr && banner.title_ar) || banner.title_en;
  const subtitle = (isAr && banner.subtitle_ar) || banner.subtitle_en;
  const badge = (isAr && banner.badge_ar) || banner.badge_en;
  const ctaLabel = (isAr && banner.cta_label_ar) || banner.cta_label_en;
  const bgClass = bgStyles[banner.background_style] || bgStyles.brand_orange;

  const handleCTA = () => {
    switch (banner.cta_action_type) {
      case 'open_signup_modal': openAuthModal('signup'); break;
      case 'navigate_to_signup': openAuthModal('signup'); break;
      case 'navigate_to_pricing': navigate('/pricing'); break;
      case 'custom_url': if (banner.cta_url) window.open(banner.cta_url, '_blank'); break;
      default: openAuthModal('signup');
    }
  };

  return (
    <div
      className={`relative w-full z-[60] ${bgClass} text-white`}
      style={banner.background_style === 'custom' ? { background: banner.text_color } : undefined}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3 px-10 sm:px-12 py-2 sm:py-2.5 min-h-[36px]">
        {badge && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm whitespace-nowrap">
            {badge}
          </span>
        )}

        <p className="text-[12px] sm:text-[13px] font-medium text-center leading-tight">
          {title}
          {subtitle && (
            <span className="hidden md:inline text-white/80 ml-1.5">— {subtitle}</span>
          )}
        </p>

        {ctaLabel && (
          <button
            onClick={handleCTA}
            className="shrink-0 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-[11px] sm:text-[12px] font-semibold transition-colors whitespace-nowrap"
          >
            {ctaLabel}
          </button>
        )}

        {banner.dismissible && (
          <button
            onClick={onDismiss}
            className={`absolute ${isRTL ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors`}
            aria-label="Dismiss"
          >
            <X size={14} className="text-white/80" />
          </button>
        )}
      </div>
    </div>
  );
}
