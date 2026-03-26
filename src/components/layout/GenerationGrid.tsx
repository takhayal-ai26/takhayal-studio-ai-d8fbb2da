import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Maximize2, Clock, RefreshCw, Share2, ChevronDown, Copy, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { useApp, GeneratedImage, GenerationCard, CardState } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from '@/hooks/use-toast';

function ratioToCSS(ratio: string): string {
  const map: Record<string, string> = {
    '1:1': '1/1', '16:9': '16/9', '9:16': '9/16', '4:5': '4/5',
    '4:3': '4/3', '3:2': '3/2', '3:4': '3/4', '2:3': '2/3',
  };
  return map[ratio] || '1/1';
}

export function GenerationGrid() {
  const { generatedImages, isGenerating, prompt, generate, aspectRatio, quality, generationCards: cards, setGenerationCards: setCards } = useApp();
  const { t } = useLanguage();
  const [selectedCard, setSelectedCard] = useState<GenerationCard | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevGeneratingRef = useRef(false);
  const prevImagesRef = useRef<GeneratedImage[]>([]);

  useEffect(() => {
    const wasGenerating = prevGeneratingRef.current;
    const prevImages = prevImagesRef.current;

    if (isGenerating && !wasGenerating) {
      const cardId = `gen-${Date.now()}-0`;
      const newCard: GenerationCard = {
        id: cardId, image: null, state: 'queued' as CardState,
        prompt, startedAt: Date.now(), model: 'Flux Schnell',
        aspectRatio, resolution: quality === 'hd' ? '2K' : '1K',
      };
      setCards(prev => [newCard, ...prev]);
      setTimeout(() => {
        setCards(p => p.map(c => c.id === cardId ? { ...c, state: 'generating' as CardState } : c));
      }, 800);
    }

    if (!isGenerating && wasGenerating && generatedImages !== prevImages && generatedImages.length > 0) {
      setCards(prev => {
        const updated = [...prev];
        const activeCard = updated.find(c => c.state === 'queued' || c.state === 'generating');
        if (activeCard && generatedImages[0]) {
          const idx = updated.indexOf(activeCard);
          const cardId = activeCard.id;
          const img = new Image();
          img.onload = () => {
            setCards(p => p.map(c => c.id === cardId ? { ...c, state: 'completed' as CardState, image: generatedImages[0] } : c));
          };
          img.onerror = () => {
            setCards(p => p.map(c => c.id === cardId ? { ...c, state: 'failed' as CardState } : c));
          };
          img.src = generatedImages[0].url;
          updated[idx] = { ...updated[idx], state: 'generating' as CardState };
        }
        return updated;
      });
    }

    if (!isGenerating && wasGenerating && generatedImages === prevImages) {
      setCards(prev => {
        const updated = [...prev];
        const activeCard = updated.find(c => c.state === 'queued' || c.state === 'generating');
        if (activeCard) {
          const idx = updated.indexOf(activeCard);
          updated[idx] = { ...updated[idx], state: 'failed' as CardState };
        }
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
    a.href = url; a.download = `${promptText.slice(0, 30).replace(/\s+/g, '-')}.png`;
    a.target = '_blank'; a.click();
  }, []);

  const handleRetry = useCallback((cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setTimeout(() => generate(), 100);
  }, [generate]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={gridRef} className="flex-1 overflow-y-auto p-5">
        <div className="columns-2 xl:columns-3 2xl:columns-4 gap-4 [column-fill:_balance]">
          {cards.map(card => (
            <div key={card.id} className="mb-4 break-inside-avoid">
              <GridCardItem
                card={card}
                onClick={() => card.state === 'completed' && setSelectedCard(card)}
                onDelete={() => handleDeleteCard(card.id)}
                onCopyPrompt={() => handleCopyPrompt(card.prompt)}
                onDownload={() => card.image && handleDownloadCard(card.image.url, card.prompt)}
                onRetry={() => handleRetry(card.id)}
              />
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-xl" style={{ animation: 'modalFadeIn 0.25s ease-out' }} onClick={() => setSelectedCard(null)}>
          <div className="relative w-[90vw] max-w-5xl max-h-[90vh] flex flex-col lg:flex-row gap-6 p-6" style={{ animation: 'modalScaleIn 0.3s cubic-bezier(0.16,1,0.3,1)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedCard(null)} className="absolute -top-2 -right-2 z-10 w-9 h-9 rounded-full bg-card border border-border/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            <div className="flex-1 flex items-center justify-center min-h-0">
              <img src={selectedCard.image.url} alt={selectedCard.prompt} className="max-h-[70vh] max-w-full rounded-2xl object-contain" style={{ animation: 'modalImageZoom 0.4s cubic-bezier(0.16,1,0.3,1)', aspectRatio: ratioToCSS(selectedCard.aspectRatio) }} />
            </div>
            <div className="lg:w-[280px] flex-shrink-0 flex flex-col gap-5">
              <div className="space-y-3">
                <DetailRow label={t.studio.model} value={selectedCard.model} />
                <DetailRow label={t.studio.aspectRatio || 'Aspect Ratio'} value={selectedCard.aspectRatio} />
                <DetailRow label={t.studio.resolution || 'Resolution'} value={selectedCard.resolution} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-1.5">{t.studio.prompt}</p>
                <p className={`text-[13px] text-foreground/80 leading-relaxed ${!promptExpanded ? 'line-clamp-3' : ''}`}>{selectedCard.prompt}</p>
                {selectedCard.prompt.length > 120 && (
                  <button onClick={() => setPromptExpanded(!promptExpanded)} className="text-[11px] text-primary mt-1 flex items-center gap-1 hover:underline">
                    {promptExpanded ? 'Collapse' : 'Expand'}<ChevronDown size={10} className={`transition-transform ${promptExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <button className="h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:brightness-90 transition-all active:scale-[0.98]"><Download size={15} />{t.studio.download}</button>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={handleRegenerate} className="h-10 rounded-xl border border-border/15 bg-card/60 text-foreground/80 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-card hover:border-border/30 transition-all"><RefreshCw size={13} />{t.studio.regenerate}</button>
                  <button onClick={() => navigator.clipboard.writeText(selectedCard.prompt)} className="h-10 rounded-xl border border-border/15 bg-card/60 text-foreground/80 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-card hover:border-border/30 transition-all"><Copy size={13} />Copy</button>
                  <button className="h-10 rounded-xl border border-border/15 bg-card/60 text-foreground/80 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-card hover:border-border/30 transition-all"><Share2 size={13} />Share</button>
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

/** Elapsed timer for generating state */
function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span className="text-[10px] text-muted-foreground/40 tabular-nums">{elapsed}s</span>;
}

function GridCardItem({ card, onClick, onDelete, onCopyPrompt, onDownload, onRetry }: {
  card: GenerationCard; onClick: () => void; onDelete: () => void;
  onCopyPrompt: () => void; onDownload: () => void; onRetry: () => void;
}) {
  const { t } = useLanguage();
  const [showActions, setShowActions] = useState(false);
  const cssRatio = ratioToCSS(card.aspectRatio);

  // ── QUEUED ──
  if (card.state === 'queued') {
    return (
      <div className="rounded-2xl overflow-hidden relative gen-card-queued" style={{ aspectRatio: cssRatio }}>
        {/* Layered background */}
        <div className="absolute inset-0 bg-card/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        {/* Border */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/15" />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border border-border/20 bg-card/60 backdrop-blur-sm flex items-center justify-center">
              <Clock size={18} className="text-muted-foreground/40" />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full border border-muted-foreground/10 animate-ping" style={{ animationDuration: '2.5s' }} />
          </div>
          <span className="text-[12px] font-medium text-muted-foreground/50 tracking-wide">{t.studio.queued}</span>
        </div>

        {/* Bottom prompt */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-card/60 to-transparent">
          <p className="text-[10px] text-muted-foreground/25 line-clamp-1">{card.prompt}</p>
        </div>
      </div>
    );
  }

  // ── GENERATING ──
  if (card.state === 'generating') {
    return (
      <div className="rounded-2xl overflow-hidden relative gen-border-glow" style={{ aspectRatio: cssRatio }}>
        {/* Multi-layer shimmer background */}
        <div className="absolute inset-0 bg-card" />
        <div className="absolute inset-0 gen-shimmer" />
        <div className="absolute inset-0 gen-glow" />

        {/* Animated noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

        {/* Inner border */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/10" />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute -inset-3 rounded-full bg-primary/[0.06] blur-md" />
            <div className="relative w-12 h-12 rounded-full border border-primary/20 bg-card/80 backdrop-blur-sm flex items-center justify-center">
              <Loader2 size={20} className="text-primary animate-spin" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[12px] font-medium text-primary/70 tracking-wide">{t.studio.generating}</span>
            <ElapsedTimer startedAt={card.startedAt} />
          </div>
        </div>

        {/* Bottom prompt */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-card/80 to-transparent">
          <p className="text-[10px] text-muted-foreground/25 line-clamp-1">{card.prompt}</p>
        </div>
      </div>
    );
  }

  // ── FAILED ──
  if (card.state === 'failed') {
    return (
      <div className="rounded-2xl overflow-hidden relative gen-card-failed" style={{ aspectRatio: cssRatio }}>
        <div className="absolute inset-0 bg-card/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/[0.04] to-transparent" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-destructive/15" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full border border-destructive/20 bg-destructive/[0.06] flex items-center justify-center">
            <AlertCircle size={20} className="text-destructive/60" />
          </div>
          <span className="text-[12px] font-medium text-destructive/60">{t.studio.failedToLoad}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRetry(); }}
            className="h-8 px-5 rounded-full bg-card border border-border/20 text-[11px] font-medium text-foreground/70 hover:text-foreground hover:border-border/40 transition-all duration-200 flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={11} />
            {t.studio.retry}
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-card/60 to-transparent">
          <p className="text-[10px] text-muted-foreground/25 line-clamp-1">{card.prompt}</p>
        </div>
      </div>
    );
  }

  // ── COMPLETED ──
  if (!card.image) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden relative group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
      style={{ aspectRatio: cssRatio }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={(e) => { if (!(e.target as HTMLElement).closest('.quick-actions')) onClick(); }}
      onTouchStart={() => setShowActions(prev => !prev)}
    >
      {/* Image with reveal animation */}
      <img
        src={card.image.url}
        alt={card.prompt}
        className="w-full h-full object-cover gen-reveal transition-transform duration-500 group-hover:scale-[1.02]"
      />

      {/* Subtle vignette on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Glow border on hover */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/0 group-hover:ring-primary/20 transition-all duration-300 pointer-events-none" />

      {/* Quick actions */}
      <div className={`quick-actions absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-2 transition-all duration-300 ${showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
        <QuickActionButton icon={<Copy size={14} />} onClick={onCopyPrompt} label="Copy prompt" />
        <QuickActionButton icon={<Download size={14} />} onClick={onDownload} label="Download" />
        <QuickActionButton icon={<Trash2 size={14} />} onClick={onDelete} label="Delete" destructive />
      </div>

      {/* Bottom prompt on hover */}
      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <p className="text-[11px] text-foreground/90 line-clamp-2 drop-shadow-md">{card.prompt}</p>
      </div>
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
