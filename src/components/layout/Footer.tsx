import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Logo } from '@/components/Logo';
import { Instagram, Linkedin } from 'lucide-react';

const XIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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
  { en: 'Contact Us', ar: 'تواصل معنا', to: '/contact' },
  { en: 'Support', ar: 'الدعم', to: 'mailto:support@takhayal.ai' },
];

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/takhayal.ai', label: 'Instagram' },
  { icon: XIcon, href: 'https://x.com/takhayal_ai', label: 'X' },
  { icon: Linkedin, href: 'https://linkedin.com/company/takhayal', label: 'LinkedIn' },
];

export function Footer() {
  const { lang, setLang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <footer
      dir={isRTL ? 'rtl' : 'ltr'}
      className="w-full bg-muted/50 mt-12"
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="default" />
            <p className="text-[13px] leading-relaxed text-muted-foreground max-w-[280px]">
              {isAr
                ? 'أنشئ صورًا مذهلة بالذكاء الاصطناعي خلال ثوانٍ.'
                : 'Create stunning AI-generated visuals in seconds.'}
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              {isAr ? 'مصمم للمبدعين في الشرق الأوسط.' : 'Built for creators in the Middle East.'}
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-8 h-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-150"
                >
                  <social.icon size={14} />
                </a>
              ))}
            </div>
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
                  {link.to.startsWith('mailto:') ? (
                    <a
                      href={link.to}
                      className="text-[13px] text-muted-foreground hover:text-primary transition-colors duration-150"
                    >
                      {isAr ? link.ar : link.en}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-[13px] text-muted-foreground hover:text-primary transition-colors duration-150"
                    >
                      {isAr ? link.ar : link.en}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider + bottom row */}
        <div className="mt-12 pt-6 border-t border-foreground/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-[12px] text-muted-foreground/50">
            {isAr
              ? '© 2026 تخيّل. جميع الحقوق محفوظة.'
              : '© 2026 Takhayal.ai. All rights reserved.'}
          </p>
          {/* Language switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-foreground/[0.04]">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              AR
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
