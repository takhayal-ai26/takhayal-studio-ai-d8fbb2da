import { useState, useEffect, useRef } from 'react';
import { Upload, ChevronRight, Sparkles, X, Coins, Box, Cpu, Maximize, Image as ImageIcon, Check } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, AspectRatio } from '@/context/AppContext';

const MODELS = [
  { id: 'seedream', name: 'Seedream 5 Lite', desc: 'Fast, creative outputs', icon: Sparkles },
  { id: 'sdxl', name: 'SDXL', desc: 'Balanced quality & speed', icon: Box },
  { id: 'realistic', name: 'Realistic Vision', desc: 'Photo-realistic results', icon: ImageIcon },
  { id: 'anime', name: 'Anime / Stylized', desc: 'Illustration & anime style', icon: Cpu },
];

const SIZES: { label: string; value: AspectRatio; icon: string }[] = [
  { label: '1:1', value: '1:1', icon: '◻' },
  { label: '4:3', value: '4:5', icon: '▭' },
  { label: '16:9', value: '16:9', icon: '▬' },
  { label: '9:16', value: '9:16', icon: '▯' },
];

const RESOLUTIONS = [
  { label: '1K', value: '1K' },
  { label: '2K', value: '2K' },
  { label: '4K', value: '4K' },
] as const;

const QUICK_TEMPLATES = ['Product', 'Fashion', 'Ramadan', 'Real Estate', 'Restaurant', 'Eid'] as const;

type OpenDropdown = 'model' | 'size' | 'resolution' | null;

