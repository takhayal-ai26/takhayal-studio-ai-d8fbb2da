import { createPortal } from 'react-dom';
import { Lock } from 'lucide-react';
import type { PricingTier } from '@/hooks/usePricingTiers';
import { CREDIT_VALUE_USD } from '@/lib/pricing-engine';

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

const TIER_META: Record<string, { pixels: string; speed: string }> = {
  '1K': { pixels: '1024px', speed: '~5s' },
  '2K': { pixels: '2048px', speed: '~12s' },
  '4K': { pixels: '4096px', speed: '~25s' },
};
const ALL_TIERS = ['1K', '2K', '4K'];

export function ResolutionDropdown({ tiers, currentModelId, currentModelName, selectedResolution, anchorRect, onSelect, onClose, getCreditsForModelQuality }: Props) {
  const panelW = 220;
  const panelMaxH = 300;
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
        <div className="rounded-xl border border-border/20 overflow-hidden" style={{ background: '#161616', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: panelMaxH, display: 'flex', flexDirection: 'column' }}>
          <div className="sticky top-0 z-[1] px-3.5 py-2.5 border-b border-border/10" style={{ background: '#161616' }}>
            <p className="text-[10px] uppercase tracking-[2.5px] font-medium" style={{ color: '#555' }}>Resolution</p>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-thin">
            {ALL_TIERS.map((tierKey, i) => {
              const meta = TIER_META[tierKey];
              const isSupported = tiers.includes(tierKey);
              const isActive = selectedResolution === tierKey;
              const credits = getCreditsForModelQuality(currentModelId, tierKey);
              const displayCredits = credits ?? 2;
              const dollarCost = (displayCredits * CREDIT_VALUE_USD).toFixed(2);
              const isLast = i === ALL_TIERS.length - 1;

              if (!isSupported) {
                return (
                  <div
                    key={tierKey}
                    className="flex items-center gap-2 cursor-not-allowed"
                    style={{ padding: '10px 14px', minHeight: 48, borderBottom: isLast ? 'none' : '1px solid #1A1A1A', opacity: 0.35, borderLeft: '2px solid transparent' }}
                  >
                    <Lock size={11} style={{ color: '#444' }} />
                    <div className="flex-1">
                      <p className="text-[14px] font-medium" style={{ color: '#444' }}>{tierKey}</p>
                      <p className="text-[10px]" style={{ color: '#333' }}>Not available</p>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={tierKey}
                  onClick={() => onSelect(tierKey)}
                  className="w-full flex items-center justify-between text-left transition-colors duration-[120ms]"
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
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-medium" style={{ color: isActive ? 'hsl(var(--primary))' : '#FFFFFF' }}>{tierKey}</span>
                      {tierKey === '4K' && (
                        <span className="text-[9px] font-medium px-1.5 py-px rounded" style={{ color: 'hsl(var(--primary))', background: 'hsla(var(--primary) / 0.12)' }}>Best</span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>{meta.pixels} · {meta.speed}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-medium" style={{ color: 'hsl(var(--primary))' }}>{displayCredits} credits</p>
                    <p className="text-[11px]" style={{ color: '#555' }}>~${dollarCost}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
