import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomSheet } from './MobileBottomSheet';
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
  const isMobile = useIsMobile();
  const activeTiers = ALL_TIERS.filter(t => tiers.includes(t));

  if (isMobile) {
    return (
      <MobileBottomSheet title="Select Resolution" open onClose={onClose} maxHeight="40vh">
        <div className="flex gap-2 px-4 pb-2">
          {activeTiers.map(tierKey => {
            const isActive = selectedResolution === tierKey;
            return (
              <button
                key={tierKey}
                onClick={() => onSelect(tierKey)}
                className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-xl transition-all ${
                  isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-foreground/[0.03]'
                }`}
              >
                <span className={`text-[16px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{tierKey}</span>
                {isActive && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      </MobileBottomSheet>
    );
  }

  // Desktop
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
    <div data-dropdown-portal>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-150" style={{ top, left, width: panelW }}>
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--dropdown-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {activeTiers.map((tierKey, i) => {
            const isActive = selectedResolution === tierKey;
            const isLast = i === activeTiers.length - 1;
            return (
              <button
                key={tierKey}
                onClick={() => onSelect(tierKey)}
                className="w-full text-left transition-colors duration-[120ms]"
                style={{
                  padding: '10px 14px', height: 44,
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
    </div>,
    document.body
  );
}
