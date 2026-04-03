import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Logo } from '@/components/Logo';

const navLinks = [
  { en: 'Home', ar: 'الرئيسية', to: '/' },
  { en: 'Studio', ar: 'الاستوديو', to: '/studio' },
  { en: 'Gallery', ar: 'المعرض', to: '/studio' },
  { en: 'Templates', ar: 'القوالب', to: '/templates' },
  { en: 'Community', ar: 'المجتمع', to: '/community' },
];

const legalLinks = [
  { en: 'Terms & Conditions', ar: 'الشروط والأحكام', to: '/legal/terms' },
  { en: 'Privacy Policy', ar: 'سياسة الخصوصية', to: '/legal/privacy' },
];

export function Footer() {
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <footer
      dir={isRTL ? 'rtl' : 'ltr'}
      className="w-full bg-muted/50 mt-12"
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="default" />
            <p className="text-[13px] leading-relaxed text-muted-foreground max-w-[280px]">
              {isAr
                ? 'أنشئ صورًا مذهلة بالذكاء الاصطناعي خلال ثوانٍ.'
                : 'Create stunning AI-generated visuals in seconds.'}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[12px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-4">
              {isAr ? 'التنقل' : 'Navigate'}
            </h4>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.to + link.en}>
                  <Link
                    to={link.to}
                    className="text-[13px] text-muted-foreground hover:text-primary transition-colors duration-150"
                  >
                    {isAr ? link.ar : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[12px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-4">
              {isAr ? 'قانوني' : 'Legal'}
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[13px] text-muted-foreground hover:text-primary transition-colors duration-150"
                  >
                    {isAr ? link.ar : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider + bottom row */}
        <div className="mt-12 pt-6 border-t border-foreground/[0.06]">
          <p className="text-[12px] text-muted-foreground/50">
            {isAr
              ? '© 2026 تخيّل. جميع الحقوق محفوظة.'
              : '© 2026 Takhayal.ai. All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
