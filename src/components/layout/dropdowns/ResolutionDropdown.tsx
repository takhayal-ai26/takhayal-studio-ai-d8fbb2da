import { Lock } from 'lucide-react';
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

export function ResolutionDropdown({ tiers, currentModelId, currentModelName, selectedResolution, topOffset, onSelect, getCreditsForModelQuality }: Props) {
  return (
    <div
      className="absolute z-50 animate-in slide-in-from-left-2 fade-in duration-200"
      style={{ left: '100%', top: Math.max(0, topOffset), marginLeft: 6 }}
    >
      <div className="w-[220px] bg-[hsl(var(--card))] border border-border/20 rounded-[10px] shadow-2xl shadow-black/40">
        <div className="px-3.5 pt-2.5 pb-1.5 border-b border-border/10">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[2px] font-medium">Resolution</p>
        </div>
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
                className={`flex items-center h-[44px] px-3.5 opacity-35 cursor-not-allowed ${!isLast ? 'border-b border-b-border/5' : ''}`}
              >
                <Lock size={11} className="text-muted-foreground/30 mr-2" />
                <span className="text-[13px] font-medium text-muted-foreground/40 flex-1">{tierKey}</span>
                <span className="text-[10px] text-muted-foreground/25">N/A</span>
              </div>
            );
          }

          return (
            <button
              key={tierKey}
              onClick={() => onSelect(tierKey)}
              className={`w-full flex items-center justify-between h-[52px] px-3.5 transition-all duration-150 border-l-2 ${
                isActive ? 'bg-primary/[0.06] border-l-primary' : 'border-l-transparent hover:bg-muted/8'
              } ${!isLast ? 'border-b border-b-border/5' : ''}`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[14px] font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{tierKey}</span>
                  {tierKey === '4K' && (
                    <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-px rounded">Best</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/30">{meta.pixels} · {meta.speed}</p>
              </div>
              <div className="text-right">
                <p className={`text-[12px] font-medium ${isActive ? 'text-primary' : 'text-primary/70'}`}>{displayCredits} cr</p>
                <p className="text-[11px] text-muted-foreground/30">~${dollarCost}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
