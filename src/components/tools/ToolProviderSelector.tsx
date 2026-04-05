import { Sparkles, Wand2, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolProvider } from '@/hooks/useToolProviders';
import { useLanguage } from '@/i18n/LanguageContext';

interface ToolProviderSelectorProps {
  providers: ToolProvider[];
  selected: string;
  onSelect: (providerId: string) => void;
}

const tierIcons: Record<string, any> = {
  legacy: Zap,
  standard: Sparkles,
  advanced: Wand2,
  premium: Crown,
};

export function ToolProviderSelector({ providers, selected, onSelect }: ToolProviderSelectorProps) {
  const { isRTL, t } = useLanguage();
  if (providers.length <= 1) return null;

  return (
    <div className="space-y-2">
      <label className={cn(
        "text-[11px] font-medium text-muted-foreground uppercase tracking-wider block",
        isRTL && "text-right"
      )}>
        {t.toolPage.processingMode}
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        {providers.map(p => {
          const Icon = tierIcons[p.tier] || Sparkles;
          const isSelected = p.id === selected;
          const isAdvanced = p.tier === 'advanced' || p.tier === 'premium';

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              dir={isRTL ? 'rtl' : 'ltr'}
              className={cn(
                'relative flex flex-col items-start p-4 rounded-xl border-[1.5px] transition-all cursor-pointer group',
                isRTL && 'items-end text-right',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border/40 bg-muted/5 hover:border-border hover:bg-muted/10'
              )}
            >
              {isAdvanced && (
                <div className={cn(
                  "absolute -top-2 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[9px] font-bold tracking-wide",
                  isRTL ? "left-3" : "right-3"
                )}>
                  {t.toolPage.best}
                </div>
              )}

              <div className={cn("flex items-center gap-2.5 mb-2", isRTL && "flex-row-reverse")}>
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  isSelected ? 'bg-primary/15' : 'bg-muted/20 group-hover:bg-muted/30'
                )}>
                  <Icon size={15} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                </div>
                <div>
                  <span className={cn(
                    'text-[13px] font-semibold block leading-tight',
                    isSelected ? 'text-foreground' : 'text-foreground/80'
                  )}>
                    {isRTL && p.display_name_ar ? p.display_name_ar : p.display_name}
                  </span>
                </div>
              </div>

              <p className={cn("text-[11px] text-muted-foreground leading-relaxed mb-2.5", isRTL && "text-right")}>
                {isRTL && p.description_ar ? p.description_ar : p.description}
              </p>

              <div className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold',
                isSelected
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted/20 text-muted-foreground',
                isRTL && 'self-end'
              )}>
                {p.credit_cost} {t.toolPage.credits}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
