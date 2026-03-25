import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Maximize2, Clock, RefreshCw, Share2, ChevronDown, Copy, Trash2 } from 'lucide-react';
import { useApp, GeneratedImage } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from '@/hooks/use-toast';

type CardState = 'processing' | 'rendering' | 'completed';

interface GridCard {
  id: string;
  image: GeneratedImage | null;
  state: CardState;
  prompt: string;
  startedAt: number;
  model: string;
  aspectRatio: string;
  resolution: string;
}

export function GenerationGrid() {
  const { generatedImages, isGenerating, prompt, generate, aspectRatio, quality } = useApp();
  const { t } = useLanguage();
  const [cards, setCards] = useState<GridCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<GridCard | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevGeneratingRef = useRef(false);
  const prevImagesRef = useRef<GeneratedImage[]>([]);

  useEffect(() => {
    const wasGenerating = prevGeneratingRef.current;
    const prevImages = prevImagesRef.current;

    if (isGenerating && !wasGenerating) {
      const newCards: GridCard[] = Array.from({ length: 4 }, (_, i) => ({
        id: `gen-${Date.now()}-${i}`,
        image: null,
        state: 'processing' as CardState,
        prompt: prompt,
        startedAt: Date.now(),
        model: 'Seedream 5 Lite',
        aspectRatio: aspectRatio,
        resolution: quality === 'hd' ? '2K' : '1K',
      }));
      setCards(prev => [...newCards, ...prev].slice(0, 8));
    }

    if (!isGenerating && wasGenerating && generatedImages !== prevImages && generatedImages.length > 0) {
      setCards(prev => {
        const updated = [...prev];
        const processingCards = updated.filter(c => c.state === 'processing');
        generatedImages.forEach((img, i) => {
          if (processingCards[i]) {
            const idx = updated.indexOf(processingCards[i]);
            updated[idx] = { ...updated[idx], state: 'rendering', image: img };
            const cardId = updated[idx].id;
            setTimeout(() => {
              setCards(p => p.map(c => c.id === cardId ? { ...c, state: 'completed' } : c));
            }, 1200 + i * 400);
          }
        });
        return updated;
      });
    }

    prevGeneratingRef.current = isGenerating;
    prevImagesRef.current = generatedImages;
  }, [isGenerating, generatedImages, prompt, aspectRatio, quality]);

  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [cards.length]);

  const handleRegenerate = useCallback(() => {
    setSelectedCard(null);
    setTimeout(() => generate(), 100);
  }, [generate]);

  const handleDeleteCard = useCallback((cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  }, []);

  const handleCopyPrompt = useCallback((promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast({ title: 'Prompt copied', description: 'Copied to clipboard' });
  }, []);

  const handleDownloadCard = useCallback((url: string, promptText: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${promptText.slice(0, 30).replace(/\s+/g, '-')}.png`;
    a.target = '_blank';
    a.click();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={gridRef} className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {cards.map(card => (
            <GridCardItem
              key={card.id}
              card={card}
              onClick={() => card.state === 'completed' && setSelectedCard(card)}
              onDelete={() => handleDeleteCard(card.id)}
              onCopyPrompt={() => handleCopyPrompt(card.prompt)}
              onDownload={() => card.image && handleDownloadCard(card.image.url, card.prompt)}
            />
          ))}
        </div>

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-card/60 border border-border/10 flex items-center justify-center mx-auto mb-4">
                <Maximize2 size={24} className="text-muted-foreground/30" />
              </div>
              <p className="text-[15px] text-muted-foreground/50 font-medium">{t.studio.startByDescribing}</p>
              <p className="text-[12px] text-muted-foreground/30 mt-1">{t.studio.useTemplateOrWrite}</p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCard && selectedCard.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-xl"
          style={{ animation: 'modalFadeIn 0.25s ease-out' }}
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="relative w-[90vw] max-w-5xl max-h-[90vh] flex flex-col lg:flex-row gap-6 p-6"
            style={{ animation: 'modalScaleIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute -top-2 -right-2 z-10 w-9 h-9 rounded-full bg-card border border-border/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center min-h-0">
              <img
                src={selectedCard.image.url}
                alt={selectedCard.prompt}
                className="max-h-[70vh] max-w-full rounded-2xl object-contain"
                style={{ animation: 'modalImageZoom 0.4s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </div>

            {/* Details Panel */}
            <div className="lg:w-[280px] flex-shrink-0 flex flex-col gap-5">
              {/* Metadata */}
              <div className="space-y-3">
                <DetailRow label={t.studio.model} value={selectedCard.model} />
                <DetailRow label={t.studio.aspectRatio || 'Aspect Ratio'} value={selectedCard.aspectRatio} />
                <DetailRow label={t.studio.resolution || 'Resolution'} value={selectedCard.resolution} />
              </div>

              {/* Prompt */}
              <div>
                <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-1.5">{t.studio.prompt}</p>
                <p className={`text-[13px] text-foreground/80 leading-relaxed ${!promptExpanded ? 'line-clamp-3' : ''}`}>
                  {selectedCard.prompt}
                </p>
                {selectedCard.prompt.length > 120 && (
                  <button
                    onClick={() => setPromptExpanded(!promptExpanded)}
                    className="text-[11px] text-primary mt-1 flex items-center gap-1 hover:underline"
                  >
                    {promptExpanded ? 'Collapse' : 'Expand'}
                    <ChevronDown size={10} className={`transition-transform ${promptExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-auto">
                <button className="h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:brightness-90 transition-all active:scale-[0.98]">
                  <Download size={15} />{t.studio.download}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleRegenerate}
                    className="h-10 rounded-xl border border-border/15 bg-card/60 text-foreground/80 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-card hover:border-border/30 transition-all"
                  >
                    <RefreshCw size={13} />{t.studio.regenerate}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCard.prompt);
                    }}
                    className="h-10 rounded-xl border border-border/15 bg-card/60 text-foreground/80 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-card hover:border-border/30 transition-all"
                  >
                    <Copy size={13} />Copy
                  </button>
                  <button className="h-10 rounded-xl border border-border/15 bg-card/60 text-foreground/80 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-card hover:border-border/30 transition-all">
                    <Share2 size={13} />Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/8">
      <span className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium">{label}</span>
      <span className="text-[13px] text-foreground font-medium">{value}</span>
    </div>
  );
}

