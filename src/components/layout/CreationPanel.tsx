import { useState, useEffect, useRef } from 'react';
import { Upload, ChevronDown, Sparkles, X, Coins, Box, Cpu, Maximize, Image as ImageIcon, Check, Wand2, Zap, Layers } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels, ModelRecord } from '@/hooks/useModels';
import { usePricing } from '@/hooks/usePricing';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { CREDIT_VALUE_USD } from '@/lib/pricing-engine';


const QUALITY_TIER_META: Record<string, { descKey: string }> = {
  '1K': { descKey: 'standard' },
  '2K': { descKey: 'highQuality' },
  '4K': { descKey: 'ultraHD' },
};

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
  
  // Filter quality tiers: only show tiers that exist AND are active in pricing_tiers
  const modelQualityTiers = (() => {
    if (!currentModel) return ['1K'];
    const dbTiers = currentModel.supported_quality_tiers || ['1K'];
    // For size_locked models (GPT Image 1.5), just use supported_quality_tiers as-is
    if (currentModel.pricing_mode === 'size_locked') return dbTiers;
    // For other models, filter by active pricing tiers if available
    const activePricingTiers = Object.values(allTiers[currentModel.id] || [])
      .filter(t => t.is_active && t.quality_level)
      .map(t => t.quality_level!);
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

  const tierCost = currentModel ? (getCostForModelQuality(currentModel.id, selectedResolution) ?? currentModel.cost_per_run ?? 0) : 0;

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
  const resDescMap: Record<string, string> = { standard: t.studio.standard, highQuality: t.studio.highQuality, ultraHD: t.studio.ultraHD };

  useEffect(() => { const handler = (e: MouseEvent) => { if (openDropdown && panelRef.current && !panelRef.current.contains(e.target as Node)) setOpenDropdown(null); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, [openDropdown]);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDropdown(null); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); generate(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [generate]);

  const handleResolution = (r: string) => { setSelectedResolution(r); setQuality(r === '1K' ? 'standard' : 'hd'); setOpenDropdown(null); };
  const ratioIcons: Record<string, string> = { '1:1': '◻', '4:3': '▭', '16:9': '▬', '9:16': '▯', '4:5': '▭', '3:4': '▭', '3:2': '▬', '2:3': '▯', '5:4': '▭', '21:9': '▬' };

  

  return (
    <aside ref={panelRef} className="w-[340px] xl:w-[380px] flex flex-col bg-background flex-shrink-0 overflow-visible relative z-30 border-r border-border/5">
      <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-3 scrollbar-thin">
        <div className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 border border-border/10">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2"><Wand2 size={14} className="text-primary" /><label className="text-[14px] font-medium text-foreground">{t.studio.prompt}</label></div>
            <div className="flex items-center gap-2">
              {prompt.length > 0 && (<button onClick={() => { setPrompt(''); setSelectedTemplate(null); }} className="text-muted-foreground/60 hover:text-foreground transition-colors"><X size={14} /></button>)}
              <button onClick={() => setEnhancePrompt(!enhancePrompt)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 ${enhancePrompt ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/20'}`}>
                <Sparkles size={11} className={enhancePrompt ? 'text-primary' : ''} />{t.studio.enhance}
              </button>
            </div>
          </div>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value.slice(0, 500))} placeholder={t.studio.describeCreate} className="w-full min-h-[130px] bg-background/80 border border-border/15 rounded-xl p-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:outline-none resize-none leading-relaxed transition-colors" />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground/25">{prompt.length}/500</span>
            {prompt.length > 0 && (<span className="text-[10px] text-primary/50 flex items-center gap-1"><Zap size={9} />{t.studio.ready}</span>)}
          </div>
        </div>
        <button className="w-full rounded-2xl bg-card/50 border border-dashed border-border/15 p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center group-hover:bg-primary/15 transition-colors"><Upload size={18} className="text-primary/70 group-hover:text-primary transition-colors" /></div>
          <span className="text-[13px] font-medium">{t.studio.uploadImages}</span>
          <span className="text-[11px] text-muted-foreground/40">JPG / PNG up to 10MB</span>
        </button>
        {/* Model selector */}
        <div className="relative">
          <button onClick={() => toggleDropdown('model')} className={`w-full flex items-center justify-between p-4 rounded-2xl bg-card/80 border transition-all duration-150 ${openDropdown === 'model' ? 'border-primary/30 bg-card' : 'border-border/10 hover:border-border/20'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${openDropdown === 'model' ? 'bg-primary/15' : 'bg-primary/[0.08]'}`}><Cpu size={16} className="text-primary" /></div>
              <div className="text-left">
                <p className="text-[13px] font-medium text-foreground">{t.studio.model}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] text-primary/70">{currentModel?.model_name || 'Select model'}</p>
                </div>
              </div>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 rotate-180 ${openDropdown === 'model' ? 'rotate-0' : ''}`} />
          </button>
          {openDropdown === 'model' && (
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-card border border-border/20 rounded-2xl p-2 shadow-2xl shadow-black/40 z-50 animate-fade-in max-h-[320px] overflow-y-auto">
              <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium px-3 pt-2 pb-2 flex items-center gap-1.5"><Cpu size={10} />{t.studio.selectModel}</p>
               {activeModels.map(m => {
                const isActive = selectedModelId === m.id;
                const bestForText = language === 'ar' ? (m.best_for_ar || m.best_for) : m.best_for;
                return (
                  <button key={m.id} onClick={() => { setSelectedModelId(m.id); setOpenDropdown(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 ${isActive ? 'bg-primary/10' : 'hover:bg-muted/10'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-muted/15'}`}>
                      <Cpu size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div className={`text-left flex-1 ${language === 'ar' ? 'text-right' : ''}`}>
                      <p className={`text-[13px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{m.model_name}</p>
                      {bestForText && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{bestForText}</p>}
                    </div>
                    {isActive && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
              {activeModels.length === 0 && (
                <p className="text-[11px] text-muted-foreground/50 text-center py-4">No active models. Enable models in Admin.</p>
              )}
            </div>
          )}
        </div>
        {/* Size + Resolution */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <button onClick={() => toggleDropdown('size')} className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-card/80 border transition-all duration-150 ${openDropdown === 'size' ? 'border-primary/30 bg-card' : 'border-border/10 hover:border-border/20'}`}>
              <div className="flex items-center gap-2.5"><Maximize size={14} className="text-primary/70" /><div className="text-left"><p className="text-[11px] text-muted-foreground">{t.studio.size}</p><p className="text-[14px] font-medium text-foreground">{aspectRatio}</p></div></div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 rotate-180 ${openDropdown === 'size' ? 'rotate-0' : ''}`} />
            </button>
            {openDropdown === 'size' && (
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-card border border-border/20 rounded-2xl p-2 shadow-2xl shadow-black/40 z-50 animate-fade-in">
                <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium px-3 pt-2 pb-2 flex items-center gap-1.5"><Maximize size={10} />{t.studio.aspectRatio}</p>
                {availableRatios.map(r => {
                  const isActive = aspectRatio === r;
                  return (
                    <button key={r} onClick={() => { setAspectRatio(r as AspectRatio); setOpenDropdown(null); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/10'}`}>
                      <span>{r}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[14px] ${isActive ? 'text-primary/60' : 'opacity-30'}`}>{ratioIcons[r] || '◻'}</span>
                        {isActive && <Check size={13} className="text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative flex-1">
            <button onClick={() => toggleDropdown('resolution')} className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-card/80 border transition-all duration-150 ${openDropdown === 'resolution' ? 'border-primary/30 bg-card' : 'border-border/10 hover:border-border/20'}`}>
              <div className="flex items-center gap-2.5"><ImageIcon size={14} className="text-primary/70" /><div className="text-left"><p className="text-[11px] text-muted-foreground">{t.studio.resolution}</p><p className="text-[14px] font-medium text-foreground">{selectedResolution}</p></div></div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 rotate-180 ${openDropdown === 'resolution' ? 'rotate-0' : ''}`} />
            </button>
            {openDropdown === 'resolution' && (
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-card border border-border/20 rounded-2xl p-2 shadow-2xl shadow-black/40 z-50 animate-fade-in">
                {modelQualityTiers.map(tierKey => { 
                  const isActive = selectedResolution === tierKey;
                  return (
                    <button
                      key={tierKey}
                      onClick={() => handleResolution(tierKey)}
                      title={tierKey === '1K' ? '1024px' : tierKey === '2K' ? '2048px' : '4096px'}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/10'}`}
                    >
                      <span>{tierKey}</span>
                      {isActive && <Check size={13} className="text-primary" />}
                    </button>); })}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 p-4 border-t border-border/5">
        <button onClick={() => generate({ modelId: currentModel?.id, qualityTier: selectedResolution, creditCost: cost })} disabled={!canGenerate} className={`w-full h-14 rounded-2xl text-[15px] font-medium transition-all duration-150 flex items-center justify-center gap-3 ${canGenerate ? 'bg-primary text-primary-foreground hover:brightness-90 active:scale-[0.98]' : 'bg-card border border-border/10 text-muted-foreground cursor-not-allowed'}`}>
          {isGenerating ? (<span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />{t.studio.generating}</span>) : (<>{t.toolPage.generate}<span className="flex items-center gap-1.5 text-[12px] opacity-70"><Coins size={13} />{cost} {t.toolPage.credits}</span></>)}
        </button>
        <p className="text-[10px] text-muted-foreground/25 text-center mt-2">⌘ Enter</p>
      </div>
    </aside>
  );
}
