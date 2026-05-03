import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LogoMark } from '@/components/Logo';
import { AlertCircle, ArrowRight, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type PaymentOrder = {
  id: string;
  product_type: 'subscription' | 'credits';
  plan_slug: string | null;
  credits: number;
  billing_period: string | null;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  fulfilled_at: string | null;
};

type PaymentOrderQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      single: () => Promise<{ data: unknown; error: unknown }>;
    };
  };
};

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const orderId = params.get('order') || '';
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    const fromUntyped = supabase.from as unknown as (table: string) => PaymentOrderQuery;
    fromUntyped('payment_orders')
      .select('id, product_type, plan_slug, credits, billing_period, amount, currency, status, paid_at, fulfilled_at')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        setOrder((data as PaymentOrder) || null);
        setLoading(false);
      });
  }, [orderId]);

  const isVerified = order?.status === 'paid' && !!order.fulfilled_at;
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + (order?.billing_period === 'annual' ? 365 : 30));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[480px] space-y-6">
        <div className="flex justify-center mb-2"><LogoMark size={32} /></div>

        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-scale-in ${isVerified ? 'bg-primary/10' : 'bg-amber-500/10'}`}>
            {isVerified ? (
              <Check size={28} className="text-primary" strokeWidth={3} />
            ) : (
              <AlertCircle size={28} className="text-amber-500" strokeWidth={2.5} />
            )}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-[28px] font-medium text-foreground">
            {loading
              ? (isAr ? 'جاري التحقق من الطلب' : 'Verifying your order')
              : isVerified
                ? (isAr ? 'تم تفعيل طلبك' : 'Your order is active')
                : (isAr ? 'لم يتم تأكيد الدفع بعد' : 'Payment is not confirmed yet')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {loading
              ? (isAr ? 'لحظة واحدة...' : 'One moment...')
              : isVerified
                ? (order?.product_type === 'credits'
                    ? (isAr ? `تم إضافة ${order.credits.toLocaleString()} رصيد إلى حسابك` : `${order.credits.toLocaleString()} credits have been added to your account`)
                    : (isAr ? `خطة ${order?.plan_slug || ''} أصبحت مفعّلة` : `Your ${order?.plan_slug || ''} plan is now active.`))
                : (isAr ? 'سيتم تفعيل الطلب بعد تأكيد بوابة الدفع عبر الخادم.' : 'The order will activate only after the gateway confirms payment server-side.')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-medium text-foreground">{isAr ? 'حالة الطلب' : 'Order status'}</h3>
          {order ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'رقم الطلب' : 'Order'}</span><span className="text-foreground font-mono text-xs">{order.id.slice(0, 8)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الحالة' : 'Status'}</span><span className="text-foreground capitalize">{order.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المبلغ' : 'Amount'}</span><span className="text-foreground">{order.currency} {Number(order.amount).toFixed(2)}</span></div>
              {order.product_type === 'credits' ? (
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الأرصدة' : 'Credits'}</span><span className="text-foreground">{order.credits.toLocaleString()}</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الخطة' : 'Plan'}</span><span className="text-foreground">{order.plan_slug}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الفوترة القادمة' : 'Next billing'}</span><span className="text-foreground">{formatDate(nextBilling, isAr)}</span></div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isAr ? 'لا يوجد رقم طلب صالح في الرابط.' : 'No valid order ID was provided.'}
            </p>
          )}
          {profile?.email && isVerified && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              {isAr ? `سيتم إرسال الإيصال إلى ${profile.email}` : `A receipt will be sent to ${profile.email}`}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/studio')}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground text-[15px] font-medium hover:brightness-90 transition-all flex items-center justify-center gap-2"
        >
          {isAr ? 'العودة للاستوديو' : 'Back to Studio'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
