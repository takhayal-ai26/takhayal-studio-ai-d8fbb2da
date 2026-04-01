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
      <div style={{ width: rw, height: rh, border: '1.5px solid currentColor', borderRadius: 2, opacity: 0.5 }} />
    </div>
  );
}

type DropdownType = 'ratio' | 'quality' | 'model' | null;

export function DashboardHero() {
  const navigate = useNavigate();
  const { prompt, setPrompt, setAspectRatio, aspectRatio, setSelectedQualityTier, generate, isGenerating, credits, setActivePage, setSelectedModelId: setGlobalModelId, requireAuth } = useApp();
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

  const HERO_FALLBACK = 'https://njenobbxlbhbzwpkylha.supabase.co/storage/v1/object/public/tool-covers/dashboard-hero-latest.png';
  const heroImage = heroConfig?.dashboard_home_hero_image || HERO_FALLBACK;
  const heroFocalPoint = heroConfig?.dashboard_home_hero_focal_point || '50 50';
  const overlayStrength = heroConfig?.dashboard_home_overlay_strength || '0.5';
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
    requireAuth(() => {
      setGlobalModelId(currentModel.id);
      setSelectedQualityTier(localResolution);
      setActivePage('canvas');
      generate({ modelId: currentModel.id, qualityTier: localResolution, creditCost: cost });
      navigate('/studio');
    });
  };

  const canGenerate = hasText && !isGenerating && credits >= cost && !!currentModel;
  const modelDisplayName = currentModel?.model_name || 'Auto';

  const pillBase = "flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium transition-all duration-150 whitespace-nowrap cursor-pointer";
  const pillInactive = `${pillBase} bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.10] hover:text-white/80`;
  const pillActive = `${pillBase} bg-white/[0.14] border border-white/[0.20] text-white`;

  const dropMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    background: 'rgba(16,16,16,0.96)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    padding: '4px',
    minWidth: 130,
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    zIndex: 100,
  };

  const dropItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '7px 12px',
    fontSize: 13,
    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    gap: 10,
    borderRadius: 10,
    transition: 'background 0.15s',
  });

  return (
    <section className="relative w-full overflow-hidden" style={{ height: 540 }}>
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: heroFocalPoint.split(' ').map((v: string) => v + '%').join(' '),
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,${Number(overlayStrength) * 0.7}) 0%, rgba(0,0,0,${overlayStrength}) 60%, rgba(0,0,0,${Number(overlayStrength) * 1.1}) 100%)` }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-5 md:px-6" style={{ height: 540, paddingBottom: 72, paddingTop: 80 }}>
        <h1
          className="text-white text-center font-extrabold drop-shadow-lg"
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            letterSpacing: -2,
            lineHeight: 1.05,
            marginBottom: subtitleText ? 16 : 40,
            fontFamily: isAr ? "'Cairo', sans-serif" : undefined,
            textShadow: '0 2px 20px rgba(0,0,0,0.4)',
          }}
        >
          {title}
        </h1>

        {subtitleText && (
          <p className="text-center" style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 44, maxWidth: 480, lineHeight: 1.6 }}>
            {subtitleText}
          </p>
        )}

        {/* Prompt bar */}
        <div ref={containerRef} style={{ width: '100%', maxWidth: 680 }}>
          {!expanded ? (
            <div
              onClick={handleExpand}
              className="cursor-text flex items-center gap-3 group"
              style={{
                height: 52,
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                padding: '0 6px 0 20px',
                transition: 'all 0.2s ease',
              }}
            >
              <ImageIcon size={17} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <span className="flex-1" style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
                {placeholder}
              </span>
              <div className="flex-shrink-0 flex items-center gap-2 px-4 h-9 rounded-full bg-white/[0.08] group-hover:bg-white/[0.12] transition-colors">
                <Sparkles size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Generate</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                overflow: 'visible',
                position: 'relative',
              }}
            >
              {/* Input row */}
              <div className="flex items-center" style={{ height: 52, padding: '0 16px' }}>
                <ImageIcon size={17} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  data-hero-input
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 outline-none placeholder:text-white/30 focus:outline-none focus:ring-0 focus:border-none"
                  style={{ fontSize: 14, color: '#FFFFFF', border: 'none', background: 'transparent', direction: isRTL ? 'rtl' : 'ltr', boxShadow: 'none', outline: 'none' }}
                  onKeyDown={e => { if (e.key === 'Enter' && canGenerate) { e.preventDefault(); handleGenerate(); } }}
                />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 14px' }} />

              {/* Bottom options row */}
              <div className="flex items-center animate-fade-in" style={{ height: 46, padding: '0 10px', gap: 5 }}>

                {/* Ratio */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setOpenDrop(openDrop === 'ratio' ? null : 'ratio')} className={openDrop === 'ratio' ? pillActive : pillInactive}>
                    <RatioIcon ratio={aspectRatio} size={10} />
                    {aspectRatio}
                    <ChevronDown size={10} style={{ opacity: 0.4 }} />
                  </button>
                  {openDrop === 'ratio' && (
                    <div style={dropMenuStyle} className="animate-fade-in">
                      {(availableRatios as string[]).filter(r => RATIOS.includes(r)).map(r => (
                        <button key={r} onClick={() => { setAspectRatio(r as AspectRatio); setOpenDrop(null); }} style={dropItemStyle(r === aspectRatio)}>
                          <span className="flex items-center gap-2"><RatioIcon ratio={r} size={10} /> {r}</span>
                          {r === aspectRatio && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quality */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setOpenDrop(openDrop === 'quality' ? null : 'quality')} className={openDrop === 'quality' ? pillActive : pillInactive}>
                    <Sparkles size={11} style={{ opacity: 0.5 }} />
                    {localResolution}
                    <ChevronDown size={10} style={{ opacity: 0.4 }} />
                  </button>
                  {openDrop === 'quality' && (
                    <div style={dropMenuStyle} className="animate-fade-in">
                      {(qualityTiers as string[]).map(q => (
                        <button key={q} onClick={() => { setLocalResolution(q); setOpenDrop(null); }} style={dropItemStyle(q === localResolution)}>
                          <span>{q}</span>
                          {q === localResolution && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Model */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setOpenDrop(openDrop === 'model' ? null : 'model')} className={openDrop === 'model' ? pillActive : pillInactive}>
                    {modelDisplayName}
                    <ChevronDown size={10} style={{ opacity: 0.4 }} />
                  </button>
                  {openDrop === 'model' && (
                    <div style={{ ...dropMenuStyle, minWidth: 190 }} className="animate-fade-in">
                      {activeModels
                        .filter(m => FEATURED_MODEL_NAMES.some(n => m.model_name.toLowerCase().includes(n.toLowerCase())))
                        .map(m => (
                          <button key={m.id} onClick={() => { setLocalModelId(m.id); setOpenDrop(null); }} style={dropItemStyle(m.id === localModelId)}>
                            <span>{m.model_name}</span>
                            {m.id === localModelId && <Check size={13} />}
                          </button>
                        ))}
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />
                      <button onClick={() => { setOpenDrop(null); navigate('/studio'); }} style={{ ...dropItemStyle(false), color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                        See all models →
                      </button>
                    </div>
                  )}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="transition-all duration-200"
                  style={{
                    background: canGenerate ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.06)',
                    borderRadius: 999,
                    padding: '0 18px',
                    height: 34,
                    fontSize: 13,
                    fontWeight: 600,
                    color: canGenerate ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                    cursor: canGenerate ? 'pointer' : 'default',
                    border: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Generate · {cost} cr
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
