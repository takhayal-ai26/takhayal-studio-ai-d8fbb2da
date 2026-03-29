import { createPortal } from 'react-dom';

interface Props {
  availableRatios: string[];
  selectedRatio: string;
  modelName?: string;
  anchorRect: DOMRect | null;
  onSelect: (ratio: string) => void;
  onClose: () => void;
}

const RATIO_LABEL: Record<string, string> = {
  '1:1': 'Square · Social', '9:16': 'Portrait · Reels', '16:9': 'Landscape · Wide',
  '4:5': 'Instagram · Portrait', '3:2': 'Photo · Print', '2:3': 'Story · Portrait',
  '4:3': 'Classic · Photo', '3:4': 'Vertical · Print', '5:4': 'Wide · Photo', '21:9': 'Cinematic · Ultra-wide',
};

export function SizeDropdown({ availableRatios, selectedRatio, modelName, anchorRect, onSelect, onClose }: Props) {
  const panelW = 200;
  const panelMaxH = 360;
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
        <div className="rounded-xl border border-border/20 overflow-hidden" style={{ background: '#161616', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: panelMaxH, display: 'flex', flexDirection: 'column' }}>
          <div className="sticky top-0 z-[1] px-3.5 py-2.5 border-b border-border/10" style={{ background: '#161616' }}>
            <p className="text-[10px] uppercase tracking-[2.5px] font-medium" style={{ color: '#555' }}>Aspect Ratio</p>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-thin">
            {availableRatios.map((r, i) => {
              const isActive = selectedRatio === r;
              const isLast = i === availableRatios.length - 1;
              return (
                <button
                  key={r}
                  onClick={() => onSelect(r)}
                  className="w-full text-left transition-colors duration-[120ms]"
                  style={{
                    padding: '10px 14px',
                    minHeight: 44,
                    borderBottom: isLast ? 'none' : '1px solid #1A1A1A',
                    borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                    background: isActive ? 'hsla(var(--primary) / 0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = '#1E1E1E'); }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                >
                  <p className="text-[14px] font-medium" style={{ color: isActive ? 'hsl(var(--primary))' : '#FFFFFF' }}>{r}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>{RATIO_LABEL[r] || r}</p>
                </button>
              );
            })}
          </div>
          {availableRatios.length <= 3 && modelName && (
            <p className="text-[10px] text-center py-2 border-t border-border/5" style={{ color: '#555' }}>
              {modelName}: {availableRatios.length} ratios only
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
