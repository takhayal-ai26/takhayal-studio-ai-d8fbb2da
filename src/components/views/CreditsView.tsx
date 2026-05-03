import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';

const PACKAGES = [
  { credits: 100, price: 1.60, label: 'Starter', labelAr: 'مبتدئ', images: 50, videos: '2 short clips', videosAr: 'مقطعين قصيرين', badge: null },
  { credits: 300, price: 4.80, label: 'Creator', labelAr: 'صانع محتوى', images: 150, videos: '6 short clips', videosAr: '6 مقاطع قصيرة', badge: null },
  { credits: 750, price: 12.00, label: 'Pro', labelAr: 'محترف', images: 375, videos: '15 short clips', videosAr: '15 مقطع قصير', badge: 'mostPopular' },
  { credits: 1500, price: 24.00, label: 'Studio', labelAr: 'استوديو', images: 750, videos: '30 short clips', videosAr: '30 مقطع قصير', badge: null },
  { credits: 3000, price: 48.00, label: 'Power', labelAr: 'مكثف', images: 1500, videos: '60 short clips', videosAr: '60 مقطع قصير', badge: null },
];

export function CreditsView() {
  const { credits } = useApp();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 max-w-4xl">
      <h1 className="typo-heading-page mb-2">{isAr ? 'إضافة رصيد' : 'Top up credits'}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {isAr ? 'اختر باقة جاهزة تناسب الصور والفيديو.' : 'Choose a ready-made package for images and videos.'}
      </p>

      {/* Balance card */}
      <div className="bg-card border-[1.5px] border-primary rounded-xl p-8 mb-8">
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{isAr ? 'رصيدك الحالي' : 'Your balance'}</p>
        <p className="text-[56px] font-extralight text-foreground leading-none mt-2">{credits} <span className="text-xl">{isAr ? 'رصيد' : 'credits'}</span></p>
        <p className="text-sm text-muted-foreground mt-2">≈ {Math.floor(credits / 2)} {isAr ? 'صورة متبقية' : 'standard images remaining'}</p>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
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
            <p className="text-xs text-muted-foreground">≈ {pkg.images} {isAr ? 'صورة قياسية' : 'standard images'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? `أو ${pkg.videosAr} حسب النموذج والمدة` : `Or ${pkg.videos} depending on model and duration`}
            </p>
            <button
              onClick={() => navigate(`/checkout?credits=${pkg.credits}&price=${pkg.price}`)}
              className={`w-full h-10 rounded-lg text-[13px] font-medium mt-4 transition-colors ${pkg.badge ? 'bg-primary text-primary-foreground hover:brightness-90' : 'border border-border text-foreground hover:bg-muted'}`}
            >
              {isAr ? 'اشترِ الآن' : 'Buy Now'}
            </button>
          </div>
        ))}
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
