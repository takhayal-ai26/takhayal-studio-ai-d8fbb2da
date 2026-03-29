import { Check, Lock, Award } from 'lucide-react';
import type { PricingTier } from '@/hooks/usePricingTiers';
import { CREDIT_VALUE_USD } from '@/lib/pricing-engine';

interface Props {
  tiers: string[];
  allTiers: Record<string, PricingTier[]>;
  currentModelId: string;
  currentModelName: string;
  selectedResolution: string;
  topOffset: number;
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

export function ResolutionDropdown({ tiers, allTiers, currentModelId, currentModelName, selectedResolution, topOffset, onSelect, onClose, getCreditsForModelQuality }: Props) {
  return (
    <div
      className="absolute z-50 animate-in slide-in-from-left-2 fade-in duration-200"
      style={{ left: '100%', top: Math.max(0, topOffset), marginLeft: 8 }}
    >
      <div className="w-[280px] bg-[hsl(var(--card))] border border-border/20 rounded-xl shadow-2xl shadow-black/40 p-3">
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[2px] font-medium px-1 pb-2.5">Resolution</p>
        <div className="space-y-2">
          {ALL_TIERS.map(tierKey => {
            const meta = TIER_META[tierKey] || { pixels: '', speed: '' };
            const isSupported = tiers.includes(tierKey);
            const isActive = selectedResolution === tierKey;
            const credits = getCreditsForModelQuality(currentModelId, tierKey);
            const displayCredits = credits ?? 2;
            const dollarCost = (displayCredits * CREDIT_VALUE_USD).toFixed(2);
            const isBest = tierKey === '4K' && isSupported;

            if (!isSupported) {
              return (
                <div
                  key={tierKey}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-border/5 bg-muted/5 opacity-40 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <Lock size={14} className="text-muted-foreground/30" />
                    <div>
                      <p className="text-[16px] font-semibold text-muted-foreground/40">{tierKey}</p>
                      <p className="text-[10px] text-muted-foreground/25">Not available for {currentModelName}</p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={tierKey}
                onClick={() => onSelect(tierKey)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all duration-150 relative ${
                  isActive
                    ? 'border-primary bg-primary/[0.06]'
                    : 'border-border/10 bg-muted/5 hover:bg-muted/10 hover:border-border/20'
                }`}
              >
                {/* Best quality badge */}
                {isBest && (
                  <span className="absolute -top-2 right-3 text-[9px] font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award size={9} />Best Quality
                  </span>
                )}

                <div>
                  <p className={`text-[18px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{tierKey}</p>
                  <p className="text-[11px] text-muted-foreground/40 mt-0.5">{meta.pixels} · {meta.speed}</p>
                </div>

                <div className="text-right">
                  <p className={`text-[13px] font-semibold ${isActive ? 'text-primary' : 'text-primary/70'}`}>{displayCredits} credits</p>
                  <p className="text-[11px] text-muted-foreground/40">~${dollarCost}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
