import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomSheet } from './MobileBottomSheet';

interface Props {
  availableRatios: string[];
  selectedRatio: string;
  modelName?: string;
  anchorRect: DOMRect | null;
  onSelect: (ratio: string) => void;
  onClose: () => void;
}

const RATIO_SHAPE: Record<string, { w: number; h: number }> = {
  '1:1': { w: 1, h: 1 }, '9:16': { w: 9, h: 16 }, '16:9': { w: 16, h: 9 },
  '4:5': { w: 4, h: 5 }, '3:2': { w: 3, h: 2 }, '2:3': { w: 2, h: 3 },
  '4:3': { w: 4, h: 3 }, '3:4': { w: 3, h: 4 }, '5:4': { w: 5, h: 4 }, '21:9': { w: 21, h: 9 },
};

function RatioIcon({ w, h, active, size = 22 }: { w: number; h: number; active: boolean; size?: number }) {
  const aspect = w / h;
  let rw: number, rh: number;
  if (aspect >= 1) { rw = size; rh = size / aspect; } else { rh = size; rw = size * aspect; }
  return (
    <div className="flex items-center justify-center" style={{ width: size + 4, height: size + 4 }}>
      <div
        className="rounded-[2px] transition-colors"
        style={{ width: rw, height: rh, border: `1.5px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}` }}
      />
    </div>
  );
}

export function SizeDropdown({ availableRatios, selectedRatio, anchorRect, onSelect, onClose }: Props) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileBottomSheet title="Select Size" open onClose={onClose} maxHeight="50vh">
        <div className="grid grid-cols-3 gap-2 px-4 pb-2">
          {availableRatios.map(r => {
            const isActive = selectedRatio === r;
            const shape = RATIO_SHAPE[r] || { w: 1, h: 1 };
            return (
              <button
                key={r}
                onClick={() => onSelect(r)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${
                  isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-foreground/[0.03]'
                }`}
              >
                <RatioIcon w={shape.w} h={shape.h} active={isActive} size={28} />
                <span className={`text-[13px] font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{r}</span>
              </button>
            );
          })}
        </div>
      </MobileBottomSheet>
    );
  }

  // Desktop
  const panelW = 160;
  const panelMaxH = 400;
  let top = 0, left = 0;
  if (anchorRect) {
    top = anchorRect.top;
    left = anchorRect.right + 8;
    if (top + panelMaxH > window.innerHeight - 16) top = window.innerHeight - panelMaxH - 16;
    if (left + panelW > window.innerWidth - 16) left = anchorRect.left - panelW - 8;
    if (top < 8) top = 8;
  }

  return createPortal(
    <div data-dropdown-portal>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-150" style={{ top, left, width: panelW }}>
        <div className="rounded-xl border border-border overflow-hidden overflow-y-auto" style={{ background: 'var(--dropdown-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxHeight: panelMaxH }}>
          {availableRatios.map((r, i) => {
            const isActive = selectedRatio === r;
            const shape = RATIO_SHAPE[r] || { w: 1, h: 1 };
            const isLast = i === availableRatios.length - 1;
            return (
              <button
                key={r}
                onClick={() => onSelect(r)}
                className="w-full flex items-center justify-between transition-colors duration-[120ms]"
                style={{
                  padding: '10px 14px', height: 44,
                  borderBottom: isLast ? 'none' : `1px solid var(--dropdown-divider)`,
                  borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  background: isActive ? 'hsla(var(--primary) / 0.06)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'hsl(var(--muted))'); }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
              >
                <span className="text-[14px] font-medium" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{r}</span>
                <RatioIcon w={shape.w} h={shape.h} active={isActive} />
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
