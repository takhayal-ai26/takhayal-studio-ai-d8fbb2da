import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles } from 'lucide-react';

export function WelcomeBack() {
  const { user, profile } = useAuth();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  if (!user) return null;

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || '';

  const headline = firstName
    ? isAr
      ? `حياك الله يا ${firstName}، شنو ودك نسوي اليوم؟`
      : `Welcome back, ${firstName}! What shall we create today?`
    : isAr
      ? 'حياك الله، شنو ودك تسوي اليوم؟'
      : 'Welcome back! What shall we create today?';

  return (
    <section className="my-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="inline-flex items-center gap-1.5 mb-4 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/20">
        <Sparkles size={13} className="text-amber-500" />
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
          {isAr ? 'حياك الله ✨' : 'Good to see you ✨'}
        </span>
      </div>
      <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
        {headline}
      </h2>
    </section>
  );
}
