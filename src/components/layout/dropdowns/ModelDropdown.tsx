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
    top = anchorRect.top;
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
    <>
      {/* Transparent backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-150"
        style={{ top, left, width: panelW }}
      >
        <div
          className="rounded-xl border border-border/20 overflow-hidden"
          style={{
            background: '#161616',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            maxHeight: panelMaxH,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sticky header */}
          <div className="sticky top-0 z-[1] px-3.5 py-2.5 border-b border-border/10" style={{ background: '#161616' }}>
            <p className="text-[10px] uppercase tracking-[2.5px] font-medium" style={{ color: '#555' }}>Select Model</p>
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
                  onClick={() => onSelect(m.id)}
                  className="w-full flex items-center gap-3 text-left transition-colors duration-[120ms]"
                  style={{
                    padding: '10px 14px',
                    minHeight: 52,
                    borderBottom: isLast ? 'none' : '1px solid #1A1A1A',
                    borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                    background: isActive ? 'hsla(var(--primary) / 0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = '#1E1E1E'); }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium leading-tight" style={{ color: isActive ? 'hsl(var(--primary))' : '#FFFFFF' }}>
                      {m.model_name}
                    </p>
                    {bestFor && (
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: '#555' }}>{bestFor}</p>
                    )}
                  </div>
                  <span className="text-[9px] flex-shrink-0" style={{ color: '#555' }}>
                    {pills.join('  ')}
                  </span>
                  {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
            {models.length === 0 && (
              <p className="text-[12px] text-center py-6" style={{ color: '#555' }}>No active models</p>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
