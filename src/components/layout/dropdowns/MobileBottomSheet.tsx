import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
}

export function MobileBottomSheet({ title, open, onClose, children, maxHeight = '80vh' }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    if (diff > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    startY.current = 0;
    currentY.current = 0;
  };

  return (
    <div className="fixed inset-0 z-[9998]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bg-background rounded-t-3xl animate-slide-up transition-transform shadow-[0_-8px_40px_rgba(0,0,0,0.25)]"
        style={{ bottom: 0, maxHeight, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/20" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h3 className="text-[17px] font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center text-muted-foreground hover:bg-foreground/[0.1] transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - 140px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
