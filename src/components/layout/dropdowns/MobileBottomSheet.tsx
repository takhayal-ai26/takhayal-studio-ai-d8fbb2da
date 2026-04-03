import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
}

export function MobileBottomSheet({ title, open, onClose, children, maxHeight = '85vh' }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

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
    <div className="fixed inset-0 z-[9998]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl animate-slide-up transition-transform"
        style={{ maxHeight }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]" style={{ maxHeight: `calc(${maxHeight} - 80px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
