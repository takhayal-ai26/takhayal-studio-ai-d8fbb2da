import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, STYLE_OPTIONS, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-card transition-colors">
        <span className="text-[13px] font-medium text-foreground">{title}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}><div className="px-4 pb-4">{children}</div></div>
    </div>
  );
}

const QUALITY_TIER_DISPLAY: Record<string, { label: string; labelAr: string; badge?: string }> = {
  '1K': { label: 'Standard', labelAr: 'قياسي' },
  '2K': { label: 'HD (2K)', labelAr: 'عالي الدقة', badge: '+' },
  '4K': { label: 'Ultra (4K)', labelAr: 'فائق الدقة', badge: '++' },
};

export function RightPanel() {
  const {
    prompt, setPrompt, selectedTemplate, setSelectedTemplate, selectedStyle, setSelectedStyle,
    aspectRatio, setAspectRatio, selectedQualityTier, setSelectedQualityTier,
    enhancePrompt, setEnhancePrompt, generate, isGenerating, credits, getCreditCost,
    availableModels, selectedModelId, setSelectedModelId, selectedModel,
    availableQualityTiers, availableRatios, tierCreditsMap,
  } = useApp();
  const { t, language } = useLanguage();
  const cost = getCreditCost();
  const canGenerate = prompt.trim().length > 0 && !isGenerating && credits >= cost;
  const templates = Object.keys(TEMPLATE_PROMPTS);

  // Use model-specific ratios, filtered to valid AspectRatio values
  const validRatios: AspectRatio[] = ['1:1', '9:16', '16:9', '4:5'];
  const ratios = availableRatios.length > 0
    ? availableRatios.filter(r => validRatios.includes(r as AspectRatio)) as AspectRatio[]
    : validRatios;

  const handleTemplateSelect = (tpl: string) => {
    if (selectedTemplate === tpl) { setSelectedTemplate(null); } else { setSelectedTemplate(tpl); setPrompt(TEMPLATE_PROMPTS[tpl]); }
  };

  const baseTierCredits = tierCreditsMap['1K'] || selectedModel?.credits_per_generation || 2;

  return (
    <aside className="hidden lg:flex flex-col w-[320px] border-l border-surface-border/50 bg-background flex-shrink-0">
      <div className="px-4 py-3 border-b border-border"><span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">{t.studio.settingsLabel}</span></div>
      <div className="flex-1 overflow-y-auto pb-[160px]">
        {/* Model Selector */}
        <Section title={language === 'ar' ? 'النموذج' : 'Model'} defaultOpen>
          <div className="space-y-2">
            {availableModels.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12px] border transition-colors ${
                  selectedModelId === m.id
                    ? 'bg-primary/[0.12] border-primary text-primary font-medium'
                    : 'bg-card border-surface-border text-foreground hover:border-muted-foreground/40'
                }`}
              >
                <span className="block">{m.model_name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {m.supported_quality_tiers.join(' · ')} · {m.credits_per_generation || 2} {t.toolPage.credits}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title={t.studio.prompt} defaultOpen>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value.slice(0, 500))} placeholder={t.studio.describeCreate} className="w-full min-h-[120px] bg-card border border-surface-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none resize-y leading-relaxed" />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-muted-foreground/60">{prompt.length}/500</span>
            {prompt.length > 0 && (<button onClick={() => { setPrompt(''); setSelectedTemplate(null); }} className="text-muted-foreground/60 hover:text-foreground transition-colors"><X size={14} /></button>)}
          </div>
          {selectedTemplate && (<div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/[0.08] border border-primary/30 text-primary text-[12px]">{t.studio.templateLabel}: {selectedTemplate}<button onClick={() => setSelectedTemplate(null)}><X size={12} /></button></div>)}
          <div className="flex items-center justify-between mt-3">
            <div><p className="text-[13px] font-medium text-foreground">{t.studio.enhanceWithAI}</p><p className="text-[11px] text-muted-foreground">{t.studio.enhanceDesc}</p></div>
            <button onClick={() => setEnhancePrompt(!enhancePrompt)} className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 ${enhancePrompt ? 'bg-primary' : 'bg-surface-border'}`}><div className={`absolute top-[3px] w-4 h-4 rounded-full transition-transform duration-200 ${enhancePrompt ? 'translate-x-[22px] bg-foreground' : 'translate-x-[3px] bg-muted-foreground'}`} /></button>
          </div>
        </Section>
        <Section title={t.studio.templates} defaultOpen>
          <p className="text-[12px] text-muted-foreground mb-2.5">{t.studio.quickStart}</p>
          <div className="flex flex-wrap gap-2">{templates.map(tpl => (<button key={tpl} onClick={() => handleTemplateSelect(tpl)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${selectedTemplate === tpl ? 'bg-primary/[0.12] border-primary text-primary' : 'bg-card border-surface-border text-foreground hover:border-muted-foreground/40'}`}>{tpl}</button>))}</div>
        </Section>
        <Section title={t.studio.visualStyle}>
          <p className="text-[12px] text-muted-foreground mb-2.5">{t.studio.visualStyle}</p>
          <div className="grid grid-cols-2 gap-2">{STYLE_OPTIONS.map(s => (<button key={s} onClick={() => setSelectedStyle(selectedStyle === s ? null : s)} className={`rounded-lg border overflow-hidden transition-colors ${selectedStyle === s ? 'border-[1.5px] border-primary' : 'border-surface-border hover:border-muted-foreground/40'} bg-card`}><div className={`aspect-[4/3] bg-surface-border/30 relative ${selectedStyle === s ? 'after:absolute after:inset-0 after:bg-primary/15' : ''}`}><img src={`https://picsum.photos/seed/${s}/200/150`} alt={s} className="w-full h-full object-cover" loading="lazy" /></div><p className="text-[12px] font-medium text-foreground py-2 text-center">{s}</p></button>))}</div>
        </Section>
        <Section title={t.studio.format}>
          <p className="text-[12px] text-muted-foreground mb-2.5">{t.studio.aspectRatio}</p>
          <div className="flex gap-2 flex-wrap">{ratios.map(r => (<button key={r} onClick={() => setAspectRatio(r)} className={`flex-1 min-w-[60px] h-9 rounded-lg text-[13px] font-medium transition-colors ${aspectRatio === r ? 'bg-primary text-primary-foreground' : 'bg-card border border-surface-border text-muted-foreground hover:text-foreground'}`}>{r}</button>))}</div>

          <p className="text-[12px] text-muted-foreground mb-2.5 mt-3.5">{t.studio.quality}</p>
          <div className="flex gap-2 flex-wrap">
            {availableQualityTiers.map(tier => {
              const display = QUALITY_TIER_DISPLAY[tier] || { label: tier, labelAr: tier };
              const tierCredits = tierCreditsMap[tier] || selectedModel?.credits_per_generation || 2;
              const extraCredits = tierCredits - baseTierCredits;
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedQualityTier(tier)}
                  className={`flex-1 min-w-[80px] h-9 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    selectedQualityTier === tier
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-surface-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {language === 'ar' ? display.labelAr : display.label}
                  {extraCredits > 0 && selectedQualityTier !== tier && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/[0.12] text-primary">
                      +{extraCredits}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {availableQualityTiers.length <= 1 && (
            <p className="text-[10px] text-muted-foreground/60 mt-1.5">
              {language === 'ar' ? 'هذا النموذج يدعم جودة واحدة فقط' : 'This model supports only one quality tier'}
            </p>
          )}
        </Section>
      </div>
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground">{selectedModel?.model_name || 'Model'}</span>
          <span className="text-[11px] text-muted-foreground">{selectedQualityTier}</span>
        </div>
        <div className="flex items-center justify-between mb-2.5"><span className="text-[12px] text-muted-foreground">{t.studio.cost}</span><span className="text-[12px] font-medium text-primary">{cost} {t.toolPage.credits}</span></div>
        <button onClick={() => generate({ qualityTier: selectedQualityTier })} disabled={!canGenerate} className={`w-full h-[52px] rounded-lg text-base font-medium transition-all duration-150 ${canGenerate ? 'bg-primary text-primary-foreground hover:bg-ember-hover active:scale-[0.99]' : 'bg-surface-border text-muted-foreground cursor-not-allowed'}`}>
          {isGenerating ? (<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />{t.studio.generating}</span>) : t.toolPage.generate}
        </button>
        <p className="text-[11px] text-muted-foreground/60 text-center mt-2">⌘ Enter</p>
      </div>
    </aside>
  );
}