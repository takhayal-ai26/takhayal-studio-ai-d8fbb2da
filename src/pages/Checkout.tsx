import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LogoMark } from '@/components/Logo';
import { ArrowLeft, Lock, RotateCcw, Zap, CreditCard, Shield, Info, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePricingPlans } from '@/hooks/useBillingData';

const GCC_COUNTRIES = ['Kuwait', 'Saudi Arabia', 'UAE', 'Bahrain', 'Qatar', 'Oman'];
const OTHER_COUNTRIES = ['Egypt', 'Jordan', 'Lebanon', 'Iraq', 'Morocco', 'Tunisia', 'Other'];

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + ' / ' + digits.slice(2);
  return digits;
}

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

  const plan = plans.find((p: any) => p.slug === planSlug);

  const [billing, setBilling] = useState<'monthly' | 'annual'>(billingParam as any);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [country, setCountry] = useState('Kuwait');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user) navigate('/?auth=login', { replace: true });
  }, [user, navigate]);

  if (!plan && !isCreditsCheckout) {
    if (plans.length === 0) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
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
  const creditPrice = isCreditsCheckout ? parseFloat(priceParam || '0') : 0;

  const monthlyPrice = plan ? (billing === 'annual' ? plan.price_annual_monthly_equivalent : plan.price_monthly_usd) : 0;
  const totalPrice = isCreditsCheckout ? creditPrice : (billing === 'annual' ? plan!.price_annual_usd : plan!.price_monthly_usd);
  const annualSavings = plan ? ((plan.price_monthly_usd * 12) - plan.price_annual_usd) : 0;

  const displayName = isCreditsCheckout 
    ? `${creditsNum.toLocaleString()} ${isAr ? 'رصيد' : 'Credits'}` 
    : (isAr ? plan!.name_ar : plan!.name_en);

  const features: Array<{en: string; ar: string}> = plan?.features || [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cardName.trim()) e.cardName = 'Required';
    if (cardNumber.replace(/\s/g, '').length !== 16) e.cardNumber = 'Must be 16 digits';
    const expiryDigits = expiry.replace(/\D/g, '');
    if (expiryDigits.length !== 4) e.expiry = 'Invalid format';
    if (cvv.length !== 3) e.cvv = 'Must be 3 digits';
    if (!city.trim()) e.city = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setProcessing(true);
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / 2500) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        const successParams = isCreditsCheckout
          ? `?type=credits&amount=${creditsNum}`
          : `?plan=${planSlug}&billing=${billing}`;
        navigate(`/checkout/success${successParams}`, { replace: true });
      }
    }, 50);
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="animate-pulse"><LogoMark size={48} /></div>
          <div>
            <p className="text-foreground text-lg font-medium">{isAr ? 'جاري معالجة الدفع...' : 'Processing your payment...'}</p>
            <p className="text-muted-foreground text-sm mt-1">{isAr ? 'يرجى عدم إغلاق هذه الصفحة' : 'Please do not close this page'}</p>
          </div>
          <div className="w-64 mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    );
  }

  const inputCls = (field: string) =>
    `w-full h-12 rounded-lg border px-4 text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors ${errors[field] ? 'border-red-500' : 'border-border'}`;

  return (
    <div className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/pricing')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} />
          {isAr ? 'العودة للأسعار' : 'Back to Pricing'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* LEFT — Order Summary */}
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

            {/* Plan card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">{displayName} {!isCreditsCheckout && (isAr ? 'خطة' : 'Plan')}</h3>
                  {isCreditsCheckout && <p className="text-sm text-muted-foreground mt-1">{isAr ? 'الأرصدة لا تنتهي صلاحيتها' : 'Credits never expire'}</p>}
                </div>
                <div className="text-right">
                  {billing === 'annual' && !isCreditsCheckout && (
                    <span className="text-sm text-muted-foreground line-through">${plan!.price_monthly_usd}/mo</span>
                  )}
                  <p className="text-2xl font-medium text-foreground">
                    ${isCreditsCheckout ? creditPrice.toFixed(2) : monthlyPrice.toFixed(2)}
                    {!isCreditsCheckout && <span className="text-sm text-muted-foreground">/{isAr ? 'شهر' : 'mo'}</span>}
                  </p>
                </div>
              </div>
              {!isCreditsCheckout && features.length > 0 && (
                <ul className="space-y-2 pt-4 border-t border-border">
                  {features.map((f: any, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check size={14} className="text-primary" /> {isAr ? f.ar : f.en}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Order breakdown */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-medium text-foreground">{isAr ? 'ملخص الطلب' : 'Order Summary'}</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{displayName} {!isCreditsCheckout && `(${billing === 'annual' ? (isAr ? 'سنوي' : 'Annual') : (isAr ? 'شهري' : 'Monthly')})`}</span>
                <span className="text-foreground">${totalPrice.toFixed(2)}</span>
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
                <span className="text-foreground">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {[
                { icon: Lock, label: isAr ? 'دفع آمن' : 'Secure checkout' },
                { icon: RotateCcw, label: isAr ? 'إلغاء في أي وقت' : 'Cancel anytime' },
                { icon: Zap, label: isAr ? 'وصول فوري' : 'Instant access' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon size={14} /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — Payment Form */}
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

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{isAr ? 'بيانات البطاقة' : 'Card details'}</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{isAr ? 'الاسم على البطاقة' : 'Name on card'}</label>
                <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder={isAr ? 'كما يظهر على البطاقة' : 'As it appears on card'} className={inputCls('cardName')} />
                {errors.cardName && <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{isAr ? 'رقم البطاقة' : 'Card number'}</label>
                <div className="relative">
                  <input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="1234 5678 9012 3456" className={inputCls('cardNumber')} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2"><CreditCard size={18} className="text-muted-foreground" /></div>
                </div>
                {errors.cardNumber && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{isAr ? 'تاريخ الانتهاء' : 'Expiry date'}</label>
                  <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM / YY" className={inputCls('expiry')} />
                  {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    CVV
                    <Tooltip>
                      <TooltipTrigger asChild><Info size={12} className="text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>{isAr ? 'الرقم المكون من 3 أرقام خلف البطاقة' : '3-digit code on back of card'}</TooltipContent>
                    </Tooltip>
                  </label>
                  <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="123" className={inputCls('cvv')} />
                  {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{isAr ? 'عنوان الفوترة' : 'Billing address'}</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{isAr ? 'الدولة' : 'Country'}</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className={`${inputCls('country')} appearance-none`}>
                  {GCC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option disabled>───</option>
                  {OTHER_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{isAr ? 'المدينة' : 'City'}</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder={isAr ? 'المدينة' : 'City'} className={inputCls('city')} />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={!cardName || !cardNumber || !expiry || !cvv || !city}
              className="w-full h-[52px] rounded-[10px] bg-primary text-primary-foreground text-base font-medium hover:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCreditsCheckout
                ? `${isAr ? 'ادفع' : 'Pay'} $${creditPrice.toFixed(2)}`
                : `${isAr ? 'ادفع' : 'Pay'} $${totalPrice.toFixed(2)} / ${billing === 'annual' ? (isAr ? 'سنة' : 'year') : (isAr ? 'شهر' : 'month')}`}
            </button>

            <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Shield size={12} />
              {isAr ? 'تشفير SSL 256-بت · لا يتم تخزين بيانات الدفع أبداً' : '256-bit SSL encrypted · Your payment info is never stored'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
