import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Logo } from '@/components/Logo';
import { Instagram, Linkedin, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const XIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const navLinks = [
  { en: 'Home', ar: 'الرئيسية', to: '/' },
  { en: 'Studio', ar: 'الاستوديو', to: '/studio' },
  { en: 'Gallery', ar: 'المعرض', to: '/gallery' },
  { en: 'Templates', ar: 'القوالب', to: '/templates' },
  { en: 'Community', ar: 'المجتمع', to: '/community' },
];

const legalLinks = [
  { en: 'Terms & Conditions', ar: 'الشروط والأحكام', to: '/terms' },
  { en: 'Privacy Policy', ar: 'سياسة الخصوصية', to: '/privacy' },
  { en: 'Contact Us', ar: 'تواصل معنا', to: '/contact' },
  { en: 'Support', ar: 'الدعم', to: 'mailto:support@takhayal.ai' },
];

const imageModelLinks = [
  { name: 'Nano Banana Pro', slug: 'nano-banana-pro' },
  { name: 'Nano Banana 2', slug: 'nano-banana-2' },
  { name: 'Ideogram V3', slug: 'ideogram-v3' },
  { name: 'FLUX 1.1 Pro', slug: 'flux-1-1-pro' },
  { name: 'GPT Image 1.5', slug: 'gpt-image-1-5' },
  { name: 'Imagen 4', slug: 'imagen-4' },
  { name: 'Qwen Image', slug: 'qwen-image' },
  { name: 'Seedream 4.5', slug: 'seedream-4-5' },
  { name: 'Seedream 5.0 Lite', slug: 'seedream-5-0-lite' },
];

const videoModelLinks = [
  { name: 'Kling v2.6 Pro', slug: 'kling-v2-6-pro' },
  { name: 'Kling v3.0 Pro', slug: 'kling-v3-pro' },
  { name: 'Seedance 1.5 Pro', slug: 'seedance-1-5-pro' },
  { name: 'Wan 2.6', slug: 'wan-2-6' },
  { name: 'Hailuo 2.3', slug: 'hailuo-2-3' },
  { name: 'Veo 3.1', slug: 'veo-3-1' },
  { name: 'Grok Imagine', slug: 'grok-imagine' },
];

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/takhayal.ai', label: 'Instagram' },
  { icon: XIcon, href: 'https://x.com/takhayal_ai', label: 'X' },
  { icon: Linkedin, href: 'https://linkedin.com/company/takhayal', label: 'LinkedIn' },
];

function ModelAccordion({ title, links, isAr }: { title: string; links: { name: string; slug: string }[]; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-foreground/[0.06] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex min-h-11 items-center justify-between w-full py-3 text-left"
      >
        <span className="text-[11px] uppercase tracking-widest font-semibold text-primary">{title}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="pb-3 space-y-2">
          {links.map(link => (
            <li key={link.slug}>
              <Link to={`/models/${link.slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150">
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Footer() {
  const { lang, setLang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <footer dir={isRTL ? 'rtl' : 'ltr'} className="w-full bg-muted/50 mt-12">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
        {/* Desktop: 5 columns */}
        <div className="hidden md:grid md:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="default" />
            <p className="text-[13px] leading-relaxed text-muted-foreground max-w-[280px]">
              {isAr ? 'أنشئ صورًا مذهلة بالذكاء الاصطناعي خلال ثوانٍ.' : 'Create stunning AI-generated visuals in seconds.'}
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              {isAr ? 'مصمم للمبدعين في الشرق الأوسط.' : 'Built for creators in the Middle East.'}
            </p>
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                  className="w-8 h-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-150">
                  <social.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest font-semibold mb-4 text-primary">
              {isAr ? 'التنقل' : 'Navigate'}
            </h4>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.to + link.en}>
                  <Link to={link.to} className="text-[13px] text-muted-foreground hover:text-primary transition-colors duration-150">
                    {isAr ? link.ar : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest font-semibold mb-4 text-primary">
              {isAr ? 'قانوني' : 'Legal'}
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  {link.to.startsWith('mailto:') ? (
                    <a href={link.to} className="text-[13px] text-muted-foreground hover:text-primary transition-colors duration-150">
                      {isAr ? link.ar : link.en}
                    </a>
                  ) : (
                    <Link to={link.to} className="text-[13px] text-muted-foreground hover:text-primary transition-colors duration-150">
                      {isAr ? link.ar : link.en}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Image Models */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest font-semibold mb-4 text-primary">
              {isAr ? 'نماذج الصور' : 'Image Models'}
            </h4>
            <ul className="space-y-2">
              {imageModelLinks.map(link => (
                <li key={link.slug}>
                  <Link to={`/models/${link.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Video Models */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest font-semibold mb-4 text-primary">
              {isAr ? 'نماذج الفيديو' : 'Video Models'}
            </h4>
            <ul className="space-y-2">
              {videoModelLinks.map(link => (
                <li key={link.slug}>
                  <Link to={`/models/${link.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden space-y-8">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="default" />
            <p className="text-[13px] leading-relaxed text-muted-foreground max-w-[280px]">
              {isAr ? 'أنشئ صورًا مذهلة بالذكاء الاصطناعي خلال ثوانٍ.' : 'Create stunning AI-generated visuals in seconds.'}
            </p>
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                  className="w-8 h-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-150">
                  <social.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav + Legal inline */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-[11px] uppercase tracking-widest font-semibold mb-3 text-primary">{isAr ? 'التنقل' : 'Navigate'}</h4>
              <ul className="space-y-2">
                {navLinks.map(link => (
                  <li key={link.to}><Link to={link.to} className="text-[13px] text-muted-foreground hover:text-primary transition-colors">{isAr ? link.ar : link.en}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] uppercase tracking-widest font-semibold mb-3 text-primary">{isAr ? 'قانوني' : 'Legal'}</h4>
              <ul className="space-y-2">
                {legalLinks.map(link => (
                  <li key={link.to}>
                    {link.to.startsWith('mailto:') ? (
                      <a href={link.to} className="text-[13px] text-muted-foreground hover:text-primary transition-colors">{isAr ? link.ar : link.en}</a>
                    ) : (
                      <Link to={link.to} className="text-[13px] text-muted-foreground hover:text-primary transition-colors">{isAr ? link.ar : link.en}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Model accordions on mobile */}
          <div className="border-t border-foreground/[0.06] pt-4">
            <ModelAccordion title={isAr ? 'نماذج الصور' : 'Image Models'} links={imageModelLinks} isAr={isAr} />
            <ModelAccordion title={isAr ? 'نماذج الفيديو' : 'Video Models'} links={videoModelLinks} isAr={isAr} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-6 border-t border-foreground/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-[12px] text-muted-foreground/50">
            {isAr ? '© 2026 تخيّل. جميع الحقوق محفوظة.' : '© 2026 Takhayal.ai. All rights reserved.'}
          </p>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-foreground/[0.04]">
            <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>EN</button>
            <button onClick={() => setLang('ar')} className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>AR</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
