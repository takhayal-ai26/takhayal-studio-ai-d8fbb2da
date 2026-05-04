import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { usePublishedContentBlocks } from '@/hooks/useCmsData';
import { cmsText } from '@/lib/cms';

export function CmsContentBlocks({ location, className = '' }: { location: string; className?: string }) {
  const { lang, isRTL } = useLanguage();
  const { data: blocks = [] } = usePublishedContentBlocks(location);

  if (blocks.length === 0) return null;

  return (
    <section className={`mx-auto max-w-7xl px-5 md:px-8 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid gap-3">
        {blocks.map((block) => {
          const title = cmsText(lang, { en: block.title_en, ar: block.title_ar });
          const body = cmsText(lang, { en: block.body_en, ar: block.body_ar });
          const ctaLabel = cmsText(lang, { en: block.cta_label_en, ar: block.cta_label_ar });
          const isBanner = block.type.includes('banner') || block.type.includes('promo');

          return (
            <article
              key={block.id}
              className={`overflow-hidden rounded-2xl border border-border/35 bg-card/55 ${isBanner ? 'md:grid md:grid-cols-[1fr_auto] md:items-center' : ''}`}
            >
              <div className="p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {block.type.replace(/[-_]/g, ' ')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{block.location}</span>
                </div>
                {title && <h2 className="mt-3 text-xl font-semibold text-foreground md:text-2xl">{title}</h2>}
                {body && <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{body}</p>}
                {ctaLabel && block.cta_url && (
                  <Link
                    to={block.cta_url}
                    className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
                  >
                    {ctaLabel}
                  </Link>
                )}
              </div>
              {block.media_url && (
                <img
                  src={block.media_url}
                  alt={title || block.key}
                  className="h-44 w-full object-cover md:h-full md:w-72"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
