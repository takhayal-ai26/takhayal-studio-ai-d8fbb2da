import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { LogoMark } from '@/components/Logo';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { PageSeo } from '@/components/seo/PageSeo';
import { stripLocalePrefix, localizePath } from '@/lib/localized-routes';

const TITLES: Record<string, { en: string; ar: string }> = {
  terms: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
  privacy: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  refund: { en: 'Refund Policy', ar: 'سياسة الاسترجاع' },
};

const FALLBACK_CONTENT: Record<string, { en: string; ar: string }> = {
  privacy: {
    en: '<h2>Privacy Policy</h2><p>Takhayal.ai collects account, usage, billing, and generation data needed to provide the service, protect accounts, process payments, and improve the product. We do not sell personal information.</p><h2>Data We Process</h2><p>We may process profile details, uploaded inputs, generated outputs, support messages, payment records, device metadata, and analytics events.</p><h2>Your Choices</h2><p>You can contact support to request account, privacy, or data assistance.</p>',
    ar: '<h2>سياسة الخصوصية</h2><p>تجمع تخيّل بيانات الحساب والاستخدام والفوترة والتوليد اللازمة لتقديم الخدمة وحماية الحسابات ومعالجة المدفوعات وتحسين المنتج. نحن لا نبيع المعلومات الشخصية.</p><h2>البيانات التي نعالجها</h2><p>قد نعالج بيانات الملف الشخصي، المدخلات المرفوعة، النتائج المولدة، رسائل الدعم، سجلات الدفع، بيانات الجهاز، وأحداث التحليلات.</p><h2>اختياراتك</h2><p>يمكنك التواصل مع الدعم لطلب المساعدة المتعلقة بالحساب أو الخصوصية أو البيانات.</p>',
  },
  terms: {
    en: '<h2>Terms & Conditions</h2><p>By using Takhayal.ai, you agree to use the platform lawfully, respect third-party rights, and keep your account credentials secure.</p><h2>Generated Content</h2><p>You are responsible for prompts, uploaded assets, and how generated outputs are used. Availability, model behavior, and credit costs may vary by provider and feature.</p><h2>Payments</h2><p>Paid plans and credit purchases are handled through the checkout flow shown at purchase time.</p>',
    ar: '<h2>الشروط والأحكام</h2><p>باستخدام تخيّل، توافق على استخدام المنصة بشكل قانوني، واحترام حقوق الأطراف الأخرى، والحفاظ على بيانات حسابك آمنة.</p><h2>المحتوى المولّد</h2><p>أنت مسؤول عن التعليمات والأصول المرفوعة وكيفية استخدام النتائج المولدة. قد تختلف الإتاحة وسلوك النماذج وتكاليف الرصيد حسب المزود والميزة.</p><h2>المدفوعات</h2><p>تتم معالجة الخطط المدفوعة ومشتريات الرصيد من خلال مسار الدفع المعروض وقت الشراء.</p>',
  },
  refund: {
    en: '<h2>Refund Policy</h2><p>Refund eligibility depends on the purchase type, usage, and payment status. Contact support with your account email and payment reference for review.</p><h2>Credits</h2><p>Credits consumed by completed generation jobs are generally not refundable unless there is a verified platform or billing error.</p>',
    ar: '<h2>سياسة الاسترجاع</h2><p>تعتمد أهلية الاسترجاع على نوع الشراء والاستخدام وحالة الدفع. تواصل مع الدعم باستخدام بريد حسابك ومرجع الدفع للمراجعة.</p><h2>الأرصدة</h2><p>الأرصدة المستخدمة في مهام توليد مكتملة لا تكون قابلة للاسترجاع عادة إلا عند وجود خطأ مؤكد في المنصة أو الفوترة.</p>',
  },
};

export default function LegalPage() {
  const location = useLocation();
  const type = stripLocalePrefix(location.pathname).replace('/', '') || 'terms';
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
          setContent(text || FALLBACK_CONTENT[type]?.[isAr ? 'ar' : 'en'] || '');
          setLastUpdatedIso(data.last_updated || '');
          setLastUpdated(formatDate(data.last_updated, isAr));
        } else {
          setContent(FALLBACK_CONTENT[type]?.[isAr ? 'ar' : 'en'] || '');
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
        <Link to={localizePath('/', lang)} className="flex items-center gap-2">
          <LogoMark size={22} />
        </Link>
        <Link to={localizePath('/', lang)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-muted/40 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          <ArrowLeft size={14} className={isAr ? 'rotate-180' : ''} />
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
