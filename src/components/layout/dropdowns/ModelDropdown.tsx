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

export function ModelDropdown({ models, selectedModelId, allTiers, language, topOffset, onSelect, onClose }: Props) {
  const getQualityPills = (model: ModelRecord) => {
    const tiers = model.supported_quality_tiers || ['1K'];
    return tiers;
  };

  return (
    <div
      className="absolute z-50 animate-in slide-in-from-left-2 fade-in duration-200"
      style={{ left: '100%', top: Math.max(0, topOffset), marginLeft: 8 }}
    >
      <div className="w-[320px] max-h-[70vh] overflow-y-auto bg-[hsl(var(--card))] border border-border/20 rounded-xl shadow-2xl shadow-black/40 scrollbar-thin">
        <div className="px-4 pt-3.5 pb-2">
          <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[2px] font-medium">Model</p>
        </div>
        <div className="pb-1">
          {models.map(m => {
            const isActive = selectedModelId === m.id;
            const bestFor = language === 'ar' ? (m.best_for_ar || m.best_for) : m.best_for;
            const pills = getQualityPills(m);

            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-2 ${
                  isActive
                    ? 'bg-primary/[0.06] border-l-primary'
                    : 'border-l-transparent hover:bg-muted/8'
                }`}
              >
                {/* Icon */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-primary/15' : 'bg-muted/10'}`}>
                  <Cpu size={13} className={isActive ? 'text-primary' : 'text-muted-foreground/50'} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-[14px] font-medium leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {m.model_name}
                  </p>
                  {bestFor && (
                    <p className="text-[11px] text-muted-foreground/40 mt-0.5 truncate">{bestFor}</p>
                  )}
                </div>

                {/* Quality pills */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {pills.map(tier => (
                    <span key={tier} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted/10 border border-border/10 text-muted-foreground/50">
                      {tier}
                    </span>
                  ))}
                </div>

                {/* Checkmark */}
                {isActive && <Check size={14} className="text-primary flex-shrink-0 ml-1" />}
              </button>
            );
          })}
          {models.length === 0 && (
            <p className="text-[12px] text-muted-foreground/30 text-center py-6">No active models</p>
          )}
        </div>
      </div>
    </div>
  );
}
