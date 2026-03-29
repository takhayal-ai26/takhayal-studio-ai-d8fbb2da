import { Check, Cpu } from 'lucide-react';
import type { ModelRecord } from '@/hooks/useModels';
import type { PricingTier } from '@/hooks/usePricingTiers';

interface Props {
  models: ModelRecord[];
  selectedModelId: string;
  allTiers: Record<string, PricingTier[]>;
  language: string;
  topOffset: number;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ModelDropdown({ models, selectedModelId, allTiers, language, topOffset, onSelect }: Props) {
  return (
    <div
      className="absolute z-50 animate-in slide-in-from-left-2 fade-in duration-200"
      style={{ left: '100%', top: Math.max(0, topOffset), marginLeft: 6 }}
    >
      <div className="w-[280px] max-h-[70vh] overflow-y-auto bg-[hsl(var(--card))] border border-border/20 rounded-[10px] shadow-2xl shadow-black/40 scrollbar-thin">
        <div className="px-3.5 pt-2.5 pb-1.5 border-b border-border/10">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[2px] font-medium">Select Model</p>
        </div>
        {models.map((m, i) => {
          const isActive = selectedModelId === m.id;
          const pills = m.supported_quality_tiers || ['1K'];
          const isLast = i === models.length - 1;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`w-full flex items-center h-[44px] px-3.5 transition-all duration-150 border-l-2 ${
                isActive ? 'bg-primary/[0.06] border-l-primary' : 'border-l-transparent hover:bg-muted/8'
              } ${!isLast ? 'border-b border-b-border/5' : ''}`}
            >
              <p className={`text-[13px] font-medium flex-1 text-left ${isActive ? 'text-primary' : 'text-foreground'}`}>
                {m.model_name}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                {pills.map(tier => (
                  <span key={tier} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted/10 border border-border/10 text-muted-foreground/40">
                    {tier}
                  </span>
                ))}
              </div>
              {isActive && <Check size={14} className="text-primary flex-shrink-0 ml-2" />}
            </button>
          );
        })}
        {models.length === 0 && (
          <p className="text-[11px] text-muted-foreground/30 text-center py-4">No active models</p>
        )}
      </div>
    </div>
  );
}
