import { Sparkles, Wand2, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolProvider } from '@/hooks/useToolProviders';

interface ToolProviderSelectorProps {
  providers: ToolProvider[];
  selected: string; // provider id
  onSelect: (providerId: string) => void;
}

const tierIcons: Record<string, any> = {
  legacy: Zap,
  standard: Sparkles,
  advanced: Wand2,
  premium: Crown,
};

export function ToolProviderSelector({ providers, selected, onSelect }: ToolProviderSelectorProps) {
  if (providers.length <= 1) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {providers.map(p => {
        const Icon = tierIcons[p.tier] || Sparkles;
        const isSelected = p.id === selected;
        const isAdvanced = p.tier === 'advanced' || p.tier === 'premium';

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'relative flex flex-col items-start p-4 rounded-xl border transition-all text-left',
              isSelected
                ? isAdvanced
                  ? 'border-[1.5px] border-[hsl(var(--primary))] bg-primary/5'
                  : 'border-primary bg-primary/5'
                : 'border-border bg-card/40 hover:border-muted-foreground/30'
            )}
          >
            {isAdvanced && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-semibold">
                Best Quality
              </div>
            )}
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
              isAdvanced ? 'bg-primary/10' : 'bg-primary/10'
            )}>
              <Icon size={16} className="text-primary" />
            </div>
            <span className="text-[13px] font-medium text-foreground">{p.display_name}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{p.description}</span>
            <div className="mt-2 px-2 py-0.5 rounded-md bg-muted/40 text-[10px] text-muted-foreground font-medium">
              {p.credit_cost} credits
            </div>
          </button>
        );
      })}
    </div>
  );
}
