import { useState, useEffect, useRef } from 'react';
import { X, Download, Maximize2, Clock } from 'lucide-react';
import { useApp, GeneratedImage } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';

type CardState = 'processing' | 'rendering' | 'completed';

interface GridCard {
  id: string;
  images: GeneratedImage[];
  state: CardState;
  prompt: string;
  startedAt: number;
}

export function GenerationGrid() {
  const { generatedImages, isGenerating, prompt, generate } = useApp();
  const { t } = useLanguage();
  const [cards, setCards] = useState<GridCard[]>([]);
  const [expandedCard, setExpandedCard] = useState<GridCard | null>(null);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevGeneratingRef = useRef(false);
  const prevImagesRef = useRef<GeneratedImage[]>([]);

  // Track generation flow
  useEffect(() => {
    const wasGenerating = prevGeneratingRef.current;
    const prevImages = prevImagesRef.current;

    // Started generating
    if (isGenerating && !wasGenerating) {
      const newCard: GridCard = {
        id: `gen-${Date.now()}`,
        images: [],
        state: 'processing',
        prompt: prompt,
        startedAt: Date.now(),
      };
      setCards(prev => [newCard, ...prev].slice(0, 8));
    }

    // Finished generating (images changed while we were generating)
    if (!isGenerating && wasGenerating && generatedImages !== prevImages && generatedImages.length > 0) {
      setCards(prev => {
        const updated = [...prev];
        const processingIdx = updated.findIndex(c => c.state === 'processing');
        if (processingIdx !== -1) {
          updated[processingIdx] = { ...updated[processingIdx], state: 'rendering', images: generatedImages };
          // Transition to completed after render animation
          setTimeout(() => {
            setCards(p => p.map(c => c.id === updated[processingIdx].id ? { ...c, state: 'completed' } : c));
          }, 1800);
        }
        return updated;
      });
    }

    prevGeneratingRef.current = isGenerating;
    prevImagesRef.current = generatedImages;
  }, [isGenerating, generatedImages, prompt]);

  // Auto-scroll to top on new card
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [cards.length]);

  const openExpanded = (card: GridCard, index: number) => {
    if (card.state !== 'completed') return;
    setExpandedCard(card);
    setExpandedIndex(index);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={gridRef} className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {cards.map(card => (
            <GridCardItem
              key={card.id}
              card={card}
              onClick={(idx) => openExpanded(card, idx)}
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

      {/* Expanded Modal */}
      {expandedCard && expandedCard.images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in" onClick={() => setExpandedCard(null)}>
          <div className="relative max-w-[85vw] max-h-[85vh] flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setExpandedCard(null)} className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-card border border-border/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
            <img
              src={expandedCard.images[expandedIndex]?.url}
              alt={expandedCard.prompt}
              className="max-h-[70vh] rounded-2xl object-contain animate-scale-in"
            />
            {expandedCard.images.length > 1 && (
              <div className="flex gap-2">
                {expandedCard.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setExpandedIndex(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-[1.5px] transition-all duration-200 ${i === expandedIndex ? 'border-primary scale-105' : 'border-border/20 hover:border-muted-foreground/40'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2.5">
              <button onClick={() => generate()} className="h-9 px-4 rounded-xl border border-border/20 text-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-card transition-colors">
                {t.studio.regenerate}
              </button>
              <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:brightness-90 transition-all">
                <Download size={14} />{t.studio.download}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GridCardItem({ card, onClick }: { card: GridCard; onClick: (index: number) => void }) {
  const { t } = useLanguage();
  const primaryImage = card.images[0];

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

  if (card.state === 'rendering' && primaryImage) {
    return (
      <div className="rounded-2xl overflow-hidden bg-card/60 border border-border/10 aspect-square relative gen-card-rendering">
        <img src={primaryImage.url} alt="" className="w-full h-full object-cover blur-md scale-105" />
        <div className="absolute inset-0 gen-sweep" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-sm border border-border/10">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-medium text-foreground/60">Rendering</span>
        </div>
      </div>
    );
  }

  // Completed
  if (!primaryImage) return null;

  return (
    <button
      onClick={() => onClick(0)}
      className="rounded-2xl overflow-hidden bg-card/60 border border-border/10 aspect-square relative group cursor-pointer gen-card-completed transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
    >
      <img
        src={primaryImage.url}
        alt={card.prompt}
        className="w-full h-full object-cover transition-all duration-700 gen-reveal"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
        <p className="text-[11px] text-foreground/80 line-clamp-2 mb-2">{card.prompt}</p>
        <div className="flex items-center gap-1.5">
          {card.images.length > 1 && (
            <span className="text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
              +{card.images.length - 1} more
            </span>
          )}
        </div>
      </div>
      {/* Subtle active glow on hover */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/0 group-hover:ring-primary/15 transition-all duration-300 pointer-events-none" />
    </button>
  );
}
