import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { LogoMark } from '@/components/Logo';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { PageSeo } from '@/components/seo/PageSeo';

const TITLES: Record<string, { en: string; ar: string }> = {
  terms: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
  privacy: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  refund: { en: 'Refund Policy', ar: 'سياسة الاسترجاع' },
};

export default function LegalPage() {
  const location = useLocation();
  const type = location.pathname.replace('/', ''); // "terms" | "privacy" | "refund"
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [lastUpdatedIso, setLastUpdatedIso] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    supabase
      .from('legal_policies')
      .select('*')
      .eq('type', type)
      .single()
      .then(({ data }) => {
        if (data) {
          const text = isAr && data.content_ar ? data.content_ar : data.content_en;
          setContent(text);
          setLastUpdatedIso(data.last_updated || '');
          setLastUpdated(formatDate(data.last_updated, isAr));
        }
        setLoading(false);
      });
  }, [type, isAr]);

  const title = TITLES[type || ''] || TITLES.terms;
  const seoTitle = `${isAr ? title.ar : title.en} | Takhayal.ai`;
  const seoDescription = isAr
    ? `اقرأ ${title.ar} الخاصة بمنصة تخيّل.`
    : `Read the Takhayal.ai ${title.en.toLowerCase()}.`;

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/${type || 'terms'}`}
        pageType="WebPage"
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: seoTitle,
            url: `https://takhayal.ai/${type || 'terms'}`,
            dateModified: lastUpdatedIso || undefined,
          },
        ]}
      />
      {/* Simple nav */}
      <nav className="h-14 border-b border-border flex items-center px-6 sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="text-sm font-medium text-foreground">Takhayal<span className="text-primary">.ai</span></span>
        </Link>
        <Link to="/" className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          {isAr ? 'العودة' : 'Back'}
        </Link>
      </nav>

      <main className="max-w-[720px] mx-auto px-6 py-12 pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isAr ? title.ar : title.en}
        </h1>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground mb-8">
            {isAr ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </p>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-muted/30 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:text-foreground prose-headings:font-semibold
              prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-[14px]
              prose-li:text-muted-foreground prose-li:text-[14px]
              prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </main>
    </div>
  );
}
