import { createPortal } from 'react-dom';

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

function RatioIcon({ w, h, active }: { w: number; h: number; active: boolean }) {
  const max = 22;
  const aspect = w / h;
  let rw: number, rh: number;
  if (aspect >= 1) { rw = max; rh = max / aspect; } else { rh = max; rw = max * aspect; }
  return (
    <div className="w-6 h-6 flex items-center justify-center">
      <div
        className="rounded-[2px] transition-colors"
        style={{
          width: rw, height: rh,
          border: `1.5px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}`,
        }}
      />
    </div>
  );
}

export function SizeDropdown({ availableRatios, selectedRatio, anchorRect, onSelect, onClose }: Props) {
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
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-150" style={{ top, left, width: panelW }}>
        <div className="rounded-xl border border-border/20 overflow-hidden overflow-y-auto" style={{ background: '#161616', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: panelMaxH }}>
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
                  padding: '10px 14px',
                  height: 44,
                  borderBottom: isLast ? 'none' : '1px solid #1A1A1A',
                  borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  background: isActive ? 'hsla(var(--primary) / 0.06)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = '#1E1E1E'); }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
              >
                <span className="text-[14px] font-medium" style={{ color: isActive ? 'hsl(var(--primary))' : '#FFFFFF' }}>{r}</span>
                <RatioIcon w={shape.w} h={shape.h} active={isActive} />
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}
