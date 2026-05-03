import { Link, Navigate, useLocation } from 'react-router-dom';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/i18n/LanguageContext';
import { localizePath, stripLocalePrefix } from '@/lib/localized-routes';
import {
  SEO_LANDING_LAST_UPDATED,
  SeoLandingPageKey,
  seoLandingPages,
} from '@/data/seoLandingPages';

const internalLinks = [
  { path: '/tools', ar: 'الأدوات', en: 'Tools' },
  { path: '/pricing', ar: 'الأسعار', en: 'Pricing' },
  { path: '/templates', ar: 'القوالب', en: 'Templates' },
  { path: '/models', ar: 'النماذج', en: 'Models' },
];

function getPageKey(pathname: string): SeoLandingPageKey | null {
  const clean = stripLocalePrefix(pathname).replace(/^\/+|\/+$/g, '');
  return clean in seoLandingPages ? (clean as SeoLandingPageKey) : null;
}

export default function SeoLandingPage() {
  const location = useLocation();
  const { lang, isRTL } = useLanguage();
  const pageKey = getPageKey(location.pathname);

  if (!pageKey) {
    return <Navigate to={localizePath('/', lang)} replace />;
  }

  const page = seoLandingPages[pageKey];
  const isAr = lang === 'ar';
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question[lang],
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer[lang],
      },
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isAr ? 'الرئيسية' : 'Home',
        item: absoluteUrl(localizePath('/', lang)),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.h1[lang],
        item: absoluteUrl(localizePath(`/${page.slug}`, lang)),
      },
    ],
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(4rem + var(--banner-h, 0px))' }}>
      <PageSeo
        title={page.title[lang]}
        description={page.description[lang]}
        canonicalPath={`/${page.slug}`}
        pageType="WebPage"
        dateModified={SEO_LANDING_LAST_UPDATED}
        schemas={[faqSchema, breadcrumbSchema]}
      />

      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <section className="relative overflow-hidden rounded-[34px] border border-border/45 bg-card/60 p-6 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.13),transparent_32%),radial-gradient(circle_at_80%_10%,hsl(var(--primary)/0.08),transparent_28%)]" />
          <div className="relative max-w-4xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {page.eyebrow[lang]}
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              {page.h1[lang]}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              {page.directAnswer[lang]}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {internalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={localizePath(link.path, lang)}
                  className="inline-flex min-h-11 items-center rounded-full border border-border/60 bg-background/45 px-5 text-sm text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {link[lang]}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-border/45 bg-card/45 p-5 md:p-7">
            <h2 className="mb-5 text-2xl font-semibold tracking-tight">
              {isAr ? 'مقارنة سريعة' : 'Quick comparison'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    {page.tableHeadings[lang].map((heading) => (
                      <th key={heading} className="border-b border-border/70 px-4 py-3 text-start font-semibold text-foreground">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.tableRows.map((row, index) => (
                    <tr key={index}>
                      {row[lang].map((cell) => (
                        <td key={cell} className="border-b border-border/45 px-4 py-4 align-top leading-7 text-muted-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6">
            <section className="rounded-[28px] border border-border/45 bg-card/45 p-5 md:p-7">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">
                {isAr ? 'أفضل الاستخدامات' : 'Best use cases'}
              </h2>
              <ul className="space-y-3">
                {page.useCases[lang].map((item) => (
                  <li key={item} className="rounded-2xl bg-background/45 px-4 py-3 text-sm leading-7 text-foreground/85">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[28px] border border-border/45 bg-card/45 p-5 md:p-7">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">
                {isAr ? 'الحدود والمفاضلات' : 'Limitations and tradeoffs'}
              </h2>
              <ul className="space-y-3">
                {page.limitations[lang].map((item) => (
                  <li key={item} className="rounded-2xl bg-background/45 px-4 py-3 text-sm leading-7 text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-border/45 bg-card/45 p-5 md:p-7">
          <h2 className="mb-5 text-2xl font-semibold tracking-tight">
            {isAr ? 'أسئلة شائعة' : 'Frequently asked questions'}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {page.faqs.map((faq) => (
              <article key={faq.question[lang]} className="rounded-2xl border border-border/45 bg-background/45 p-5">
                <h3 className="font-semibold text-foreground">
                  {faq.question[lang]}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {faq.answer[lang]}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground/75">
            {isAr
              ? `آخر تحديث ${SEO_LANDING_LAST_UPDATED} · محفوظ بواسطة Takhayal.ai`
              : `Last updated ${SEO_LANDING_LAST_UPDATED} · Maintained by Takhayal.ai`}
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
