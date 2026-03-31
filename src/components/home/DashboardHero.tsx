import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
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

function RatioIcon({ w, h, active }: { w: number; h: number; active: boolean }) {
  const max = 14;
  const aspect = w / h;
  let rw: number, rh: number;
  if (aspect >= 1) { rw = max; rh = max / aspect; } else { rh = max; rw = max * aspect; }
  return (
    <div className="w-4 h-4 flex items-center justify-center">
      <div className="rounded-[1.5px]" style={{ width: rw, height: rh, border: `1.5px solid ${active ? '#fff' : 'rgba(255,255,255,0.35)'}` }} />
    </div>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Admin-controlled hero config
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

  const availableRatios = currentModel?.supported_ratios || ['1:1', '16:9', '9:16', '4:5'];
  const qualityTiers = currentModel?.supported_quality_tiers || ['1K'];

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
    if (!expanded) setExpanded(true);
  }, [expanded]);

  // Close on outside click — only if no text
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (expanded && !hasText && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded, hasText]);

  const handleGenerate = () => {
    if (!prompt.trim() || !currentModel) return;
    setGlobalModelId(currentModel.id);
    setSelectedQualityTier(localResolution);
    setActivePage('canvas');
    generate({ modelId: currentModel.id, qualityTier: localResolution, creditCost: cost });
    navigate('/studio');
  };

  const canGenerate = hasText && !isGenerating && credits >= cost && !!currentModel;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && expanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(72, textareaRef.current.scrollHeight) + 'px';
    }
  }, [prompt, expanded]);

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: '520px' }}>
      {/* Background */}
      <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: heroFocalPoint.split(' ').map((v: string) => v + '%').join(' ') }} loading="eager" />
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayStrength})` }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6" style={{ minHeight: '520px', paddingBottom: '64px' }}>
        {/* Title */}
        <h1
          className="text-white text-center font-bold"
          style={{
            fontSize: '52px',
            letterSpacing: '-1.5px',
            lineHeight: 1.15,
            marginBottom: subtitleText ? '16px' : '40px',
            fontFamily: isAr ? "'Cairo', sans-serif" : undefined,
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitleText && (
          <p
            className="text-center"
            style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)', marginBottom: '40px', maxWidth: '500px' }}
          >
            {subtitleText}
          </p>
        )}

        {/* Prompt composer */}
        <div
          ref={containerRef}
          className="transition-all"
          style={{
            width: '100%',
            maxWidth: expanded ? '780px' : '680px',
            transitionDuration: '280ms',
            transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {!expanded ? (
            /* ── COLLAPSED BAR ── */
            <div
              onClick={handleExpand}
              className="cursor-text flex items-center gap-4 transition-all"
              style={{
                height: '64px',
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '16px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '0 10px 0 20px',
              }}
            >
              <Sparkles size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <span className="flex-1" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)' }}>
                {placeholder}
              </span>
              <button
                className="flex-shrink-0 flex items-center gap-1.5 font-medium text-white"
                style={{
                  background: '#F03E1B',
                  borderRadius: '12px',
                  padding: '0 20px',
                  height: '44px',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: 0.85,
                }}
              >
                <Sparkles size={14} />
                {t.studio.generateVisuals || 'Generate visuals'}
              </button>
            </div>
          ) : (
            /* ── EXPANDED COMPOSER ── */
            <div
              className="animate-scale-in"
              style={{
                background: 'rgba(15,15,15,0.85)',
                border: hasText ? '1px solid rgba(240,62,27,0.4)' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: '20px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '20px',
                boxShadow: hasText ? '0 0 0 4px rgba(240,62,27,0.08)' : 'none',
                transition: 'border 200ms ease, box-shadow 200ms ease',
              }}
            >
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                autoFocus
                placeholder={placeholder}
                className="w-full bg-transparent text-white resize-none outline-none"
                style={{
                  minHeight: '72px',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: '#FFFFFF',
                  direction: isRTL ? 'rtl' : 'ltr',
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && canGenerate) { e.preventDefault(); handleGenerate(); } }}
              />

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />

              {/* Options rows */}
              <div className="space-y-2.5">
                {/* Model row */}
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 uppercase" style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em', width: '80px' }}>
                    {t.studio.model}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {activeModels.map(m => {
                      const active = m.id === localModelId;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setLocalModelId(m.id)}
                          className="flex-shrink-0 transition-all"
                          style={{
                            background: active ? '#F03E1B' : 'rgba(255,255,255,0.06)',
                            border: active ? '1px solid #F03E1B' : '1px solid rgba(255,255,255,0.10)',
                            borderRadius: '999px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            color: active ? '#FFFFFF' : '#CCC',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.model_name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size row */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 uppercase" style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em', width: '80px' }}>
                    {t.studio.size}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ maxWidth: 'calc(100% - 90px)' }}>
                    {availableRatios.map((r: string) => {
                      const shape = RATIO_SHAPE[r] || { w: 1, h: 1 };
                      const active = r === aspectRatio;
                      return (
                        <button
                          key={r}
                          onClick={() => setAspectRatio(r as AspectRatio)}
                          className="flex items-center gap-1 transition-all"
                          style={{
                            background: active ? '#F03E1B' : 'rgba(255,255,255,0.06)',
                            border: active ? '1px solid #F03E1B' : '1px solid rgba(255,255,255,0.10)',
                            borderRadius: '999px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            color: active ? '#FFFFFF' : '#CCC',
                            cursor: 'pointer',
                          }}
                        >
                          <RatioIcon w={shape.w} h={shape.h} active={active} />
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resolution row */}
                {qualityTiers.length > 1 && (
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 uppercase" style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em', width: '80px' }}>
                      {t.studio.resolution}
                    </span>
                    <div className="flex gap-1.5">
                      {qualityTiers.map((tier: string) => {
                        const active = tier === localResolution;
                        return (
                          <button
                            key={tier}
                            onClick={() => setLocalResolution(tier)}
                            className="transition-all"
                            style={{
                              background: active ? '#F03E1B' : 'rgba(255,255,255,0.06)',
                              border: active ? '1px solid #F03E1B' : '1px solid rgba(255,255,255,0.10)',
                              borderRadius: '999px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              color: active ? '#FFFFFF' : '#CCC',
                              cursor: 'pointer',
                            }}
                          >
                            {tier}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />

              {/* Bottom row: credits + generate */}
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                  {credits} {t.studio.creditsRemaining}
                </span>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                    {cost} {t.studio.cost || 'credits'}
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="flex items-center gap-1.5 font-medium text-white transition-all"
                    style={{
                      background: '#F03E1B',
                      borderRadius: '12px',
                      padding: '0 20px',
                      height: '44px',
                      fontSize: '14px',
                      fontWeight: 500,
                      opacity: canGenerate ? 1 : 0.4,
                      cursor: canGenerate ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Sparkles size={14} />
                    {t.studio.generateVisuals || 'Generate'} · {cost} cr
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
