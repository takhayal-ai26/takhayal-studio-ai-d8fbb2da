import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, STYLE_OPTIONS, AspectRatio, Quality } from '@/context/AppContext';

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-card transition-colors"
      >
        <span className="text-[13px] font-medium text-foreground">{title}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

export function RightPanel() {
  const {
    prompt, setPrompt, selectedTemplate, setSelectedTemplate,
    selectedStyle, setSelectedStyle, aspectRatio, setAspectRatio,
    quality, setQuality, enhancePrompt, setEnhancePrompt,
    generate, isGenerating, credits, getCreditCost,
  } = useApp();

  const cost = getCreditCost();
  const canGenerate = prompt.trim().length > 0 && !isGenerating && credits >= cost;
  const templates = Object.keys(TEMPLATE_PROMPTS);
  const ratios: AspectRatio[] = ['1:1', '9:16', '16:9', '4:5'];

  const handleTemplateSelect = (t: string) => {
    if (selectedTemplate === t) {
      setSelectedTemplate(null);
    } else {
      setSelectedTemplate(t);
      setPrompt(TEMPLATE_PROMPTS[t]);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-[320px] min-h-screen border-l border-border bg-background flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Settings</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-[160px]">
        {/* Prompt */}
        <Section title="Prompt" defaultOpen>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, 500))}
            placeholder={"Describe what you want to create...\ne.g. Cinematic Ramadan ad, golden lantern, warm purple glow, studio quality"}
            className="w-full min-h-[120px] bg-card border border-surface-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none resize-y leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-muted-foreground/60">{prompt.length}/500</span>
            {prompt.length > 0 && (
              <button onClick={() => { setPrompt(''); setSelectedTemplate(null); }} className="text-muted-foreground/60 hover:text-foreground transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Template tag */}
          {selectedTemplate && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/[0.08] border border-primary/30 text-primary text-[12px]">
              Template: {selectedTemplate}
              <button onClick={() => setSelectedTemplate(null)}>
                <X size={12} />
              </button>
            </div>
          )}

          {/* Enhance toggle */}
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">Enhance with AI</p>
              <p className="text-[11px] text-muted-foreground">Turns your idea into a detailed prompt</p>
            </div>
            <button
              onClick={() => setEnhancePrompt(!enhancePrompt)}
              className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 ${enhancePrompt ? 'bg-primary' : 'bg-surface-border'}`}
            >
              <div className={`absolute top-[3px] w-4 h-4 rounded-full transition-transform duration-200 ${enhancePrompt ? 'translate-x-[22px] bg-foreground' : 'translate-x-[3px] bg-muted-foreground'}`} />
            </button>
          </div>
        </Section>

        {/* Templates */}
        <Section title="Templates" defaultOpen>
          <p className="text-[12px] text-muted-foreground mb-2.5">Quick start</p>
          <div className="flex flex-wrap gap-2">
            {templates.map(t => (
              <button
                key={t}
                onClick={() => handleTemplateSelect(t)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                  selectedTemplate === t
                    ? 'bg-primary/[0.12] border-primary text-primary'
                    : 'bg-card border-surface-border text-foreground hover:border-muted-foreground/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Section>

        {/* Style */}
        <Section title="Style">
          <p className="text-[12px] text-muted-foreground mb-2.5">Visual style</p>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setSelectedStyle(selectedStyle === s ? null : s)}
                className={`rounded-lg border overflow-hidden transition-colors ${
                  selectedStyle === s ? 'border-[1.5px] border-primary' : 'border-surface-border hover:border-muted-foreground/40'
                } bg-card`}
              >
                <div className={`aspect-[4/3] bg-surface-border/30 relative ${selectedStyle === s ? 'after:absolute after:inset-0 after:bg-primary/15' : ''}`}>
                  <img src={`https://picsum.photos/seed/${s}/200/150`} alt={s} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <p className="text-[12px] font-medium text-foreground py-2 text-center">{s}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Format */}
        <Section title="Format">
          <p className="text-[12px] text-muted-foreground mb-2.5">Aspect Ratio</p>
          <div className="flex gap-2">
            {ratios.map(r => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${
                  aspectRatio === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-surface-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <p className="text-[12px] text-muted-foreground mb-2.5 mt-3.5">Quality</p>
          <div className="flex gap-2">
            {(['standard', 'hd'] as Quality[]).map(q => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2 ${
                  quality === q
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-surface-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {q === 'standard' ? 'Standard' : 'HD'}
                {q === 'hd' && quality !== 'hd' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/[0.12] text-primary">+4 credits</span>
                )}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Sticky generate bar */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] text-muted-foreground">Cost</span>
          <span className="text-[12px] font-medium text-primary">{cost} credits</span>
        </div>
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={`w-full h-[52px] rounded-lg text-base font-medium transition-all duration-150 ${
            canGenerate
              ? 'bg-primary text-primary-foreground hover:bg-ember-hover active:scale-[0.99]'
              : 'bg-surface-border text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate'
          )}
        </button>
        <p className="text-[11px] text-muted-foreground/60 text-center mt-2">⌘ Enter</p>
      </div>
    </aside>
  );
}
