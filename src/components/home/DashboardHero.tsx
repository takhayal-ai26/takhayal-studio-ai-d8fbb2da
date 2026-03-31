import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Image, ChevronDown } from 'lucide-react';
import { useApp, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { usePricing } from '@/hooks/usePricing';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const RATIO_SHAPE: Record<string, { w: number; h: number }> = {
  '1:1': { w: 1, h: 1 }, '9:16': { w: 9, h: 16 }, '16:9': { w: 16, h: 9 },
  '4:5': { w: 4, h: 5 }, '3:2': { w: 3, h: 2 }, '2:3': { w: 2, h: 3 },
  '4:3': { w: 4, h: 3 }, '3:4': { w: 3, h: 4 },
};

function RatioIcon({ w, h, size = 12 }: { w: number; h: number; size?: number }) {
  const aspect = w / h;
  let rw: number, rh: number;
  if (aspect >= 1) { rw = size; rh = size / aspect; } else { rh = size; rw = size * aspect; }
  return (
    <div className="flex items-center justify-center" style={{ width: size + 2, height: size + 2 }}>
      <div style={{ width: rw, height: rh, border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 1.5 }} />
    </div>
  );
}

const FEATURED_MODELS = ['Flux Schnell', 'FLUX 1.1 Pro', 'Imagen 4', 'GPT Image 1.5'];

export function DashboardHero() {
  const navigate = useNavigate();
  const { prompt, setPrompt, setAspectRatio, aspectRatio, setSelectedQualityTier, generate, isGenerating, credits, setActivePage, setSelectedModelId: setGlobalModelId } = useApp();
  const { t, isRTL, lang } = useLanguage();
  const { activeModels, defaultModel } = useModels();
  const { getCreditsForModel } = usePricing();
  const { getCreditsForModelQuality } = usePricingTiers();

  const [expanded, setExpanded] = useState(false);
  const [localModelId, setLocalModelId] = useState<string>('');
  const [localResolution, setLocalResolution] = useState('1K');
  const [ratioOpen, setRatioOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ratioRef = useRef<HTMLButtonElement>(null);

  const { data: heroConfig } = useQuery({
    queryKey: ['dashboard-hero-config'],
    queryFn: async () => {
      const keys = [
        'dashboard_home_hero_image', 'dashboard_home_hero_focal_point',
        'dashboard_home_title_en', 'dashboard_home_title_ar',
        'dashboard_home_subtitle_en', 'dashboard_home_subtitle_ar',
        'dashboard_home_prompt_placeholder_en', 'dashboard_home_prompt_placeholder_ar',
        'dashboard_home_enabled', 'dashboard_home_overlay_strength',
      ];
      const { data } = await supabase.from('platform_config').select('config_key, config_value').in('config_key', keys);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.config_key] = r.config_value; });
      return map;
    },
    staleTime: 60000,
  });

  const heroImage = heroConfig?.dashboard_home_hero_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80';
  const heroFocalPoint = heroConfig?.dashboard_home_hero_focal_point || '50 50';
  const overlayStrength = heroConfig?.dashboard_home_overlay_strength || '0.55';
  const isAr = lang === 'ar';
  const title = isAr
    ? (heroConfig?.dashboard_home_title_ar || 'ماذا تريد أن تبدع؟')
    : (heroConfig?.dashboard_home_title_en || 'What will you create?');
  const subtitleText = isAr
    ? (heroConfig?.dashboard_home_subtitle_ar || 'أنشئ صوراً مذهلة في ثوانٍ — مدعوم بأكثر من 14 نموذج ذكاء اصطناعي')
    : (heroConfig?.dashboard_home_subtitle_en || 'Generate stunning visuals in seconds — powered by 14+ AI models');
  const placeholder = isAr
    ? (heroConfig?.dashboard_home_prompt_placeholder_ar || 'صِف ما تريد إنشاءه...')
    : (heroConfig?.dashboard_home_prompt_placeholder_en || 'Describe what you want to create...');

  const currentModel = activeModels.find(m => m.id === localModelId) || defaultModel || activeModels[0];

  useEffect(() => {
    if (defaultModel && !localModelId) setLocalModelId(defaultModel.id);
    else if (activeModels.length > 0 && !localModelId) setLocalModelId(activeModels[0].id);
  }, [defaultModel, activeModels, localModelId]);

  const featuredModels = activeModels.filter(m => FEATURED_MODELS.includes(m.model_name)).slice(0, 4);
  const availableRatios = currentModel?.supported_ratios || ['1:1', '16:9', '9:16', '4:5'];

  useEffect(() => {
    if (currentModel && !currentModel.supported_quality_tiers.includes(localResolution)) {
      setLocalResolution(currentModel.supported_quality_tiers[0] || '1K');
    }
  }, [currentModel, localResolution]);

  const cost = (() => {
    if (!currentModel) return 2;
    const tierCredits = getCreditsForModelQuality(currentModel.id, localResolution);
    if (tierCredits !== null) return tierCredits;
    return getCreditsForModel(currentModel.id);
  })();

  const hasText = prompt.trim().length > 0;

  const handleExpand = useCallback(() => {
    if (!expanded) {
      setExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [expanded]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (expanded && !hasText && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
        setRatioOpen(false);
      }
      if (ratioOpen && ratioRef.current && !ratioRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-ratio-dropdown]')) setRatioOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded, hasText, ratioOpen]);

  const handleGenerate = () => {
    if (!prompt.trim() || !currentModel) return;
    setGlobalModelId(currentModel.id);
    setSelectedQualityTier(localResolution);
    setActivePage('canvas');
    generate({ modelId: currentModel.id, qualityTier: localResolution, creditCost: cost });
    navigate('/studio');
  };

  const canGenerate = hasText && !isGenerating && credits >= cost && !!currentModel;

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: 520 }}>
      {/* Background */}
      <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: heroFocalPoint.split(' ').map((v: string) => v + '%').join(' ') }} loading="eager" />
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayStrength})` }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6" style={{ minHeight: 520, paddingBottom: 64 }}>
        {/* Title — fixed position, never moves */}
        <h1
          className="text-white text-center font-bold"
          style={{
            fontSize: 52, letterSpacing: -1.5, lineHeight: 1.15,
            marginBottom: subtitleText ? 16 : 40,
            fontFamily: isAr ? "'Cairo', sans-serif" : undefined,
          }}
        >
          {title}
        </h1>

        {subtitleText && (
          <p className="text-center" style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 40, maxWidth: 500 }}>
            {subtitleText}
          </p>
        )}

        {/* Prompt bar */}
        <div ref={containerRef} style={{ width: '100%', maxWidth: 680 }}>
          {!expanded ? (
            /* ── COLLAPSED PILL ── */
            <div
              onClick={handleExpand}
              className="cursor-text flex items-center gap-3"
              style={{
                height: 56,
                background: 'rgba(0,0,0,0.30)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 999,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '0 8px 0 20px',
              }}
            >
              <Image size={18} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <span className="flex-1" style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>
                {placeholder}
              </span>
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }}
              >
                <Sparkles size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', paddingRight: 8, cursor: 'pointer' }}>
                Generate
              </span>
            </div>
          ) : (
            /* ── EXPANDED BAR ── */
            <div
              style={{
                background: 'rgba(0,0,0,0.30)',
                border: '1px solid rgba(255,255,255,0.20)',
                borderRadius: 24,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                overflow: 'visible',
                position: 'relative',
              }}
            >
              {/* Input row */}
              <div className="flex items-center" style={{ height: 52, padding: '0 20px' }}>
                <Image size={18} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginRight: 12 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    fontSize: 15, color: '#FFFFFF', border: 'none',
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && canGenerate) { e.preventDefault(); handleGenerate(); } }}
                />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 16px' }} />

              {/* Options row */}
              <div
                className="flex items-center animate-fade-in"
                style={{ height: 44, padding: '0 16px', gap: 8 }}
              >
                {/* Model pills */}
                {featuredModels.map(m => {
                  const active = m.id === localModelId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setLocalModelId(m.id)}
                      className="flex-shrink-0"
                      style={{
                        background: active ? '#F03E1B' : 'rgba(255,255,255,0.08)',
                        border: active ? '1px solid #F03E1B' : '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 999, padding: '4px 12px', fontSize: 12, height: 28,
                        color: active ? '#FFFFFF' : 'rgba(255,255,255,0.70)',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      {m.model_name}
                    </button>
                  );
                })}

                {/* More link */}
                <button
                  onClick={() => navigate('/studio')}
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  More →
                </button>

                {/* Vertical divider */}
                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.10)', flexShrink: 0 }} />

                {/* Ratio selector */}
                <div style={{ position: 'relative' }}>
                  <button
                    ref={ratioRef}
                    onClick={() => setRatioOpen(!ratioOpen)}
                    className="flex items-center gap-1.5"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 999, padding: '4px 10px', fontSize: 12, height: 28,
                      color: 'rgba(255,255,255,0.70)', cursor: 'pointer',
                    }}
                  >
                    <RatioIcon w={RATIO_SHAPE[aspectRatio]?.w || 1} h={RATIO_SHAPE[aspectRatio]?.h || 1} />
                    {aspectRatio}
                    <ChevronDown size={12} style={{ opacity: 0.5 }} />
                  </button>

                  {/* Ratio dropdown */}
                  {ratioOpen && (
                    <div
                      data-ratio-dropdown
                      className="absolute animate-fade-in"
                      style={{
                        bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                        marginBottom: 8,
                        background: 'rgba(15,15,15,0.90)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 12,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        padding: 6,
                        display: 'flex', gap: 4,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      }}
                    >
                      {availableRatios.map((r: string) => {
                        const active = r === aspectRatio;
                        const shape = RATIO_SHAPE[r] || { w: 1, h: 1 };
                        return (
                          <button
                            key={r}
                            onClick={() => { setAspectRatio(r as AspectRatio); setRatioOpen(false); }}
                            className="flex items-center gap-1"
                            style={{
                              background: active ? '#F03E1B' : 'rgba(255,255,255,0.06)',
                              border: active ? '1px solid #F03E1B' : '1px solid rgba(255,255,255,0.10)',
                              borderRadius: 999, padding: '4px 10px', fontSize: 11, height: 26,
                              color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                              cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                          >
                            <RatioIcon w={shape.w} h={shape.h} size={10} />
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Generate button — pushed right */}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex items-center gap-1.5 font-medium"
                  style={{
                    marginLeft: 'auto',
                    background: '#F03E1B',
                    borderRadius: 999, padding: '0 18px', height: 36,
                    fontSize: 13, fontWeight: 500, color: '#FFFFFF',
                    opacity: canGenerate ? 1 : 0.4,
                    cursor: canGenerate ? 'pointer' : 'not-allowed',
                    border: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  <Sparkles size={13} />
                  {t.studio.generateVisuals || 'Generate'} · {cost} cr
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
