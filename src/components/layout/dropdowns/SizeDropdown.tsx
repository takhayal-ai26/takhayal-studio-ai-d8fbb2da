import { Check } from 'lucide-react';

interface Props {
  availableRatios: string[];
  selectedRatio: string;
  modelName?: string;
  topOffset: number;
  onSelect: (ratio: string) => void;
  onClose: () => void;
}

const RATIO_INFO: Record<string, { dims: string; label: string; w: number; h: number }> = {
  '1:1':  { dims: '1024 × 1024', label: 'Square',         w: 1,   h: 1 },
  '9:16': { dims: '576 × 1024',  label: 'Portrait / Reels', w: 9,   h: 16 },
  '16:9': { dims: '1024 × 576',  label: 'Landscape',      w: 16,  h: 9 },
  '4:5':  { dims: '819 × 1024',  label: 'Instagram',      w: 4,   h: 5 },
  '3:2':  { dims: '1024 × 683',  label: 'Photo / Print',  w: 3,   h: 2 },
  '2:3':  { dims: '683 × 1024',  label: 'Portrait / Story', w: 2,   h: 3 },
  '4:3':  { dims: '1184 × 896',  label: 'Classic',        w: 4,   h: 3 },
  '3:4':  { dims: '896 × 1184',  label: 'Vertical',       w: 3,   h: 4 },
  '5:4':  { dims: '1120 × 896',  label: 'Wide Photo',     w: 5,   h: 4 },
  '21:9': { dims: '1536 × 640',  label: 'Cinematic',      w: 21,  h: 9 },
};

function RatioPreview({ w, h, active }: { w: number; h: number; active: boolean }) {
  const maxSize = 32;
  const aspect = w / h;
  let rw: number, rh: number;
  if (aspect >= 1) { rw = maxSize; rh = maxSize / aspect; }
  else { rh = maxSize; rw = maxSize * aspect; }

  return (
    <div className="flex items-center justify-center w-10 h-10">
      <div
        className={`border-2 rounded-sm transition-colors ${active ? 'border-primary' : 'border-muted-foreground/20'}`}
        style={{ width: rw, height: rh }}
      />
    </div>
  );
}

export function SizeDropdown({ availableRatios, selectedRatio, modelName, topOffset, onSelect, onClose }: Props) {
  const isLimited = availableRatios.length <= 3;

  return (
    <div
      className="absolute z-50 animate-in slide-in-from-left-2 fade-in duration-200"
      style={{ left: '100%', top: Math.max(0, topOffset), marginLeft: 8 }}
    >
      <div className="w-[280px] bg-[hsl(var(--card))] border border-border/20 rounded-xl shadow-2xl shadow-black/40 p-3">
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[2px] font-medium px-1 pb-2.5">Aspect Ratio</p>
        <div className="grid grid-cols-2 gap-2">
          {availableRatios.map(r => {
            const info = RATIO_INFO[r] || { dims: '', label: r, w: 1, h: 1 };
            const isActive = selectedRatio === r;
            return (
              <button
                key={r}
                onClick={() => onSelect(r)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-150 ${
                  isActive
                    ? 'border-primary bg-primary/[0.06]'
                    : 'border-border/10 bg-muted/5 hover:bg-muted/10 hover:border-border/20'
                }`}
              >
                <RatioPreview w={info.w} h={info.h} active={isActive} />
                <span className={`text-[15px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{r}</span>
                <span className="text-[10px] text-muted-foreground/40">{info.dims}</span>
              </button>
            );
          })}
        </div>
        {isLimited && modelName && (
          <p className="text-[11px] text-muted-foreground/40 text-center mt-3 px-2">
            {modelName} supports {availableRatios.length} ratios only
          </p>
        )}
      </div>
    </div>
  );
}
