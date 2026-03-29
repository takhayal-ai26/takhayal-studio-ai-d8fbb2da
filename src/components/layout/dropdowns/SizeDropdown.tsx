import { Check } from 'lucide-react';

interface Props {
  availableRatios: string[];
  selectedRatio: string;
  modelName?: string;
  topOffset: number;
  onSelect: (ratio: string) => void;
  onClose: () => void;
}

const RATIO_DIMS: Record<string, string> = {
  '1:1': '1024 × 1024', '9:16': '576 × 1024', '16:9': '1024 × 576',
  '4:5': '819 × 1024', '3:2': '1024 × 683', '2:3': '683 × 1024',
  '4:3': '1184 × 896', '3:4': '896 × 1184', '5:4': '1120 × 896', '21:9': '1536 × 640',
};

export function SizeDropdown({ availableRatios, selectedRatio, modelName, topOffset, onSelect }: Props) {
  return (
    <div
      className="absolute z-50 animate-in slide-in-from-left-2 fade-in duration-200"
      style={{ left: '100%', top: Math.max(0, topOffset), marginLeft: 6 }}
    >
      <div className="w-[220px] bg-[hsl(var(--card))] border border-border/20 rounded-[10px] shadow-2xl shadow-black/40">
        <div className="px-3.5 pt-2.5 pb-1.5 border-b border-border/10">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[2px] font-medium">Aspect Ratio</p>
        </div>
        {availableRatios.map((r, i) => {
          const isActive = selectedRatio === r;
          const isLast = i === availableRatios.length - 1;
          return (
            <button
              key={r}
              onClick={() => onSelect(r)}
              className={`w-full flex items-center justify-between h-[40px] px-3.5 transition-all duration-150 border-l-2 ${
                isActive ? 'bg-primary/[0.06] border-l-primary' : 'border-l-transparent hover:bg-muted/8'
              } ${!isLast ? 'border-b border-b-border/5' : ''}`}
            >
              <span className={`text-[13px] font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{r}</span>
              <span className="text-[11px] text-muted-foreground/30">{RATIO_DIMS[r] || ''}</span>
            </button>
          );
        })}
        {availableRatios.length <= 3 && modelName && (
          <p className="text-[10px] text-muted-foreground/30 text-center py-2 border-t border-border/5">
            {modelName} supports {availableRatios.length} ratios only
          </p>
        )}
      </div>
    </div>
  );
}
