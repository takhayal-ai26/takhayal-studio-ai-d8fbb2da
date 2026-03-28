import { Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UpscaleTier = 'standard' | 'advanced';

interface UpscaleTierSelectorProps {
  selected: UpscaleTier;
  onSelect: (tier: UpscaleTier) => void;
}

export function UpscaleTierSelector({ selected, onSelect }: UpscaleTierSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {/* Standard */}
      <button
        onClick={() => onSelect('standard')}
        className={cn(
          'relative flex flex-col items-start p-4 rounded-xl border transition-all text-left',
          selected === 'standard'
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card/40 hover:border-muted-foreground/30'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <Sparkles size={16} className="text-primary" />
        </div>
        <span className="text-[13px] font-medium text-foreground">Standard Enhance</span>
        <span className="text-[11px] text-muted-foreground mt-0.5">Sharp and clean — fast results</span>
        <div className="mt-2 px-2 py-0.5 rounded-md bg-muted/40 text-[10px] text-muted-foreground font-medium">
          5 credits
        </div>
        <span className="text-[10px] text-muted-foreground/60 mt-1.5">Social media, quick use</span>
      </button>

      {/* Advanced */}
      <button
        onClick={() => onSelect('advanced')}
        className={cn(
          'relative flex flex-col items-start p-4 rounded-xl transition-all text-left',
          selected === 'advanced'
            ? 'border-[1.5px] border-primary bg-primary/5'
            : 'border border-border bg-card/40 hover:border-muted-foreground/30'
        )}
      >
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-semibold">
          Best Quality
        </div>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          <Wand2 size={16} className="text-primary" />
        </div>
        <span className="text-[13px] font-medium text-foreground">Advanced Enhance</span>
        <span className="text-[11px] text-muted-foreground mt-0.5">AI adds texture, depth, and detail</span>
        <div className="mt-2 px-2 py-0.5 rounded-md bg-muted/40 text-[10px] text-muted-foreground font-medium">
          15 credits
        </div>
        <span className="text-[10px] text-muted-foreground/60 mt-1.5">Print, hero shots, ads</span>
      </button>
    </div>
  );
}
