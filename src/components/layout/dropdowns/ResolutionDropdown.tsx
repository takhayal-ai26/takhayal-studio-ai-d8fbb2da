import { createPortal } from 'react-dom';
import { Lock } from 'lucide-react';
import type { PricingTier } from '@/hooks/usePricingTiers';

interface Props {
  tiers: string[];
  allTiers: Record<string, PricingTier[]>;
  currentModelId: string;
  currentModelName: string;
  selectedResolution: string;
  anchorRect: DOMRect | null;
  onSelect: (resolution: string) => void;
  onClose: () => void;
  getCreditsForModelQuality: (modelId: string, quality: string) => number | null;
}

const ALL_TIERS = ['1K', '2K', '4K'];

export function ResolutionDropdown({ tiers, selectedResolution, anchorRect, onSelect, onClose }: Props) {
  const panelW = 120;
  const panelMaxH = 200;
  let top = 0, left = 0;
  if (anchorRect) {
    top = anchorRect.top;
    left = anchorRect.right + 8;
    if (top + panelMaxH > window.innerHeight - 16) top = window.innerHeight - panelMaxH - 16;
    if (left + panelW > window.innerWidth - 16) left = anchorRect.left - panelW - 8;
    if (top < 8) top = 8;
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-150" style={{ top, left, width: panelW }}>
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--dropdown-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {ALL_TIERS.filter(t => tiers.includes(t)).map((tierKey, i, arr) => {
            const isActive = selectedResolution === tierKey;
            const isLast = i === arr.length - 1;
            return (
              <button
                key={tierKey}
                onClick={() => onSelect(tierKey)}
                className="w-full text-left transition-colors duration-[120ms]"
                style={{
                  padding: '10px 14px',
                  height: 44,
                  borderBottom: isLast ? 'none' : `1px solid var(--dropdown-divider)`,
                  borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  background: isActive ? 'hsla(var(--primary) / 0.06)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'hsl(var(--muted))'); }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
              >
                <span className="text-[14px] font-medium" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{tierKey}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}
