import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, ChevronDown, Check } from 'lucide-react';
import { useApp, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { usePricing } from '@/hooks/usePricing';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const RATIOS = ['1:1', '2:3', '3:2', '16:9', '4:3', '4:5', '9:16'];
const FEATURED_MODEL_NAMES = ['Nano Banana Pro', 'SeeDream 4.5', 'FLUX 1.1 Pro', 'GPT Image 1.5'];

function RatioIcon({ ratio, size = 12 }: { ratio: string; size?: number }) {
  const [w, h] = ratio.split(':').map(Number);
  const aspect = w / h;
  let rw: number, rh: number;
  if (aspect >= 1) { rw = size; rh = size / aspect; } else { rh = size; rw = size * aspect; }
  return (
    <div className="flex items-center justify-center" style={{ width: size + 2, height: size + 2 }}>
      <div style={{ width: rw, height: rh, border: '1.5px solid currentColor', borderRadius: 1.5, opacity: 0.6 }} />
    </div>
  );
}

type DropdownType = 'ratio' | 'quality' | 'model' | null;

export function DashboardHero() {
  const navigate = useNavigate();
  const { prompt, setPrompt, setAspectRatio, aspectRatio, setSelectedQualityTier, generate, isGenerating, credits, setActivePage, setSelectedModelId: setGlobalModelId } = useApp();
  const { t, isRTL, lang } = useLanguage();
  const { activeModels, defaultModel } = useModels();
  const { getCreditsForModel } = usePricing();
  const { getCreditsForModelQuality } = usePricingTiers();

  const [expanded, setExpanded] = useState(false);
  const [localModelId, setLocalModelId] = useState('');
  const [localResolution, setLocalResolution] = useState('1K');
  const [openDrop, setOpenDrop] = useState<DropdownType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    : (heroConfig?.dashboard_home_prompt_placeholder_en || 'Type a prompt...');

  const currentModel = activeModels.find(m => m.id === localModelId) || defaultModel || activeModels[0];

  useEffect(() => {
    if (defaultModel && !localModelId) setLocalModelId(defaultModel.id);
    else if (activeModels.length > 0 && !localModelId) setLocalModelId(activeModels[0].id);
  }, [defaultModel, activeModels, localModelId]);

  const availableRatios = currentModel?.supported_ratios || ['1:1', '16:9', '9:16', '4:5'];
  const qualityTiers = currentModel?.supported_quality_tiers || ['1K'];

  useEffect(() => {
    if (currentModel && !qualityTiers.includes(localResolution)) {
      setLocalResolution(qualityTiers[0] || '1K');
    }
  }, [currentModel, localResolution, qualityTiers]);

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
        setOpenDrop(null);
      }
      if (openDrop && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDrop(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded, hasText, openDrop]);

  const handleGenerate = () => {
    if (!prompt.trim() || !currentModel) return;
    setGlobalModelId(currentModel.id);
    setSelectedQualityTier(localResolution);
    setActivePage('canvas');
    generate({ modelId: currentModel.id, qualityTier: localResolution, creditCost: cost });
    navigate('/studio');
  };

  const canGenerate = hasText && !isGenerating && credits >= cost && !!currentModel;

  const pillStyle = (active: boolean) => ({
    background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
    border: active ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
    borderRadius: 999 as const,
    padding: '5px 12px',
    fontSize: 13,
    height: 32,
    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
    cursor: 'pointer' as const,
    whiteSpace: 'nowrap' as const,
    display: 'flex',
    alignItems: 'center' as const,
    gap: 6,
  });

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 8,
    background: 'rgba(20,20,20,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '6px 0',
    minWidth: 120,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
    zIndex: 100,
  };

  const dropdownItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 14px',
    fontSize: 13,
    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    gap: 12,
  });

  const modelDisplayName = currentModel?.model_name || 'Auto';

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: 520 }}>
      <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: heroFocalPoint.split(' ').map((v: string) => v + '%').join(' ') }} loading="eager" />
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayStrength})` }} />

      <div className="relative z-10 flex flex-col items-center justify-center px-6" style={{ minHeight: 520, paddingBottom: 64 }}>
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
        <div ref={containerRef} style={{ width: '100%', maxWidth: 720 }}>
          {!expanded ? (
            /* ── COLLAPSED ── */
            <div
              onClick={handleExpand}
              className="cursor-text flex items-center gap-3"
              style={{
                height: 56,
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 999,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                padding: '0 8px 0 20px',
              }}
            >
              <ImageIcon size={18} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <span className="flex-1" style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>
                {placeholder}
              </span>
              <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}>
                <Sparkles size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', paddingRight: 8 }}>Generate</span>
            </div>
          ) : (
            /* ── EXPANDED ── */
            <div
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 20,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                overflow: 'visible',
                position: 'relative',
              }}
            >
              {/* Input row */}
              <div className="flex items-center" style={{ height: 54, padding: '0 20px' }}>
                <ImageIcon size={18} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: 15, color: '#FFFFFF', border: 'none', direction: isRTL ? 'rtl' : 'ltr' }}
                  onKeyDown={e => { if (e.key === 'Enter' && canGenerate) { e.preventDefault(); handleGenerate(); } }}
                />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

              {/* Bottom options row */}
              <div className="flex items-center animate-fade-in" style={{ height: 48, padding: '0 12px', gap: 6 }}>

                {/* ── Ratio dropdown ── */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setOpenDrop(openDrop === 'ratio' ? null : 'ratio')} style={pillStyle(openDrop === 'ratio')}>
                    <RatioIcon ratio={aspectRatio} size={11} />
                    {aspectRatio}
                    <ChevronDown size={11} style={{ opacity: 0.5 }} />
                  </button>
                  {openDrop === 'ratio' && (
                    <div style={dropdownMenuStyle} className="animate-fade-in">
                      {(availableRatios as string[]).filter(r => RATIOS.includes(r)).map(r => {
                        const active = r === aspectRatio;
                        return (
                          <button key={r} onClick={() => { setAspectRatio(r as AspectRatio); setOpenDrop(null); }} style={dropdownItemStyle(active)}>
                            <span className="flex items-center gap-2">
                              <RatioIcon ratio={r} size={11} /> {r}
                            </span>
                            {active && <Check size={14} style={{ color: '#FFFFFF' }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Quality dropdown ── */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setOpenDrop(openDrop === 'quality' ? null : 'quality')} style={pillStyle(openDrop === 'quality')}>
                    <Sparkles size={12} style={{ opacity: 0.6 }} />
                    {localResolution}
                    <ChevronDown size={11} style={{ opacity: 0.5 }} />
                  </button>
                  {openDrop === 'quality' && (
                    <div style={dropdownMenuStyle} className="animate-fade-in">
                      {(qualityTiers as string[]).map(q => {
                        const active = q === localResolution;
                        return (
                          <button key={q} onClick={() => { setLocalResolution(q); setOpenDrop(null); }} style={dropdownItemStyle(active)}>
                            <span>{q}</span>
                            {active && <Check size={14} style={{ color: '#FFFFFF' }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Model dropdown ── */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setOpenDrop(openDrop === 'model' ? null : 'model')} style={pillStyle(openDrop === 'model')}>
                    {modelDisplayName}
                    <ChevronDown size={11} style={{ opacity: 0.5 }} />
                  </button>
                  {openDrop === 'model' && (
                    <div style={{ ...dropdownMenuStyle, minWidth: 180, maxHeight: 260, overflowY: 'auto' }} className="animate-fade-in">
                      {activeModels.map(m => {
                        const active = m.id === localModelId;
                        return (
                          <button key={m.id} onClick={() => { setLocalModelId(m.id); setOpenDrop(null); }} style={dropdownItemStyle(active)}>
                            <span>{m.model_name}</span>
                            {active && <Check size={14} style={{ color: '#FFFFFF' }} />}
                          </button>
                        );
                      })}
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                      <button onClick={() => { setOpenDrop(null); navigate('/studio'); }} style={{ ...dropdownItemStyle(false), color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                        All models →
                      </button>
                    </div>
                  )}
                </div>

                {/* Sparkle icon */}
                <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                  <Sparkles size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  style={{
                    marginLeft: 'auto',
                    background: canGenerate ? '#F03E1B' : 'rgba(255,255,255,0.08)',
                    borderRadius: 999, padding: '0 20px', height: 36,
                    fontSize: 13, fontWeight: 500,
                    color: canGenerate ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                    cursor: canGenerate ? 'pointer' : 'default',
                    border: 'none', whiteSpace: 'nowrap',
                    transition: 'all 200ms',
                  }}
                >
                  Generate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
