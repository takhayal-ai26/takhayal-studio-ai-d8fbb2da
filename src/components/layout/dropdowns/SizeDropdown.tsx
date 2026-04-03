import { createPortal } from 'react-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/i18n/LanguageContext';
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

const RATIO_LABELS: Record<string, { en: string; ar: string }> = {
  '1:1': { en: 'Square', ar: 'مربع' },
  '9:16': { en: 'Portrait', ar: 'عمودي' },
  '16:9': { en: 'Landscape', ar: 'أفقي' },
  '4:5': { en: 'Social', ar: 'اجتماعي' },
  '3:2': { en: 'Photo', ar: 'صورة' },
  '2:3': { en: 'Tall', ar: 'طولي' },
  '4:3': { en: 'Classic', ar: 'كلاسيكي' },
  '3:4': { en: 'Tablet', ar: 'تابلت' },
  '5:4': { en: 'Wide', ar: 'عريض' },
  '21:9': { en: 'Ultra Wide', ar: 'عريض جداً' },
};

function RatioIcon({ w, h, active, size = 28 }: { w: number; h: number; active: boolean; size?: number }) {
  const aspect = w / h;
  let rw: number, rh: number;
  if (aspect >= 1) { rw = size; rh = size / aspect; } else { rh = size; rw = size * aspect; }
  return (
    <div className="flex items-center justify-center" style={{ width: size + 4, height: size + 4 }}>
      <div
        className="rounded-[3px] transition-all duration-200"
        style={{
          width: rw,
          height: rh,
          border: `2px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'}`,
          background: active ? 'hsl(var(--primary) / 0.1)' : 'transparent',
        }}
      />
    </div>
  );
}

export function SizeDropdown({ availableRatios, selectedRatio, anchorRect, onSelect, onClose }: Props) {
  const isMobile = useIsMobile();
  const { t, lang } = useLanguage();

  if (isMobile) {
    const title = lang === 'ar' ? 'اختر المقاس' : 'Select Size';
    return (
      <MobileBottomSheet title={title} open onClose={onClose} maxHeight="60vh">
        <div className="grid grid-cols-3 gap-3 px-5 pb-4">
          {availableRatios.map(r => {
            const isActive = selectedRatio === r;
            const shape = RATIO_SHAPE[r] || { w: 1, h: 1 };
            return (
              <button
                key={r}
                onClick={() => onSelect(r)}
                className={`flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 ring-1 ring-primary/25 shadow-[0_2px_12px_-2px] shadow-primary/15 scale-[1.02]'
                    : 'bg-foreground/[0.03] active:scale-[0.97]'
                }`}
              >
                <RatioIcon w={shape.w} h={shape.h} active={isActive} size={30} />
                <span className={`text-[14px] font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{r}</span>
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
                <RatioIcon w={shape.w} h={shape.h} active={isActive} size={22} />
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
