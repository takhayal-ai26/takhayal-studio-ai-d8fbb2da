import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronDown, Cpu, Maximize, Image as ImageIcon } from 'lucide-react';
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
};

function RatioIcon({ w, h, active }: { w: number; h: number; active: boolean }) {
  const max = 16;
  const aspect = w / h;
  let rw: number, rh: number;
  if (aspect >= 1) { rw = max; rh = max / aspect; } else { rh = max; rw = max * aspect; }
  return (
    <div className="w-5 h-5 flex items-center justify-center">
      <div className="rounded-[2px] transition-colors" style={{ width: rw, height: rh, border: `1.5px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)'}` }} />
    </div>
  );
}

export function DashboardHero() {
  const navigate = useNavigate();
  const { prompt, setPrompt, setAspectRatio, aspectRatio, setSelectedQualityTier, selectedQualityTier, generate, isGenerating, credits, setActivePage, setSelectedModelId: setGlobalModelId } = useApp();
  const { t, isRTL, lang } = useLanguage();
  const { activeModels, defaultModel } = useModels();
  const { getCreditsForModel } = usePricing();
  const { getCreditsForModelQuality, allTiers } = usePricingTiers();

  const [expanded, setExpanded] = useState(false);
  const [localModelId, setLocalModelId] = useState<string>('');
  const [localResolution, setLocalResolution] = useState('1K');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch admin-controlled hero config
  const { data: heroConfig } = useQuery({
    queryKey: ['dashboard-hero-config'],
    queryFn: async () => {
      const keys = [
        'dashboard_home_hero_image',
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
  const overlayStrength = heroConfig?.dashboard_home_overlay_strength || '0.55';
  const isAr = lang === 'ar';
  const title = isAr ? (heroConfig?.dashboard_home_title_ar || 'ماذا تريد أن تبدع؟') : (heroConfig?.dashboard_home_title_en || 'What will you create?');
  const subtitle = isAr ? (heroConfig?.dashboard_home_subtitle_ar || '') : (heroConfig?.dashboard_home_subtitle_en || '');
  const placeholder = isAr ? (heroConfig?.dashboard_home_prompt_placeholder_ar || 'صِف ما تريد إنشاءه...') : (heroConfig?.dashboard_home_prompt_placeholder_en || 'Describe what you want to create...');

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

  const handleFocus = () => {
    setExpanded(true);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (expanded && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  const handleGenerate = () => {
    if (!prompt.trim() || !currentModel) return;
    // Sync selections to global state
    setGlobalModelId(currentModel.id);
    setAspectRatio(aspectRatio);
    setSelectedQualityTier(localResolution);
    setActivePage('canvas');
    // Generate and navigate
    generate({ modelId: currentModel.id, qualityTier: localResolution, creditCost: cost });
    navigate('/studio');
  };

  const canGenerate = prompt.trim().length > 0 && !isGenerating && credits >= cost && !!currentModel;

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: expanded ? '420px' : '340px' }}>
      {/* Background image */}
      <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayStrength})` }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-16 md:py-20">
        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold text-white text-center mb-2 tracking-tight" style={{ fontFamily: isAr ? "'Cairo', sans-serif" : undefined }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base text-white/60 text-center mb-8 max-w-md">{subtitle}</p>
        )}

        {/* Prompt composer */}
        <div ref={containerRef} className="w-full max-w-2xl mt-4 transition-all duration-300">
          {/* Prompt bar */}
          <div className={`relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 ${expanded ? 'rounded-b-none border-b-0' : ''}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <ImageIcon size={18} className="text-white/40 flex-shrink-0" />
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onFocus={handleFocus}
                placeholder={placeholder}
                rows={expanded ? 3 : 1}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none min-h-[24px]"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && canGenerate) { e.preventDefault(); handleGenerate(); } }}
              />
              <button onClick={() => setExpanded(!expanded)} className="text-white/40 hover:text-white/70 transition-colors p-1">
                <ChevronDown size={16} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex-shrink-0 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-40 hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                {t.studio.generateVisuals || 'Generate'}
              </button>
            </div>
          </div>

          {/* Expanded controls */}
          {expanded && (
            <div className="rounded-b-2xl border border-white/10 border-t-0 bg-black/40 backdrop-blur-xl px-4 py-3 space-y-3 animate-fade-in">
              {/* Model selector */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-white/40 text-[11px] uppercase tracking-wider w-20 flex-shrink-0">
                  <Cpu size={13} /> {t.studio.model}
                </div>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {activeModels.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setLocalModelId(m.id)}
                      className={`flex-shrink-0 h-7 px-3 rounded-lg text-[11px] font-medium transition-all ${
                        m.id === localModelId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white/80'
                      }`}
                    >
                      {m.model_name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ratio selector */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-white/40 text-[11px] uppercase tracking-wider w-20 flex-shrink-0">
                  <Maximize size={13} /> {t.studio.size}
                </div>
                <div className="flex gap-1.5">
                  {availableRatios.map((r: string) => {
                    const shape = RATIO_SHAPE[r] || { w: 1, h: 1 };
                    const active = r === aspectRatio;
                    return (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r as AspectRatio)}
                        className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all ${
                          active ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
                        }`}
                      >
                        <RatioIcon w={shape.w} h={shape.h} active={active} />
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resolution selector */}
              {qualityTiers.length > 1 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-white/40 text-[11px] uppercase tracking-wider w-20 flex-shrink-0">
                    <ImageIcon size={13} /> {t.studio.resolution}
                  </div>
                  <div className="flex gap-1.5">
                    {qualityTiers.map((tier: string) => (
                      <button
                        key={tier}
                        onClick={() => setLocalResolution(tier)}
                        className={`h-7 px-3 rounded-lg text-[11px] font-medium transition-all ${
                          tier === localResolution
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost indicator */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <span className="text-[11px] text-white/30">{credits} {t.studio.creditsRemaining}</span>
                <span className="text-[11px] text-white/50">{cost} {t.studio.cost ? t.studio.cost.toLowerCase() : 'credits'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
