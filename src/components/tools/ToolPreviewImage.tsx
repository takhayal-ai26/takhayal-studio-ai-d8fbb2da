import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface ToolPreviewImageProps {
  src?: string | null;
  alt: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Premium, interactive preview tile used on the right-hand side of every Image Tool detail page.
 * Provides direction-aware hover (desktop) + tap (mobile) feedback with a subtle "Preview" overlay label.
 * GPU-accelerated transforms only — no blurs, no heavy filters.
 */
export function ToolPreviewImage({ src, alt, title, subtitle, className }: ToolPreviewImageProps) {
  const { t } = useLanguage();
  const previewLabel = t.toolPage.previewLabel;

  return (
    <div className={cn('group relative', className)}>
      {src ? (
        <div
          className={cn(
            'relative rounded-2xl overflow-hidden bg-muted/5',
            'transition-[transform,box-shadow] duration-300 ease-out will-change-transform',
            'md:group-hover:scale-[1.015] md:group-hover:shadow-2xl md:group-hover:shadow-primary/10',
            'group-active:scale-[0.99] group-active:transition-transform group-active:duration-100',
          )}
        >
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className={cn(
                'w-full h-full object-cover',
                'transition-[transform,filter] duration-[400ms] ease-out',
                'md:group-hover:scale-[1.04] md:group-hover:brightness-[1.05]',
                'group-active:scale-[1.01]',
              )}
            />
          </div>

          {/* Preview overlay label — fades in on hover (desktop) and on press (touch) */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 rounded-2xl',
              'bg-gradient-to-t from-black/55 via-black/10 to-transparent',
              'opacity-0 md:group-hover:opacity-100 group-active:opacity-100',
              'transition-opacity duration-300 ease-out',
            )}
          />
          <div
            className={cn(
              'pointer-events-none absolute top-3 end-3 inline-flex items-center gap-1.5',
              'h-7 px-2.5 rounded-full bg-background/80 backdrop-blur-sm',
              'text-[11px] font-medium text-foreground/85',
              'opacity-0 md:group-hover:opacity-100 group-active:opacity-100',
              'translate-y-1 md:group-hover:translate-y-0 group-active:translate-y-0',
              'transition-all duration-300 ease-out',
            )}
          >
            <ImageIcon size={11} />
            <span>{previewLabel}</span>
          </div>

          {/* Border ring — brightens on interaction */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.04]',
              'md:group-hover:ring-primary/25 group-active:ring-primary/35',
              'transition-all duration-300',
            )}
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-muted/10 to-card aspect-[4/3] flex items-center justify-center">
          <div className="text-center px-8">
            <h3 className="text-lg font-medium text-foreground/60 mb-2">{title}</h3>
            <p className="text-[13px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      )}

      {src && (title || subtitle) && (
        <div className="px-1 pt-4">
          {title && <h3 className="text-lg font-medium text-foreground/85 mb-1">{title}</h3>}
          {subtitle && <p className="text-[13px] text-muted-foreground leading-relaxed">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
