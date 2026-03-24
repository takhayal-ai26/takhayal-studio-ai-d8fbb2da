import { useEffect } from 'react';
import { Upload, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, AspectRatio } from '@/context/AppContext';

const QUICK_TEMPLATES = ['Product', 'Fashion', 'Ramadan', 'Real Estate', 'Restaurant', 'Eid'] as const;
const SIZES: { label: string; value: AspectRatio }[] = [
  { label: '1:1', value: '1:1' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '4:5', value: '4:5' },
];

export function CreationPanel() {
  const {
    prompt, setPrompt, selectedTemplate, setSelectedTemplate,
    aspectRatio, setAspectRatio, quality, setQuality,
    enhancePrompt, setEnhancePrompt,
    generate, isGenerating, credits, getCreditCost,
    generatedImages, currentImageIndex, setCurrentImageIndex,
  } = useApp();

  const cost = getCreditCost();
  const canGenerate = prompt.trim().length > 0 && !isGenerating && credits >= cost;
  const currentImage = generatedImages[currentImageIndex];
  const hasImages = generatedImages.length > 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        generate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generate]);

  const handleQuickTemplate = (t: string) => {
    const key = Object.keys(TEMPLATE_PROMPTS).find(k => k.startsWith(t) || k === t);
    if (key) {
      if (selectedTemplate === key) {
        setSelectedTemplate(null);
      } else {
        setSelectedTemplate(key);
        setPrompt(TEMPLATE_PROMPTS[key]);
      }
    }
  };

  return (
    <aside className="w-[340px] xl:w-[380px] flex flex-col bg-background flex-shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Generated image preview */}
        {hasImages && currentImage && (
          <div className="p-4 pb-0">
            <div className="relative rounded-xl overflow-hidden bg-card aspect-square">
              <img
                src={currentImage.url}
                alt={currentImage.prompt}
                className="w-full h-full object-cover animate-fade-in"
              />
            </div>
            {/* Variations */}
            <div className="flex gap-1.5 mt-2">
              {generatedImages.slice(0, 4).map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`flex-1 h-14 rounded-lg overflow-hidden border-[1.5px] transition-colors ${
                    i === currentImageIndex ? 'border-primary' : 'border-border/50 hover:border-muted-foreground/40'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="p-4 pb-0">
            <div className="rounded-xl bg-card aspect-square animate-shimmer flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">Generating...</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasImages && !isGenerating && (
          <div className="p-4 pb-0">
            <div className="rounded-xl bg-card border border-border/50 aspect-[4/3] flex flex-col items-center justify-center">
              <ImageIcon size={36} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground/60">Your creation appears here</p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground">Prompt</label>
              {prompt.length > 0 && (
                <button onClick={() => { setPrompt(''); setSelectedTemplate(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value.slice(0, 500))}
              placeholder="Describe what you want to create..."
              className="w-full min-h-[140px] bg-card border border-border/50 rounded-xl p-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground/40">{prompt.length}/500</span>
              <button
                onClick={() => setEnhancePrompt(!enhancePrompt)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  enhancePrompt ? 'bg-primary/15 text-primary' : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles size={11} />
                Enhance
              </button>
            </div>
          </div>

          {/* Quick templates */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Quick start</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map(t => (
                <button
                  key={t}
                  onClick={() => handleQuickTemplate(t)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                    selectedTemplate && selectedTemplate.startsWith(t)
                      ? 'bg-primary/15 border border-primary/40 text-primary'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Reference image</label>
            <button className="w-full h-20 rounded-xl border border-dashed border-border/50 bg-card/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors">
              <Upload size={16} />
              <span className="text-[11px]">Upload image</span>
            </button>
          </div>

          {/* Settings */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Size</label>
            <div className="flex gap-1.5">
              {SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setAspectRatio(s.value)}
                  className={`flex-1 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                    aspectRatio === s.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Quality</label>
            <div className="flex gap-1.5">
              {(['standard', 'hd'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                    quality === q
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {q === 'standard' ? 'Standard' : 'HD'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generate button - sticky */}
      <div className="flex-shrink-0 p-4 border-t border-border/50">
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={`w-full h-14 rounded-xl text-[15px] font-medium transition-all duration-150 ${
            canGenerate
              ? 'bg-primary text-primary-foreground hover:bg-[hsl(var(--ember-hover))] active:scale-[0.99]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate'
          )}
        </button>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">{cost} credits · ⌘ Enter</p>
      </div>
    </aside>
  );
}
