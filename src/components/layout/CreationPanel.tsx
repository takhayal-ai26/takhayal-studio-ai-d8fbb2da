import { useState, useEffect } from 'react';
import { Upload, ChevronDown, Sparkles, X, Coins, Box, Cpu, Maximize } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, AspectRatio } from '@/context/AppContext';

const MODELS = [
  { id: 'seedream', name: 'Seedream 5 Lite', desc: 'Fast, creative outputs', icon: Sparkles },
  { id: 'sdxl', name: 'SDXL', desc: 'Balanced quality & speed', icon: Box },
  { id: 'realistic', name: 'Realistic Vision', desc: 'Photo-realistic results', icon: ImageIcon },
  { id: 'anime', name: 'Anime / Stylized', desc: 'Illustration & anime style', icon: Cpu },
];

const SIZES: { label: string; value: AspectRatio }[] = [
  { label: '1:1', value: '1:1' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '4:5', value: '4:5' },
];

const RESOLUTIONS = ['1K', '2K', '4K'] as const;

const QUICK_TEMPLATES = ['Product', 'Fashion', 'Ramadan', 'Real Estate', 'Restaurant', 'Eid'] as const;

type OpenDropdown = 'model' | 'size' | 'resolution' | null;

export function CreationPanel() {
  const {
    prompt, setPrompt, selectedTemplate, setSelectedTemplate,
    aspectRatio, setAspectRatio, quality, setQuality,
    enhancePrompt, setEnhancePrompt,
    generate, isGenerating, credits, getCreditCost,
  } = useApp();
  } = useApp();

  const [selectedModel, setSelectedModel] = useState('seedream');
  const [selectedResolution, setSelectedResolution] = useState<string>('2K');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);

  const cost = getCreditCost();
  const canGenerate = prompt.trim().length > 0 && !isGenerating && credits >= cost;
  const currentImage = generatedImages[currentImageIndex];
  const hasImages = generatedImages.length > 0;
  const activeModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  const toggleDropdown = (key: OpenDropdown) => {
    setOpenDropdown(prev => prev === key ? null : key);
  };

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

  const handleResolution = (r: string) => {
    setSelectedResolution(r);
    setQuality(r === '1K' ? 'standard' : 'hd');
    setOpenDropdown(null);
  };

  return (
    <aside className="w-[340px] xl:w-[380px] flex flex-col bg-background flex-shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">


        {/* === 1. Prompt Card === */}
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[13px] font-medium text-foreground">Prompt</label>
            <div className="flex items-center gap-2">
              {prompt.length > 0 && (
                <button onClick={() => { setPrompt(''); setSelectedTemplate(null); }} className="text-muted-foreground/60 hover:text-foreground transition-colors">
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => setEnhancePrompt(!enhancePrompt)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  enhancePrompt ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles size={11} />
                Enhance
              </button>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, 500))}
            placeholder="Describe what you want to create..."
            className="w-full min-h-[120px] bg-background border border-border/30 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/60 focus:outline-none resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground/30">{prompt.length}/500</span>
          </div>

          {/* Quick templates */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {QUICK_TEMPLATES.map(t => (
              <button
                key={t}
                onClick={() => handleQuickTemplate(t)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  selectedTemplate && selectedTemplate.startsWith(t)
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* === 2. Upload Card === */}
        <button className="w-full rounded-2xl bg-card border border-dashed border-border/30 p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors group">
          <Upload size={20} className="group-hover:text-primary transition-colors" />
          <span className="text-[13px] font-medium">Upload your images</span>
          <span className="text-[11px] text-muted-foreground/50">JPG / PNG up to 10MB</span>
        </button>

        {/* === 3. Model Selector === */}
        <div className="rounded-2xl bg-card overflow-hidden">
          <button
            onClick={() => toggleDropdown('model')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                <Cpu size={16} className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-medium text-foreground">Model</p>
                <p className="text-[11px] text-muted-foreground">{activeModel.name}</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${openDropdown === 'model' ? 'rotate-180' : ''}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-200 ${openDropdown === 'model' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-3 pb-3 space-y-1">
              {MODELS.map(m => {
                const Icon = m.icon;
                const isActive = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setOpenDropdown(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/20 border border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/15' : 'bg-muted/30'}`}>
                      <Icon size={15} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div className="text-left">
                      <p className={`text-[13px] font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* === 4. Size + Resolution row === */}
        <div className="flex gap-3">
          {/* Size */}
          <div className="flex-1 rounded-2xl bg-card overflow-hidden">
            <button
              onClick={() => toggleDropdown('size')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Maximize size={14} className="text-muted-foreground" />
                <div className="text-left">
                  <p className="text-[11px] text-muted-foreground">Size</p>
                  <p className="text-[13px] font-medium text-foreground">{aspectRatio}</p>
                </div>
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${openDropdown === 'size' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${openDropdown === 'size' ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-2 pb-2 space-y-0.5">
                {SIZES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { setAspectRatio(s.value); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      aspectRatio === s.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution */}
          <div className="flex-1 rounded-2xl bg-card overflow-hidden">
            <button
              onClick={() => toggleDropdown('resolution')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ImageIcon size={14} className="text-muted-foreground" />
                <div className="text-left">
                  <p className="text-[11px] text-muted-foreground">Resolution</p>
                  <p className="text-[13px] font-medium text-foreground">{selectedResolution}</p>
                </div>
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${openDropdown === 'resolution' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${openDropdown === 'resolution' ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-2 pb-2 space-y-0.5">
                {RESOLUTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => handleResolution(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      selectedResolution === r ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 5. Generate Button === */}
      <div className="flex-shrink-0 p-4">
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={`w-full h-14 rounded-2xl text-[15px] font-medium transition-all duration-150 flex items-center justify-center gap-3 ${
            canGenerate
              ? 'bg-primary text-primary-foreground hover:brightness-90 active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            <>
              Generate
              <span className="flex items-center gap-1 text-[12px] opacity-70">
                <Coins size={13} />
                {cost} credits
              </span>
            </>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">⌘ Enter</p>
      </div>
    </aside>
  );
}