function GridCardItem({ card, onClick, onDelete, onCopyPrompt, onDownload }: { 
  card: GridCard; 
  onClick: () => void;
  onDelete: () => void;
  onCopyPrompt: () => void;
  onDownload: () => void;
}) {
  const { t } = useLanguage();
  const [showActions, setShowActions] = useState(false);

  if (card.state === 'processing') {
    return (
      <div className="rounded-2xl overflow-hidden bg-card/60 border border-border/10 aspect-square relative gen-card-processing">
        <div className="absolute inset-0 gen-shimmer" />
        <div className="absolute inset-0 gen-glow" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-sm border border-border/10">
          <Clock size={10} className="text-primary animate-pulse" />
          <span className="text-[11px] font-medium text-primary/80">{t.studio.generating}</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[11px] text-muted-foreground/40 line-clamp-2">{card.prompt}</p>
        </div>
      </div>
    );
  }

  if (card.state === 'rendering' && card.image) {
    return (
      <div className="rounded-2xl overflow-hidden bg-card/60 border border-border/10 aspect-square relative gen-card-rendering">
        <img src={card.image.url} alt="" className="w-full h-full object-cover blur-md scale-105" />
        <div className="absolute inset-0 gen-sweep" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-sm border border-border/10">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-medium text-foreground/60">Rendering</span>
        </div>
      </div>
    );
  }

  if (!card.image) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden bg-card/60 border border-border/10 aspect-square relative group cursor-pointer gen-card-completed transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('.quick-actions')) onClick();
      }}
      onTouchStart={() => setShowActions(prev => !prev)}
    >
      <img
        src={card.image.url}
        alt={card.prompt}
        className="w-full h-full object-cover transition-all duration-500 gen-reveal group-hover:scale-[1.02]"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors duration-300 pointer-events-none" />

      {/* Quick actions bar */}
      <div className={`quick-actions absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-2 transition-all duration-300 ${showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
        <QuickActionButton icon={<Copy size={14} />} onClick={onCopyPrompt} label="Copy prompt" />
        <QuickActionButton icon={<Download size={14} />} onClick={onDownload} label="Download" />
        <QuickActionButton icon={<Trash2 size={14} />} onClick={onDelete} label="Delete" destructive />
      </div>

      {/* Bottom prompt on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 pointer-events-none">
        <p className="text-[11px] text-foreground/80 line-clamp-2">{card.prompt}</p>
      </div>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/0 group-hover:ring-primary/15 transition-all duration-300 pointer-events-none" />
    </div>
  );
}

function QuickActionButton({ icon, onClick, label, destructive }: { icon: React.ReactNode; onClick: () => void; label: string; destructive?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      className={`w-9 h-9 rounded-full backdrop-blur-md border border-border/10 flex items-center justify-center transition-all duration-200 active:scale-90 ${
        destructive 
          ? 'bg-background/60 text-foreground/80 hover:bg-destructive/80 hover:text-destructive-foreground hover:border-destructive/30' 
          : 'bg-background/60 text-foreground/80 hover:bg-primary/80 hover:text-primary-foreground hover:border-primary/30'
      }`}
    >
      {icon}
    </button>
  );
}
