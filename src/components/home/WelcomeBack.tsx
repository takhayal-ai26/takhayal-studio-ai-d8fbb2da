import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';

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
      <Badge variant="secondary" className="mb-3 text-xs font-medium">
        {isAr ? 'حياك الله' : 'Good to see you'}
      </Badge>
      <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
        {headline}
      </h2>
    </section>
  );
}
