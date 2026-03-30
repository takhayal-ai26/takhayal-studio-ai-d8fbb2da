import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronDown, Coins, Cpu, Maximize, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { useApp, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { usePricing } from '@/hooks/usePricing';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { useHeroConfig } from '@/hooks/useHeroConfig';

export function HeroPromptComposer() {
  const navigate = useNavigate();
  const { prompt, setPrompt, setAspectRatio, aspectRatio, isGenerating, isAuthenticated, openAuthModal, credits, generate, setSelectedModelId: setGlobalModelId } = useApp();
  const { lang, isRTL } = useLanguage();
  const { config, loading: heroLoading } = useHeroConfig();
  const { activeModels, defaultModel } = useModels();
  const { getCreditsForModel } = usePricing();
  const { getCreditsForModelQuality, allTiers } = usePricingTiers();

  const [expanded, setExpanded] = useState(false);
  const [localPrompt, setLocalPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedResolution, setSelectedResolution] = useState('1K');
  const composerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentModel = activeModels.find(m => m.id === selectedModelId) || defaultModel || activeModels[0];

  // Set default model
  useEffect(() => {
    if (!selectedModelId && defaultModel) setSelectedModelId(defaultModel.id);
    else if (!selectedModelId && activeModels.length > 0) setSelectedModelId(activeModels[0].id);
  }, [defaultModel, activeModels, selectedModelId]);

  // Reset resolution when model changes
  useEffect(() => {
    if (currentModel && !currentModel.supported_quality_tiers.includes(selectedResolution)) {
      setSelectedResolution(currentModel.supported_quality_tiers[0] || '1K');
    }
  }, [currentModel, selectedResolution]);

  const availableRatios = currentModel?.supported_ratios || ['1:1', '16:9', '9:16', '4:5'];
  const modelQualityTiers = (() => {
    if (!currentModel) return ['1K'];
    const dbTiers = currentModel.supported_quality_tiers || ['1K'];
    const activePricingTiers = (allTiers[currentModel.id] || [])
      .filter((t: any) => t.is_active && t.quality_level)
      .map((t: any) => t.quality_level as string);
    if (activePricingTiers.length > 0) return dbTiers.filter((q: string) => activePricingTiers.includes(q));
    return dbTiers;
  })();

  const cost = (() => {
    if (!currentModel) return 2;
    const tierCredits = getCreditsForModelQuality(currentModel.id, selectedResolution);
    if (tierCredits !== null) return tierCredits;
    return getCreditsForModel(currentModel.id);
  })();

  // Click outside to collapse
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (expanded && composerRef.current && !composerRef.current.contains(e.target as Node)) {
        if (!localPrompt.trim()) setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded, localPrompt]);

  const handleFocus = () => {
    setExpanded(true);
  };

  const handleGenerate = () => {
    if (!localPrompt.trim()) return;
    if (!isAuthenticated) { openAuthModal('signup'); return; }

    // Set global state and navigate to studio with prefilled values
    setPrompt(localPrompt);
    setAspectRatio(aspectRatio);
    if (currentModel) setGlobalModelId(currentModel.id);

    // Navigate to studio - it will pick up the prompt from global state
    navigate('/studio');
  };

  const title = lang === 'ar' ? config.hero_title_ar : config.hero_title_en;
  const subtitle = lang === 'ar' ? config.hero_subtitle_ar : config.hero_subtitle_en;
  const placeholder = lang === 'ar' ? config.hero_placeholder_ar : config.hero_placeholder_en;

  return (
    <section className="relative w-full" style={{ minHeight: expanded ? '620px' : '560px' }}>
      {/* Background image */}
      {config.hero_background_image ? (
        <img
          src={config.hero_background_image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.15)] via-background to-background" />
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(0,0,0,${config.hero_overlay_opacity})` }}
      />

      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 pt-32 pb-16 md:pt-40 md:pb-24" style={{ textAlign: config.hero_text_align as any }}>
        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] max-w-[900px] mb-4 tracking-tight">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-base md:text-lg text-white/60 max-w-lg mb-12 font-light">
            {subtitle}
          </p>
        )}

        {/* Prompt Composer */}
        <div
          ref={composerRef}
          className={`w-full max-w-[680px] transition-all duration-500 ease-out ${expanded ? 'max-w-[720px]' : ''}`}
        >
          {/* Collapsed prompt bar */}
          <div
            className="relative rounded-2xl overflow-hidden backdrop-blur-xl"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Main input row */}
            <div className="flex items-center gap-3 px-4 md:px-5">
              <Sparkles size={18} className="text-white/30 flex-shrink-0" />
              <textarea
                ref={inputRef}
                value={localPrompt}
                onChange={e => setLocalPrompt(e.target.value.slice(0, 500))}
                onFocus={handleFocus}
                placeholder={placeholder}
                rows={expanded ? 3 : 1}
                className={`flex-1 bg-transparent text-white placeholder:text-white/25 text-[15px] font-light focus:outline-none resize-none transition-all duration-300 ${
                  expanded ? 'py-4 min-h-[80px]' : 'py-4 min-h-[52px] overflow-hidden'
                }`}
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleGenerate(); }
                }}
              />
              {!expanded && (
                <button
                  onClick={() => { if (localPrompt.trim()) handleGenerate(); else setExpanded(true); }}
                  className="flex-shrink-0 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:brightness-110 transition-all flex items-center gap-2"
                >
                  {lang === 'ar' ? 'إنشاء' : 'Generate'}
                  <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
                </button>
              )}
            </div>

            {/* Expanded controls */}
            {expanded && (
              <div className="px-4 md:px-5 pb-4 pt-1 animate-fade-in" style={{ animationDuration: '300ms' }}>
                {/* Divider */}
                <div className="h-px bg-white/8 mb-3" />

                {/* Controls row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {/* Model selector */}
                  <div className="relative">
                    <select
                      value={selectedModelId}
                      onChange={e => setSelectedModelId(e.target.value)}
                      className="appearance-none h-9 pl-3 pr-8 rounded-lg text-[12px] font-medium text-white/80 bg-white/8 border border-white/10 hover:bg-white/12 focus:outline-none focus:border-primary/50 cursor-pointer transition-all"
                    >
                      {activeModels.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">
                          {m.model_name}
                        </option>
                      ))}
                    </select>
                    <Cpu size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>

                  {/* Ratio selector */}
                  <div className="relative">
                    <select
                      value={aspectRatio}
                      onChange={e => setAspectRatio(e.target.value as AspectRatio)}
                      className="appearance-none h-9 pl-3 pr-8 rounded-lg text-[12px] font-medium text-white/80 bg-white/8 border border-white/10 hover:bg-white/12 focus:outline-none focus:border-primary/50 cursor-pointer transition-all"
                    >
                      {availableRatios.map(r => (
                        <option key={r} value={r} className="bg-[#1a1a1a] text-white">{r}</option>
                      ))}
                    </select>
                    <Maximize size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>

                  {/* Resolution selector */}
                  <div className="relative">
                    <select
                      value={selectedResolution}
                      onChange={e => setSelectedResolution(e.target.value)}
                      className="appearance-none h-9 pl-3 pr-8 rounded-lg text-[12px] font-medium text-white/80 bg-white/8 border border-white/10 hover:bg-white/12 focus:outline-none focus:border-primary/50 cursor-pointer transition-all"
                    >
                      {modelQualityTiers.map(t => (
                        <option key={t} value={t} className="bg-[#1a1a1a] text-white">{t}</option>
                      ))}
                    </select>
                    <ImageIcon size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>

                {/* Generate button row */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/20 tabular-nums">{localPrompt.length}/500</span>
                  <button
                    onClick={handleGenerate}
                    disabled={!localPrompt.trim() || isGenerating}
                    className={`h-11 px-7 rounded-xl text-[14px] font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                      localPrompt.trim() && !isGenerating
                        ? 'bg-primary text-primary-foreground hover:brightness-110 shadow-[0_4px_24px_-4px] shadow-primary/40 hover:scale-[1.02]'
                        : 'bg-white/8 text-white/25 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {lang === 'ar' ? 'جارٍ الإنشاء...' : 'Generating...'}
                      </span>
                    ) : (
                      <>
                        {lang === 'ar' ? 'إنشاء' : 'Generate'}
                        <span className="flex items-center gap-1 text-[11px] bg-white/10 px-2 py-0.5 rounded-full">
                          <Coins size={11} />{cost}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
