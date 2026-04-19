import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface BackToImageToolsProps {
  className?: string;
}

/**
 * Premium, localized back navigation CTA used at the top of every Image Tool detail page.
 * Renders direction-aware arrow + label and returns the user to the Image Tools listing.
 */
export function BackToImageTools({ className }: BackToImageToolsProps) {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <button
      type="button"
      onClick={() => navigate('/tools')}
      aria-label={t.toolPage.backToImageTools}
      className={cn(
        'group inline-flex items-center gap-2 h-9 ps-2 pe-3.5 -ms-2 mb-6 rounded-full',
        'text-[13px] font-medium text-muted-foreground',
        'hover:text-foreground hover:bg-muted/40',
        'active:scale-[0.97] active:bg-muted/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'transition-all duration-200 cursor-pointer',
        className,
      )}
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted/30 group-hover:bg-muted/60 transition-colors">
        <Arrow
          size={13}
          className="transition-transform duration-200 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0"
        />
      </span>
      <span>{t.toolPage.backToImageTools}</span>
    </button>
  );
}
