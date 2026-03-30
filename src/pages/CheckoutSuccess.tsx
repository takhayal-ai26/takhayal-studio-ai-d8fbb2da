import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LogoMark } from '@/components/Logo';
import { Check, ArrowRight } from 'lucide-react';
import { usePricingPlans } from '@/hooks/useBillingData';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const { data: plans = [] } = usePricingPlans();

  const type = params.get('type');
  const isCredits = type === 'credits';
  const creditsAmount = parseInt(params.get('amount') || '0', 10);
  const planSlug = params.get('plan') || '';
  const billingType = params.get('billing') || 'monthly';
  const plan = plans.find((p: any) => p.slug === planSlug);

  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + (billingType === 'annual' ? 365 : 30));

  const totalPrice = plan
    ? (billingType === 'annual' ? plan.price_annual_usd : plan.price_monthly_usd)
    : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[480px] space-y-6">
        <div className="flex justify-center mb-2"><LogoMark size={32} /></div>

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
            <Check size={28} className="text-primary" strokeWidth={3} />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-[28px] font-medium text-foreground">{isAr ? 'كل شيء جاهز! 🎉' : "You're all set! 🎉"}</h1>
          <p className="text-muted-foreground mt-2">
            {isCredits
              ? (isAr ? `تم إضافة ${creditsAmount.toLocaleString()} رصيد إلى حسابك` : `${creditsAmount.toLocaleString()} credits have been added to your account`)
              : (isAr ? `خطة ${plan ? plan.name_ar : planSlug} أصبحت مفعّلة` : `Your ${plan ? plan.name_en : planSlug} plan is now active.`)}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-medium text-foreground">{isAr ? 'تأكيد الطلب' : 'Order confirmed'}</h3>
          <div className="space-y-2 text-sm">
            {isCredits ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الأرصدة' : 'Credits'}</span><span className="text-foreground">{creditsAmount.toLocaleString()}</span></div>
              </>
            ) : plan ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الخطة' : 'Plan'}</span><span className="text-foreground">{isAr ? plan.name_ar : plan.name_en}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الفوترة' : 'Billing'}</span><span className="text-foreground">{billingType === 'annual' ? (isAr ? 'سنوي' : 'Annual') : (isAr ? 'شهري' : 'Monthly')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المبلغ' : 'Amount'}</span><span className="text-foreground">${totalPrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الفوترة القادمة' : 'Next billing'}</span><span className="text-foreground">{nextBilling.toLocaleDateString()}</span></div>
              </>
            ) : null}
          </div>
          {profile?.email && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              {isAr ? `تم إرسال الإيصال إلى ${profile.email}` : `A receipt has been sent to ${profile.email}`}
            </p>
          )}
        </div>

        {!isCredits && plan && (
          <p className="text-sm font-medium text-primary text-center">
            ✓ {plan.credits_monthly.toLocaleString()} {isAr ? 'رصيد تمت إضافتها إلى حسابك' : 'credits have been added to your account'}
          </p>
        )}

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
