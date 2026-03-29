import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, ChevronRight, Sparkles, X, Coins, Cpu, Maximize, Image as ImageIcon, Check, Wand2, Zap, Lock } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels, ModelRecord } from '@/hooks/useModels';
import { usePricing } from '@/hooks/usePricing';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { CREDIT_VALUE_USD } from '@/lib/pricing-engine';
import { ModelDropdown } from './dropdowns/ModelDropdown';
import { SizeDropdown } from './dropdowns/SizeDropdown';
import { ResolutionDropdown } from './dropdowns/ResolutionDropdown';

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
  const modelRowRef = useRef<HTMLButtonElement>(null);
  const sizeRowRef = useRef<HTMLButtonElement>(null);
  const resRowRef = useRef<HTMLButtonElement>(null);

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

  const getAnchorRect = (ref: React.RefObject<HTMLElement>): DOMRect | null => {
    return ref.current?.getBoundingClientRect() ?? null;
  };

  return (
    <aside ref={panelRef} className="w-[340px] xl:w-[370px] flex flex-col bg-background flex-shrink-0 overflow-visible relative z-30 border-r border-border/5">
      <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-1.5 scrollbar-thin">
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

        {/* Model selector row */}
        <button
          ref={modelRowRef}
          onClick={() => toggleDropdown('model')}
          className={`w-full flex items-center justify-between h-[48px] px-3.5 rounded-xl bg-card/60 border transition-all duration-200 ${
            openDropdown === 'model' ? 'border-primary/40 bg-card/80' : 'border-border/8 hover:border-border/15'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Cpu size={14} className="text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-[1px] font-medium">{t.studio.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground">{currentModel?.model_name || 'Select'}</span>
            <ChevronRight size={14} className={`text-muted-foreground/30 transition-transform duration-200 ${openDropdown === 'model' ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {/* Size selector row */}
        <button
          ref={sizeRowRef}
          onClick={() => toggleDropdown('size')}
          className={`w-full flex items-center justify-between h-[48px] px-3.5 rounded-xl bg-card/60 border transition-all duration-200 ${
            openDropdown === 'size' ? 'border-primary/40 bg-card/80' : 'border-border/8 hover:border-border/15'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Maximize size={14} className="text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-[1px] font-medium">{t.studio.size}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground">{aspectRatio}</span>
            <ChevronRight size={14} className={`text-muted-foreground/30 transition-transform duration-200 ${openDropdown === 'size' ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {/* Resolution selector row */}
        <button
          ref={resRowRef}
          onClick={() => toggleDropdown('resolution')}
          className={`w-full flex items-center justify-between h-[48px] px-3.5 rounded-xl bg-card/60 border transition-all duration-200 ${
            openDropdown === 'resolution' ? 'border-primary/40 bg-card/80' : 'border-border/8 hover:border-border/15'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ImageIcon size={14} className="text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-[1px] font-medium">{t.studio.resolution}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground">{selectedResolution}</span>
            <ChevronRight size={14} className={`text-muted-foreground/30 transition-transform duration-200 ${openDropdown === 'resolution' ? 'rotate-90' : ''}`} />
          </div>
        </button>
      </div>

      {/* Generate button */}
      <div className="flex-shrink-0 p-4 border-t border-border/5">
        <button
          onClick={() => generate({ modelId: currentModel?.id, qualityTier: selectedResolution, creditCost: cost })}
          disabled={!canGenerate}
          className={`w-full h-[44px] rounded-xl text-[14px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
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
              <span className="flex items-center gap-1 text-[12px] bg-primary-foreground/10 px-2 py-0.5 rounded-full">
                <Coins size={12} />{cost} · ~${(cost * CREDIT_VALUE).toFixed(2)}
              </span>
            </>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground/20 text-center mt-2">⌘ Enter</p>
      </div>

      {openDropdown === 'model' && (
        <ModelDropdown
          models={activeModels}
          selectedModelId={selectedModelId}
          allTiers={allTiers}
          language={language}
          anchorRect={getAnchorRect(modelRowRef)}
          onSelect={(id) => { setSelectedModelId(id); setOpenDropdown(null); }}
          onClose={() => setOpenDropdown(null)}
        />
      )}
      {openDropdown === 'size' && (
        <SizeDropdown
          availableRatios={availableRatios}
          selectedRatio={aspectRatio}
          modelName={currentModel?.model_name}
          anchorRect={getAnchorRect(sizeRowRef)}
          onSelect={(r) => { setAspectRatio(r as AspectRatio); setOpenDropdown(null); }}
          onClose={() => setOpenDropdown(null)}
        />
      )}
      {openDropdown === 'resolution' && (
        <ResolutionDropdown
          tiers={modelQualityTiers}
          allTiers={allTiers}
          currentModelId={currentModel?.id || ''}
          currentModelName={currentModel?.model_name || ''}
          selectedResolution={selectedResolution}
          anchorRect={getAnchorRect(resRowRef)}
          onSelect={handleResolution}
          onClose={() => setOpenDropdown(null)}
          getCreditsForModelQuality={getCreditsForModelQuality}
        />
      )}
    </aside>
  );
}