export function CreationPanel() {
  const {
    prompt, setPrompt, selectedTemplate, setSelectedTemplate,
    aspectRatio, setAspectRatio, quality, setQuality,
    enhancePrompt, setEnhancePrompt,
    generate, isGenerating, credits, getCreditCost,
  } = useApp();

  const [selectedModel, setSelectedModel] = useState('seedream');
  const [selectedResolution, setSelectedResolution] = useState<string>('2K');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cost = getCreditCost();
  const canGenerate = prompt.trim().length > 0 && !isGenerating && credits >= cost;
  const activeModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  const toggleDropdown = (key: OpenDropdown) => {
    setOpenDropdown(prev => prev === key ? null : key);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openDropdown && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
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
    <aside ref={panelRef} className="w-[340px] xl:w-[380px] flex flex-col bg-background flex-shrink-0 overflow-visible relative z-30">
      <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-3 scrollbar-thin">

        {/* === 1. Prompt Card === */}
        <div className="rounded-2xl bg-card/80 backdrop-blur-sm p-4 border border-border/10">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[14px] font-medium text-foreground">Prompt</label>
            <div className="flex items-center gap-2">
              {prompt.length > 0 && (
                <button onClick={() => { setPrompt(''); setSelectedTemplate(null); }} className="text-muted-foreground/60 hover:text-foreground transition-colors">
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => setEnhancePrompt(!enhancePrompt)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 ${
                  enhancePrompt
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent'
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
            className="w-full min-h-[130px] bg-background/80 border border-border/20 rounded-xl p-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:outline-none resize-none leading-relaxed transition-colors"
          />
          <span className="text-[10px] text-muted-foreground/25 mt-1.5 block">{prompt.length}/500</span>

          {/* Quick templates */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {QUICK_TEMPLATES.map(t => (
              <button
                key={t}
                onClick={() => handleQuickTemplate(t)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 border ${
                  selectedTemplate && selectedTemplate.startsWith(t)
                    ? 'bg-primary/12 text-primary border-primary/25'
                    : 'bg-muted/20 text-muted-foreground hover:text-foreground border-transparent hover:border-border/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* === 2. Upload Card === */}
        <button className="w-full rounded-2xl bg-card/60 border border-dashed border-border/20 p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150 group">
          <Upload size={20} className="group-hover:text-primary transition-colors" />
          <span className="text-[13px] font-medium">Upload your images</span>
          <span className="text-[11px] text-muted-foreground/40">JPG / PNG up to 10MB</span>
        </button>

        {/* === 3. Model Selector — popover goes LEFT === */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('model')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl bg-card/80 border transition-all duration-150 ${
              openDropdown === 'model' ? 'border-primary/30 bg-card' : 'border-border/10 hover:border-border/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted/20 flex items-center justify-center">
                <Cpu size={16} className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-medium text-foreground">Model</p>
                <p className="text-[12px] text-muted-foreground">{activeModel.name}</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${openDropdown === 'model' ? 'rotate-90' : ''}`} />
          </button>

          {/* Popover — positioned to the LEFT of the trigger */}
          {openDropdown === 'model' && (
            <div className="absolute left-full top-0 ml-3 w-[260px] bg-card border border-border/20 rounded-2xl p-2 shadow-2xl shadow-black/40 z-50 animate-fade-in">
              <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium px-3 pt-2 pb-2">Select model</p>
              {MODELS.map(m => {
                const Icon = m.icon;
                const isActive = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setOpenDropdown(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 ${
                      isActive ? 'bg-primary/10' : 'hover:bg-muted/15'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/15' : 'bg-muted/20'}`}>
                      <Icon size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-[13px] font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{m.name}</p>
                      <p className="text-[11px] text-muted-foreground/60">{m.desc}</p>
                    </div>
                    {isActive && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* === 4. Size + Resolution row — popovers go LEFT === */}
        <div className="flex gap-3">
          {/* Size */}
          <div className="relative flex-1">
            <button
              onClick={() => toggleDropdown('size')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-card/80 border transition-all duration-150 ${
                openDropdown === 'size' ? 'border-primary/30 bg-card' : 'border-border/10 hover:border-border/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Maximize size={14} className="text-muted-foreground" />
                <div className="text-left">
                  <p className="text-[11px] text-muted-foreground">Size</p>
                  <p className="text-[14px] font-medium text-foreground">{aspectRatio}</p>
                </div>
              </div>
              <ChevronRight size={14} className={`text-muted-foreground transition-transform duration-200 ${openDropdown === 'size' ? 'rotate-90' : ''}`} />
            </button>

            {/* Popover — positioned to the LEFT */}
            {openDropdown === 'size' && (
              <div className="absolute left-full bottom-0 ml-3 w-[220px] bg-card border border-border/20 rounded-2xl p-2 shadow-2xl shadow-black/40 z-50 animate-fade-in">
                <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium px-3 pt-2 pb-2">Aspect ratio</p>
                {SIZES.map(s => {
                  const isActive = aspectRatio === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => { setAspectRatio(s.value); setOpenDropdown(null); }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/15'
                      }`}
                    >
                      <span>{s.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] opacity-40">{s.icon}</span>
                        {isActive && <Check size={14} className="text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resolution */}
          <div className="relative flex-1">
            <button
              onClick={() => toggleDropdown('resolution')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-card/80 border transition-all duration-150 ${
                openDropdown === 'resolution' ? 'border-primary/30 bg-card' : 'border-border/10 hover:border-border/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon size={14} className="text-muted-foreground" />
                <div className="text-left">
                  <p className="text-[11px] text-muted-foreground">Resolution</p>
                  <p className="text-[14px] font-medium text-foreground">{selectedResolution}</p>
                </div>
              </div>
              <ChevronRight size={14} className={`text-muted-foreground transition-transform duration-200 ${openDropdown === 'resolution' ? 'rotate-90' : ''}`} />
            </button>

            {/* Popover — positioned to the LEFT */}
            {openDropdown === 'resolution' && (
              <div className="absolute left-full bottom-0 ml-3 w-[200px] bg-card border border-border/20 rounded-2xl p-2 shadow-2xl shadow-black/40 z-50 animate-fade-in">
                <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium px-3 pt-2 pb-2">Select quality</p>
                {RESOLUTIONS.map(r => {
                  const isActive = selectedResolution === r.value;
                  return (
                    <button
                      key={r.value}
                      onClick={() => handleResolution(r.value)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/15'
                      }`}
                    >
                      <span>{r.label}</span>
                      {isActive && <Check size={14} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === 5. Generate Button === */}
      <div className="flex-shrink-0 p-4 border-t border-border/5">
        {credits <= 5 && credits > 0 && (
          <p className="text-[12px] text-primary font-medium text-center mb-2 animate-pulse">
            Only {credits} credits left
          </p>
        )}
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={`w-full h-14 rounded-2xl text-[15px] font-medium transition-all duration-150 flex items-center justify-center gap-3 ${
            canGenerate
              ? 'bg-primary text-primary-foreground hover:brightness-90 active:scale-[0.98]'
              : 'bg-muted/40 text-muted-foreground cursor-not-allowed'
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
              <span className="flex items-center gap-1 text-[12px] opacity-60">
                <Coins size={13} />
                {cost} credits
              </span>
            </>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground/30 text-center mt-1.5">⌘ Enter</p>
      </div>
    </aside>
  );
}
