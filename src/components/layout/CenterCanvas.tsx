import { useEffect } from 'react';
import { Download, RefreshCw, Image as ImageIcon, Maximize2, LayoutTemplate } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';

const aspectRatioMap: Record<string, string> = { '1:1': 'aspect-square', '9:16': 'aspect-[9/16]', '16:9': 'aspect-video', '4:5': 'aspect-[4/5]' };

export function CenterCanvas() {
  const { aspectRatio, setAspectRatio, generatedImages, currentImageIndex, setCurrentImageIndex, isGenerating, generate, prompt, setActivePage } = useApp();
  const { t } = useLanguage();
  const ratios = ['1:1', '9:16', '16:9', '4:5'] as const;
  const currentImage = generatedImages[currentImageIndex];
  const hasImages = generatedImages.length > 0;

  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); generate(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [generate]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-5 h-10 flex-shrink-0">
        <div><h1 className="text-xl font-medium text-foreground">{t.nav.studio}</h1><p className="text-[12px] text-muted-foreground">{t.studio.generateVisuals}</p></div>
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5">
            {ratios.map(r => (<button key={r} onClick={() => setAspectRatio(r)} className={`h-8 px-3.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${aspectRatio === r ? 'bg-primary text-primary-foreground' : 'bg-card border border-surface-border text-muted-foreground hover:text-foreground'}`}>{r}</button>))}
          </div>
          {hasImages && (<button className="h-8 px-3.5 rounded-md border border-surface-border text-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-card transition-colors"><Download size={14} />{t.studio.download}</button>)}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <div className={`w-full max-w-[900px] ${aspectRatioMap[aspectRatio]} bg-card rounded-xl border border-surface-border relative overflow-hidden`}>
          {isGenerating ? (
            <div className="absolute inset-0 animate-shimmer flex items-center justify-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-sm font-light text-muted-foreground">{t.studio.generating}</span></div></div>
          ) : hasImages && currentImage ? (
            <div className="absolute inset-0 group"><img src={currentImage.url} alt={currentImage.prompt} className="w-full h-full object-cover rounded-xl animate-fade-in" /><div className="absolute inset-0 bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-start justify-end p-3"><button className="text-foreground hover:text-primary transition-colors"><Maximize2 size={18} /></button></div></div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center"><ImageIcon size={48} className="text-surface-border mb-4" /><p className="text-lg font-light text-muted-foreground/60">{t.studio.startByDescribing}</p><p className="text-[13px] text-muted-foreground mt-2">{t.studio.useTemplateOrWrite}</p><button onClick={() => setActivePage('templates')} className="mt-6 h-9 px-5 rounded-lg bg-primary/[0.12] text-primary text-[13px] font-medium hover:bg-primary/20 transition-colors inline-flex items-center gap-2"><LayoutTemplate size={14} />{t.studio.tryATemplate}</button></div>
          )}
        </div>
        <div className="w-full max-w-[900px] flex gap-2 mt-3">
          {Array.from({ length: 4 }).map((_, i) => { const img = generatedImages[i]; const isActive = i === currentImageIndex; return (
            <button key={i} onClick={() => img && setCurrentImageIndex(i)} className={`flex-1 h-[72px] rounded-lg border-[1.5px] overflow-hidden transition-colors duration-150 ${isActive && img ? 'border-primary' : img ? 'border-surface-border hover:border-muted-foreground/40' : 'border-dashed border-surface-border'} bg-card`}>
              {img ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-surface-border" /></div>}
            </button>); })}
        </div>
        {hasImages && (
          <div className="w-full max-w-[900px] flex justify-end gap-2.5 mt-4">
            <button onClick={() => generate()} className="h-9 px-4 rounded-lg border border-surface-border text-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-card transition-colors"><RefreshCw size={14} />{t.studio.regenerate}</button>
            <button className="h-9 px-4 rounded-lg bg-primary hover:bg-ember-hover text-primary-foreground text-[13px] font-medium flex items-center gap-2 transition-colors"><Download size={14} />{t.studio.download}</button>
          </div>
        )}
      </div>
    </div>
  );
}
