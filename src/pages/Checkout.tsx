import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LogoMark } from '@/components/Logo';
import { AlertCircle, ArrowLeft, Check, Lock, RotateCcw, Shield, Zap } from 'lucide-react';
import { usePricingPlans, type PricingPlan } from '@/hooks/useBillingData';
import { supabase, supabaseConfigMissing } from '@/integrations/supabase/client';

const GCC_COUNTRIES = ['Kuwait', 'Saudi Arabia', 'UAE', 'Bahrain', 'Qatar', 'Oman'];
const OTHER_COUNTRIES = ['Egypt', 'Jordan', 'Lebanon', 'Iraq', 'Morocco', 'Tunisia', 'Other'];

type PaymentCheckoutResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  order_id?: string;
  checkout_url?: string;
  provider?: string;
};

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const { data: plans = [] } = usePricingPlans();

  const planSlug = params.get('plan') || '';
  const creditsParam = params.get('credits');
  const priceParam = params.get('price');
  const isCreditsCheckout = !!creditsParam;
  const billingParam = params.get('billing') || 'monthly';

  const plan = plans.find((p: PricingPlan) => p.slug === planSlug);

  const [billing, setBilling] = useState<'monthly' | 'annual'>(billingParam === 'annual' ? 'annual' : 'monthly');
  const [country, setCountry] = useState('Kuwait');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [paymentUnavailable, setPaymentUnavailable] = useState(false);

  useEffect(() => {
    if (!user) navigate('/?auth=login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    setGatewayMessage('');
    setCreatedOrderId('');
    setPaymentUnavailable(false);
  }, [planSlug, creditsParam, billing]);

  if (!plan && !isCreditsCheckout) {
    if (plans.length === 0) {
      return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-lg mb-4">Invalid plan selected</p>
          <button onClick={() => navigate('/pricing')} className="text-primary hover:underline">← Back to Pricing</button>
        </div>
      </div>
    );
  }

  const creditsNum = isCreditsCheckout ? parseInt(creditsParam!, 10) : 0;
  const displayedCreditPrice = isCreditsCheckout ? parseFloat(priceParam || '0') : 0;
  const monthlyPrice = plan ? (billing === 'annual' ? plan.price_annual_monthly_equivalent : plan.price_monthly_usd) : 0;
  const totalPrice = isCreditsCheckout ? displayedCreditPrice : (billing === 'annual' ? plan!.price_annual_usd : plan!.price_monthly_usd);
  const annualSavings = plan ? ((plan.price_monthly_usd * 12) - plan.price_annual_usd) : 0;

  const displayName = isCreditsCheckout
    ? `${creditsNum.toLocaleString()} ${isAr ? 'رصيد' : 'Credits'}`
    : (isAr ? plan!.name_ar : plan!.name_en);

  const features: Array<{en: string; ar: string}> = plan?.features || [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!city.trim()) e.city = isAr ? 'مطلوب' : 'Required';
    if (isCreditsCheckout && (!Number.isFinite(creditsNum) || creditsNum <= 0)) e.credits = 'Invalid credits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    if (supabaseConfigMissing) {
      setPaymentUnavailable(true);
      setGatewayMessage(
        isAr
          ? 'الدفع غير متاح حالياً لأن إعدادات الاتصال الأساسية غير مكتملة. الرجاء المحاولة لاحقاً أو التواصل معنا.'
          : 'Checkout is not available yet because the platform connection is not configured. Please try again later or contact us.'
      );
      return;
    }

    setProcessing(true);
    setGatewayMessage('');
    setCreatedOrderId('');

    const origin = window.location.origin;
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-checkout', {
        body: isCreditsCheckout
          ? {
              product_type: 'credits',
              credits: creditsNum,
              success_url: `${origin}/checkout/success`,
              cancel_url: `${origin}/checkout?credits=${creditsNum}`,
            }
          : {
              product_type: 'subscription',
              plan_slug: planSlug,
              billing_period: billing,
              success_url: `${origin}/checkout/success`,
              cancel_url: `${origin}/checkout?plan=${planSlug}&billing=${billing}`,
            },
      });

      const response = data as PaymentCheckoutResponse | null;
      if (error && response?.error !== 'payment_gateway_not_configured') {
        setGatewayMessage(isAr ? 'تعذر إنشاء طلب الدفع. حاول مرة أخرى.' : 'Could not create the payment order. Please try again.');
        return;
      }

      if (response?.checkout_url) {
        window.location.assign(response.checkout_url);
        return;
      }

      if (response?.error === 'payment_gateway_not_configured' || response?.order_id) {
        if (response?.order_id) setCreatedOrderId(response.order_id);
        setPaymentUnavailable(true);
        setGatewayMessage(
          isAr
            ? 'الدفع غير متاح حالياً. لن يتم تحصيل أي مبلغ، وسنفعّل checkout بمجرد اكتمال ربط بوابة الدفع.'
            : 'Checkout is not available yet. You have not been charged, and payment will be enabled once the gateway connection is complete.'
        );
        return;
      }

      setGatewayMessage(isAr ? 'لم نستطع فتح صفحة الدفع. حاول مرة أخرى.' : 'We could not open the payment page. Please try again.');
    } catch {
      setGatewayMessage(isAr ? 'حدث خطأ أثناء تجهيز الدفع. حاول مرة أخرى.' : 'Something went wrong while preparing checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full h-12 rounded-lg border px-4 text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors ${errors[field] ? 'border-red-500' : 'border-border'}`;

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="animate-pulse"><LogoMark size={48} /></div>
          <div>
            <p className="text-foreground text-lg font-medium">{isAr ? 'جاري تجهيز الدفع...' : 'Preparing secure payment...'}</p>
            <p className="text-muted-foreground text-sm mt-1">{isAr ? 'سيتم تحويلك إلى بوابة الدفع' : 'You will be redirected to the payment gateway'}</p>
          </div>
          <div className="w-64 mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/pricing')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} />
          {isAr ? 'العودة للأسعار' : 'Back to Pricing'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-[28px] font-medium text-foreground">{isAr ? 'أكمل طلبك' : 'Complete your order'}</h1>

            {!isCreditsCheckout && (
              <div className="flex p-1 rounded-full bg-muted w-fit">
                <button onClick={() => setBilling('monthly')} className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all ${billing === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {isAr ? 'شهري' : 'Monthly'}
                </button>
                <button onClick={() => setBilling('annual')} className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {isAr ? 'سنوي' : 'Annual'}
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">{isAr ? 'وفر 20%' : 'Save 20%'}</span>
                </button>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">{displayName} {!isCreditsCheckout && (isAr ? 'خطة' : 'Plan')}</h3>
                  {isCreditsCheckout && <p className="text-sm text-muted-foreground mt-1">{isAr ? 'الأرصدة لا تنتهي صلاحيتها' : 'Credits never expire'}</p>}
                </div>
                {!isCreditsCheckout && (
                  <div className="text-right">
                    {billing === 'annual' && <span className="text-sm text-muted-foreground line-through">${plan!.price_monthly_usd}/mo</span>}
                    <p className="text-2xl font-medium text-foreground">
                      ${monthlyPrice.toFixed(2)}
                      <span className="text-sm text-muted-foreground">/{isAr ? 'شهر' : 'mo'}</span>
                    </p>
                  </div>
                )}
              </div>
              {!isCreditsCheckout && features.length > 0 && (
                <ul className="space-y-2 pt-4 border-t border-border">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check size={14} className="text-primary" /> {isAr ? f.ar : f.en}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-medium text-foreground">{isAr ? 'ملخص الطلب' : 'Order Summary'}</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{displayName} {!isCreditsCheckout && `(${billing === 'annual' ? (isAr ? 'سنوي' : 'Annual') : (isAr ? 'شهري' : 'Monthly')})`}</span>
                <span className="text-foreground">{totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : (isAr ? 'من باقة الأرصدة' : 'From credit package')}</span>
              </div>
              {billing === 'annual' && !isCreditsCheckout && annualSavings > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{isAr ? 'ما يعادل' : 'Equivalent to'}</span>
                    <span>${monthlyPrice.toFixed(2)}/{isAr ? 'شهر' : 'month'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary">
                    <span>{isAr ? 'توفيرك' : 'You save'}</span>
                    <span>${annualSavings.toFixed(2)} {isAr ? 'مقارنة بالشهري' : 'vs monthly'}</span>
                  </div>
                </>
              )}
              <div className="border-t border-border pt-3 flex justify-between text-sm font-medium">
                <span className="text-foreground">{isAr ? 'المجموع المستحق اليوم' : 'Total due today'}</span>
                <span className="text-foreground">{totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : (isAr ? 'يحسب من الباقة' : 'Calculated from package')}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {[
                { icon: Lock, label: isAr ? 'دفع آمن' : 'Secure checkout' },
                { icon: RotateCcw, label: isAr ? 'إلغاء في أي وقت' : 'Cancel anytime' },
                { icon: Zap, label: isAr ? 'وصول فوري بعد الدفع' : 'Instant access after payment' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon size={14} /> {label}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-medium text-foreground">{isAr ? 'تفاصيل الدفع' : 'Payment details'}</h2>

            {profile && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-medium text-foreground">
                  {(profile.full_name || profile.email)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Shield size={18} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{isAr ? 'سيتم الدفع خارج تخيّل' : 'Payment will happen off-site'}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {isAr
                      ? 'لن نجمع أو نخزن بيانات البطاقة داخل التطبيق. بعد ربط بوابة الدفع سيتم تحويلك إلى صفحة دفع آمنة.'
                      : 'We do not collect or store card details in the app. After the gateway is connected, you will be redirected to a secure hosted payment page.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{isAr ? 'عنوان الفوترة' : 'Billing address'}</p>
              <div>
                <label htmlFor="checkout-country" className="text-xs text-muted-foreground mb-1.5 block">{isAr ? 'الدولة' : 'Country'}</label>
                <select id="checkout-country" value={country} onChange={e => setCountry(e.target.value)} className={`${inputCls('country')} appearance-none`}>
                  {GCC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option disabled>---</option>
                  {OTHER_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="checkout-city" className="text-xs text-muted-foreground mb-1.5 block">{isAr ? 'المدينة' : 'City'}</label>
                <input id="checkout-city" value={city} onChange={e => setCity(e.target.value)} placeholder={isAr ? 'المدينة' : 'City'} className={inputCls('city')} aria-invalid={!!errors.city} aria-describedby={errors.city ? 'checkout-city-error' : undefined} />
                {errors.city && <p id="checkout-city-error" className="text-xs text-destructive mt-1">{errors.city}</p>}
              </div>
            </div>

            {gatewayMessage && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 text-amber-500" />
                  <div>
                    <p>{gatewayMessage}</p>
                    {createdOrderId && <p className="mt-1 text-xs text-muted-foreground">{isAr ? 'رقم مرجعي' : 'Reference'}: {createdOrderId}</p>}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!city.trim() || paymentUnavailable}
              className="w-full h-[52px] rounded-[10px] bg-primary text-primary-foreground text-base font-medium hover:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {paymentUnavailable ? (isAr ? 'الدفع غير متاح حالياً' : 'Checkout unavailable') : (isAr ? 'المتابعة للدفع' : 'Continue to payment')}
            </button>

            <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Shield size={12} />
              {isAr ? 'تتم معالجة الدفع عبر بوابة دفع آمنة' : 'Payments are processed by a secure payment gateway'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
