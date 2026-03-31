import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import type { ModelRecord } from '@/hooks/useModels';
import type { PricingTier } from '@/hooks/usePricingTiers';

interface Props {
  models: ModelRecord[];
  selectedModelId: string;
  allTiers: Record<string, PricingTier[]>;
  language: string;
  anchorRect: DOMRect | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ModelDropdown({ models, selectedModelId, language, anchorRect, onSelect, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Position calculation
  const panelW = 290;
  const panelMaxH = 420;
  let top = 0, left = 0;
  if (anchorRect) {
    // Position higher up so the list is fully visible without page scrolling
    top = Math.max(8, anchorRect.top - panelMaxH + anchorRect.height + 60);
    left = anchorRect.right + 8;
    if (top + panelMaxH > window.innerHeight - 16) top = window.innerHeight - panelMaxH - 16;
    if (left + panelW > window.innerWidth - 16) left = anchorRect.left - panelW - 8;
    if (top < 8) top = 8;
  }

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const selectedEl = el.querySelector('[data-selected="true"]');
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
  }, []);

  return createPortal(
    <div data-dropdown-portal>
      {/* Transparent backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-150"
        style={{ top, left, width: panelW }}
      >
        <div
          className="rounded-xl border border-border overflow-hidden"
          style={{
            background: 'var(--dropdown-bg)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxHeight: panelMaxH,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sticky header */}
          <div className="sticky top-0 z-[1] px-3.5 py-2.5 border-b border-border" style={{ background: 'var(--dropdown-bg)' }}>
            <p className="text-[10px] uppercase tracking-[2.5px] font-medium text-muted-foreground">Select Model</p>
          </div>
          {/* Scrollable list */}
          <div className="overflow-y-auto flex-1 scrollbar-thin" style={{ maxHeight: panelMaxH - 40 }}>
            {models.map((m, i) => {
              const isActive = selectedModelId === m.id;
              const bestFor = language === 'ar' ? (m.best_for_ar || m.best_for) : m.best_for;
              const pills = m.supported_quality_tiers || ['1K'];
              const isLast = i === models.length - 1;

              return (
                <button
                  key={m.id}
                  data-selected={isActive}
                  onClick={(e) => { e.stopPropagation(); onSelect(m.id); }}
                  className="w-full flex items-center gap-3 text-left transition-colors duration-[120ms]"
                  style={{
                    padding: '10px 14px',
                    minHeight: 52,
                    borderBottom: isLast ? 'none' : `1px solid var(--dropdown-divider)`,
                    borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                    background: isActive ? 'hsla(var(--primary) / 0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'hsl(var(--muted))'); }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium leading-tight" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                      {m.model_name}
                    </p>
                    {bestFor && (
                      <p className="text-[11px] mt-0.5 truncate text-muted-foreground">{bestFor}</p>
                    )}
                  </div>
                  <span className="text-[9px] flex-shrink-0 text-muted-foreground">
                    {pills.join('  ')}
                  </span>
                  {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
            {models.length === 0 && (
              <p className="text-[12px] text-center py-6 text-muted-foreground">No active models</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
