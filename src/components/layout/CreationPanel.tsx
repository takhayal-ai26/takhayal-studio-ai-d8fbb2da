import { useState, useEffect, useRef } from 'react';
import { Upload, ChevronDown, Sparkles, X, Coins, Cpu, Maximize, Image as ImageIcon, Check, Wand2, Zap } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels, ModelRecord } from '@/hooks/useModels';
import { usePricing } from '@/hooks/usePricing';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { CREDIT_VALUE_USD } from '@/lib/pricing-engine';

const CREDIT_VALUE = CREDIT_VALUE_USD;
type OpenDropdown = 'model' | 'size' | 'resolution' | null;

export function CreationPanel() {
  const { prompt, setPrompt, selectedTemplate, setSelectedTemplate, aspectRatio, setAspectRatio, quality, setQuality, enhancePrompt, setEnhancePrompt, generate, isGenerating, credits, getCreditCost } = useApp();
  const { t, lang: language } = useLanguage();
  const { activeModels, defaultModel } = useModels();
  const { getCreditsForModel } = usePricing();
  const { getCreditsForModelQuality, getCostForModelQuality, allTiers } = usePricingTiers();

  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedResolution, setSelectedResolution] = useState<string>('1K');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentModel = activeModels.find(m => m.id === selectedModelId) || defaultModel || activeModels[0];

  const modelQualityTiers = (() => {
    if (!currentModel) return ['1K'];
    const dbTiers = currentModel.supported_quality_tiers || ['1K'];
    if (currentModel.pricing_mode === 'size_locked') return dbTiers;
    const activePricingTiers = (allTiers[currentModel.id] || [])
      .filter((t: any) => t.is_active && t.quality_level)
      .map((t: any) => t.quality_level as string);
    if (activePricingTiers.length > 0) {
      return dbTiers.filter((q: string) => activePricingTiers.includes(q));
    }
    return dbTiers;
  })();

  const cost = (() => {
    if (!currentModel) return getCreditCost();
    const tierCredits = getCreditsForModelQuality(currentModel.id, selectedResolution);
    if (tierCredits !== null) return tierCredits;
    return getCreditsForModel(currentModel.id);
  })();

  useEffect(() => {
    if (defaultModel && !selectedModelId) setSelectedModelId(defaultModel.id);
    else if (activeModels.length > 0 && !selectedModelId) setSelectedModelId(activeModels[0].id);
  }, [defaultModel, activeModels, selectedModelId]);

  useEffect(() => {
    if (currentModel && !currentModel.supported_quality_tiers.includes(selectedResolution))
      setSelectedResolution(currentModel.supported_quality_tiers[0] || '1K');
  }, [currentModel, selectedResolution]);

  const availableRatios = currentModel?.supported_ratios || ['1:1', '16:9', '9:16', '4:5'];

  useEffect(() => {
    if (currentModel && !currentModel.supported_ratios.includes(aspectRatio)) {
      const defaultR = currentModel.default_ratio as AspectRatio || '1:1' as AspectRatio;
      setAspectRatio(defaultR);
    }
  }, [currentModel, aspectRatio, setAspectRatio]);

  const canGenerate = prompt.trim().length > 0 && !isGenerating && credits >= cost && !!currentModel;
  const toggleDropdown = (key: OpenDropdown) => setOpenDropdown(prev => prev === key ? null : key);

  useEffect(() => { const handler = (e: MouseEvent) => { if (openDropdown && panelRef.current && !panelRef.current.contains(e.target as Node)) setOpenDropdown(null); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, [openDropdown]);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDropdown(null); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); generate(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [generate]);

  const handleResolution = (r: string) => { setSelectedResolution(r); setQuality(r === '1K' ? 'standard' : 'hd'); setOpenDropdown(null); };
  const ratioIcons: Record<string, string> = { '1:1': '◻', '4:3': '▭', '16:9': '▬', '9:16': '▯', '4:5': '▭', '3:4': '▭', '3:2': '▬', '2:3': '▯', '5:4': '▭', '21:9': '▬' };

  return (
    <aside ref={panelRef} className="w-[340px] xl:w-[370px] flex flex-col bg-background flex-shrink-0 overflow-visible relative z-30 border-r border-border/5">
      <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-2.5 scrollbar-thin">
        {/* Prompt */}
        <div className="rounded-2xl bg-card/60 p-4 border border-border/8 hover:border-border/15 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 size={12} className="text-primary" />
              </div>
              <label className="text-[13px] font-semibold text-foreground">{t.studio.prompt}</label>
            </div>
            <div className="flex items-center gap-1.5">
              {prompt.length > 0 && (
                <button onClick={() => { setPrompt(''); setSelectedTemplate(null); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/20 transition-all">
                  <X size={13} />
                </button>
              )}
              <button
                onClick={() => setEnhancePrompt(!enhancePrompt)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                  enhancePrompt
                    ? 'bg-primary/12 text-primary border border-primary/20 shadow-[0_0_12px_-4px] shadow-primary/20'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/15'
                }`}
              >
                <Sparkles size={11} />{t.studio.enhance}
              </button>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, 500))}
            placeholder={t.studio.describeCreate}
            className="w-full min-h-[120px] bg-background/50 border border-border/10 rounded-xl p-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/25 focus:border-primary/40 focus:bg-background/80 focus:outline-none focus:shadow-[0_0_0_3px] focus:shadow-primary/5 resize-none leading-relaxed transition-all"
          />
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[10px] text-muted-foreground/20 tabular-nums">{prompt.length}/500</span>
            {prompt.length > 0 && (
              <span className="text-[10px] text-primary/40 flex items-center gap-1">
                <Zap size={8} />{t.studio.ready}
              </span>
            )}
          </div>
        </div>

        {/* Upload */}
        <button className="w-full rounded-2xl bg-card/30 border border-dashed border-border/10 p-4 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/50 hover:text-foreground/70 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300 group">
          <div className="w-9 h-9 rounded-xl bg-muted/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Upload size={16} className="text-muted-foreground/40 group-hover:text-primary/70 transition-colors" />
          </div>
          <span className="text-[12px] font-medium">{t.studio.uploadImages}</span>
          <span className="text-[10px] text-muted-foreground/25">JPG / PNG up to 10MB</span>
        </button>

        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('model')}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-card/60 border transition-all duration-200 ${
              openDropdown === 'model' ? 'border-primary/25 bg-card/80 shadow-[0_0_20px_-6px] shadow-primary/10' : 'border-border/8 hover:border-border/15'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${openDropdown === 'model' ? 'bg-primary/15' : 'bg-primary/[0.06]'}`}>
                <Cpu size={14} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-muted-foreground/50 font-medium">{t.studio.model}</p>
                <p className="text-[13px] font-semibold text-primary/80">{currentModel?.model_name || 'Select model'}</p>
              </div>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground/40 transition-transform duration-200 ${openDropdown === 'model' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'model' && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-card/95 backdrop-blur-xl border border-border/15 rounded-2xl p-1.5 shadow-2xl shadow-black/50 z-50 max-h-[320px] overflow-y-auto" style={{ animation: 'modalScaleIn 0.15s ease-out' }}>
              <p className="text-[9px] text-muted-foreground/30 uppercase tracking-widest font-semibold px-3 pt-2 pb-1.5">{t.studio.selectModel}</p>
              {activeModels.map(m => {
                const isActive = selectedModelId === m.id;
                const bestForText = language === 'ar' ? (m.best_for_ar || m.best_for) : m.best_for;
                return (
                  <button key={m.id} onClick={() => { setSelectedModelId(m.id); setOpenDropdown(null); }} className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-150 ${isActive ? 'bg-primary/8' : 'hover:bg-muted/8'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/15' : 'bg-muted/10'}`}>
                      <Cpu size={12} className={isActive ? 'text-primary' : 'text-muted-foreground/50'} />
                    </div>
                    <div className={`text-left flex-1 min-w-0 ${language === 'ar' ? 'text-right' : ''}`}>
                      <p className={`text-[12px] font-semibold ${isActive ? 'text-primary' : 'text-foreground/90'}`}>{m.model_name}</p>
                      {bestForText && <p className="text-[10px] text-muted-foreground/40 mt-0.5 truncate">{bestForText}</p>}
                    </div>
                    {isActive && <Check size={12} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
              {activeModels.length === 0 && (
                <p className="text-[11px] text-muted-foreground/30 text-center py-4">No active models</p>
              )}
            </div>
          )}
        </div>

        {/* Size + Resolution */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <button
              onClick={() => toggleDropdown('size')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl bg-card/60 border transition-all duration-200 ${
                openDropdown === 'size' ? 'border-primary/25 bg-card/80 shadow-[0_0_20px_-6px] shadow-primary/10' : 'border-border/8 hover:border-border/15'
              }`}
            >
              <div className="flex items-center gap-2">
                <Maximize size={13} className="text-primary/60" />
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground/40">{t.studio.size}</p>
                  <p className="text-[14px] font-semibold text-foreground">{aspectRatio}</p>
                </div>
              </div>
              <ChevronDown size={12} className={`text-muted-foreground/30 transition-transform duration-200 ${openDropdown === 'size' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'size' && (
              <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-card/95 backdrop-blur-xl border border-border/15 rounded-2xl p-1.5 shadow-2xl shadow-black/50 z-50" style={{ animation: 'modalScaleIn 0.15s ease-out' }}>
                <p className="text-[9px] text-muted-foreground/30 uppercase tracking-widest font-semibold px-3 pt-2 pb-1.5">{t.studio.aspectRatio}</p>
                {availableRatios.map(r => {
                  const isActive = aspectRatio === r;
                  return (
                    <button key={r} onClick={() => { setAspectRatio(r as AspectRatio); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${isActive ? 'bg-primary/8 text-primary' : 'text-foreground/80 hover:bg-muted/8'}`}>
                      <span>{r}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] ${isActive ? 'text-primary/50' : 'opacity-20'}`}>{ratioIcons[r] || '◻'}</span>
                        {isActive && <Check size={12} className="text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative flex-1">
            <button
              onClick={() => toggleDropdown('resolution')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl bg-card/60 border transition-all duration-200 ${
                openDropdown === 'resolution' ? 'border-primary/25 bg-card/80 shadow-[0_0_20px_-6px] shadow-primary/10' : 'border-border/8 hover:border-border/15'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon size={13} className="text-primary/60" />
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground/40">{t.studio.resolution}</p>
                  <p className="text-[14px] font-semibold text-foreground">{selectedResolution}</p>
                </div>
              </div>
              <ChevronDown size={12} className={`text-muted-foreground/30 transition-transform duration-200 ${openDropdown === 'resolution' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'resolution' && (
              <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-card/95 backdrop-blur-xl border border-border/15 rounded-2xl p-1.5 shadow-2xl shadow-black/50 z-50" style={{ animation: 'modalScaleIn 0.15s ease-out' }}>
                {modelQualityTiers.map(tierKey => {
                  const isActive = selectedResolution === tierKey;
                  return (
                    <button
                      key={tierKey}
                      onClick={() => handleResolution(tierKey)}
                      title={tierKey === '1K' ? '1024px' : tierKey === '2K' ? '2048px' : '4096px'}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${isActive ? 'bg-primary/8 text-primary' : 'text-foreground/80 hover:bg-muted/8'}`}
                    >
                      <span>{tierKey}</span>
                      {isActive && <Check size={12} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="flex-shrink-0 p-4 border-t border-border/5">
        <button
          onClick={() => generate({ modelId: currentModel?.id, qualityTier: selectedResolution, creditCost: cost })}
          disabled={!canGenerate}
          className={`w-full h-[52px] rounded-2xl text-[14px] font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 ${
            canGenerate
              ? 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-[0_4px_24px_-4px] shadow-primary/30'
              : 'bg-card/60 border border-border/10 text-muted-foreground/40 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              {t.studio.generating}
            </span>
          ) : (
            <>
              {t.toolPage.generate}
              <span className="flex items-center gap-1 text-[11px] opacity-60">
                <Coins size={12} />{cost} {t.toolPage.credits} · ~${(cost * CREDIT_VALUE).toFixed(2)}
              </span>
            </>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground/20 text-center mt-2">⌘ Enter</p>
      </div>
    </aside>
  );
}
