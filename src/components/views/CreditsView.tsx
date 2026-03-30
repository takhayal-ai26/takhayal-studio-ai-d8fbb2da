import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';

const PACKAGES = [
  { credits: 100, price: 1.60, label: 'Starter', labelAr: 'مبتدئ', images: 50, badge: null },
  { credits: 500, price: 8.00, label: 'Popular', labelAr: 'شائع', images: 250, badge: 'mostPopular' },
  { credits: 1000, price: 16.00, label: 'Pro', labelAr: 'محترف', images: 500, badge: null },
];

export function CreditsView() {
  const { credits } = useApp();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const [customCredits, setCustomCredits] = useState('');
  const customNum = parseInt(customCredits, 10) || 0;
  const customPrice = customNum * 0.016;

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 max-w-4xl">
      <h1 className="text-xl font-medium text-foreground mb-2">{isAr ? 'إضافة رصيد' : 'Top up credits'}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {isAr ? '1 رصيد = $0.016 · الأرصدة لا تنتهي صلاحيتها' : '1 credit = $0.016 · Credits never expire'}
      </p>

      {/* Balance card */}
      <div className="bg-card border-[1.5px] border-primary rounded-xl p-8 mb-8">
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{isAr ? 'رصيدك الحالي' : 'Your balance'}</p>
        <p className="text-[56px] font-extralight text-foreground leading-none mt-2">{credits} <span className="text-xl">{isAr ? 'رصيد' : 'credits'}</span></p>
        <p className="text-sm text-muted-foreground mt-2">≈ {Math.floor(credits / 2)} {isAr ? 'صورة متبقية' : 'standard images remaining'}</p>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {PACKAGES.map(pkg => (
          <div key={pkg.credits} className={`bg-card rounded-xl p-6 border relative ${pkg.badge ? 'border-primary' : 'border-border'}`}>
            {pkg.badge && (
              <span className="absolute -top-3 left-4 px-3 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground">
                {isAr ? 'الأكثر شعبية' : 'Most Popular'}
              </span>
            )}
            <p className="text-2xl font-medium text-foreground">{pkg.credits}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? 'رصيد' : 'credits'}</p>
            <p className="text-base font-light text-muted-foreground mt-2">${pkg.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">≈ {pkg.images} {isAr ? 'صورة' : 'images'}</p>
            <button
              onClick={() => navigate(`/checkout?credits=${pkg.credits}`)}
              className={`w-full h-10 rounded-lg text-[13px] font-medium mt-4 transition-colors ${pkg.badge ? 'bg-primary text-primary-foreground hover:brightness-90' : 'border border-border text-foreground hover:bg-muted'}`}
            >
              {isAr ? 'اشترِ الآن' : 'Buy Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Custom */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <p className="text-sm font-medium text-foreground mb-3">{isAr ? 'أدخل عدداً مخصصاً' : 'Need more? Enter custom amount'}</p>
        <div className="flex gap-3">
          <input
            type="number"
            value={customCredits}
            onChange={e => setCustomCredits(e.target.value)}
            placeholder={isAr ? 'عدد الأرصدة' : 'Credits'}
            min={10}
            className="flex-1 h-10 rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={() => customNum >= 10 && navigate(`/checkout?credits=${customNum}`)}
            disabled={customNum < 10}
            className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-90 transition-all disabled:opacity-40"
          >
            {customNum >= 10 ? `${isAr ? 'اشترِ' : 'Buy'} · $${customPrice.toFixed(2)}` : (isAr ? 'اشترِ أرصدة' : 'Buy Credits')}
          </button>
        </div>
      </div>

      {/* Legal */}
      <div className="text-center">
        <p className="text-[11px] text-muted-foreground">
          <a href="/terms" className="hover:text-foreground transition-colors">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</a>
          {' · '}
          <a href="/privacy" className="hover:text-foreground transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
        </p>
      </div>
    </div>
  );
}
