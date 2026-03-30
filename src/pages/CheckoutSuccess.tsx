import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LogoMark } from '@/components/Logo';
import { Check, ArrowRight } from 'lucide-react';

const PLAN_DATA: Record<string, { name: string; nameAr: string; credits: number; monthly: number; annual: number }> = {
  creator: { name: 'Creator', nameAr: 'المبدع', credits: 300, monthly: 12, annual: 115.20 },
  studio: { name: 'Studio', nameAr: 'الاستوديو', credits: 1000, monthly: 29, annual: 278.40 },
};

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const type = params.get('type');
  const isCredits = type === 'credits';
  const creditsAmount = parseInt(params.get('amount') || '0', 10);
  const planSlug = params.get('plan') || '';
  const billingType = params.get('billing') || 'monthly';
  const plan = PLAN_DATA[planSlug];

  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + (billingType === 'annual' ? 365 : 30));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[480px] space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-2"><LogoMark size={32} /></div>

        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
            <Check size={28} className="text-primary" strokeWidth={3} />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-[28px] font-medium text-foreground">{isAr ? 'كل شيء جاهز! 🎉' : "You're all set! 🎉"}</h1>
          <p className="text-muted-foreground mt-2">
            {isCredits
              ? (isAr ? `تم إضافة ${creditsAmount} رصيد إلى حسابك` : `${creditsAmount} credits have been added to your account`)
              : (isAr ? `خطة ${plan?.nameAr || planSlug} أصبحت مفعّلة` : `Your ${plan?.name || planSlug} plan is now active.`)}
          </p>
        </div>

        {/* Confirmation card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-medium text-foreground">{isAr ? 'تأكيد الطلب' : 'Order confirmed'}</h3>
          <div className="space-y-2 text-sm">
            {isCredits ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الأرصدة' : 'Credits'}</span><span className="text-foreground">{creditsAmount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المبلغ' : 'Amount'}</span><span className="text-foreground">${(creditsAmount * 0.016).toFixed(2)}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الخطة' : 'Plan'}</span><span className="text-foreground">{isAr ? plan?.nameAr : plan?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الفوترة' : 'Billing'}</span><span className="text-foreground">{billingType === 'annual' ? (isAr ? 'سنوي' : 'Annual') : (isAr ? 'شهري' : 'Monthly')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المبلغ' : 'Amount'}</span><span className="text-foreground">${billingType === 'annual' ? plan?.annual.toFixed(2) : plan?.monthly.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الفوترة القادمة' : 'Next billing'}</span><span className="text-foreground">{nextBilling.toLocaleDateString()}</span></div>
              </>
            )}
          </div>
          {profile?.email && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              {isAr ? `تم إرسال الإيصال إلى ${profile.email}` : `A receipt has been sent to ${profile.email}`}
            </p>
          )}
        </div>

        {/* Credits notice */}
        {!isCredits && plan && (
          <p className="text-sm font-medium text-primary text-center">
            ✓ {plan.credits} {isAr ? 'رصيد تمت إضافتها إلى حسابك' : 'credits have been added to your account'}
          </p>
        )}

        {/* CTAs */}
        <button
          onClick={() => navigate('/studio')}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground text-[15px] font-medium hover:brightness-90 transition-all flex items-center justify-center gap-2"
        >
          {isAr ? 'ابدأ الإبداع' : 'Start Creating'} <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate('/settings')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          {isAr ? 'عرض إعدادات الحساب' : 'View your account settings'}
        </button>
      </div>
    </div>
  );
}
