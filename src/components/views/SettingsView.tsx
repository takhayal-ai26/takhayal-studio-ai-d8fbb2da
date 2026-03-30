import { useApp, AspectRatio, Quality } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

const MOCK_TRANSACTIONS = [
  { date: '2026-03-28', description: 'Studio Plan — Monthly', amount: '$29.00', status: 'Paid' },
  { date: '2026-03-15', description: 'Credit Top-up — 500 credits', amount: '$8.00', status: 'Paid' },
  { date: '2026-02-28', description: 'Studio Plan — Monthly', amount: '$29.00', status: 'Paid' },
  { date: '2026-02-10', description: 'Credit Top-up — 100 credits', amount: '$1.60', status: 'Paid' },
  { date: '2026-01-28', description: 'Creator Plan — Monthly', amount: '$12.00', status: 'Paid' },
];

export function SettingsView() {
  const { userName, userEmail, aspectRatio, setAspectRatio, quality, setQuality, logout, credits, plan } = useApp();
  const { profile } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';
  const ratios: AspectRatio[] = ['1:1', '9:16', '16:9', '4:5'];
  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile');

  const planLabel = plan === 'free' ? 'Free' : plan === 'pro' ? 'Creator' : 'Studio';

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 max-w-2xl">
      <h1 className="text-xl font-medium text-foreground mb-4">{t.settingsView.title}</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-full bg-muted w-fit mb-6">
        <button onClick={() => setActiveTab('profile')} className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all ${activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          {isAr ? 'الملف الشخصي' : 'Profile'}
        </button>
        <button onClick={() => setActiveTab('billing')} className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all ${activeTab === 'billing' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          {isAr ? 'الفوترة' : 'Billing'}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary flex items-center justify-center text-lg font-medium text-foreground">{initials}</div>
              <div><p className="text-lg font-medium text-foreground">{userName}</p><p className="text-sm text-muted-foreground">{userEmail}</p></div>
            </div>
            <button className="mt-4 h-9 px-4 rounded-lg border border-border text-foreground text-[13px] font-medium hover:bg-muted transition-colors">{t.settingsView.editProfile}</button>
          </div>

          {/* Preferences */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">{t.settingsView.preferences}</h3>
            <div className="mb-4">
              <p className="text-[12px] text-muted-foreground mb-2">{t.settingsView.language}</p>
              <div className="flex gap-2">
                <button onClick={() => setLang('en')} className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>{t.settingsView.english}</button>
                <button onClick={() => setLang('ar')} className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>{t.settingsView.arabic}</button>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[12px] text-muted-foreground mb-2">{t.settingsView.defaultQuality}</p>
              <div className="flex gap-2">
                {(['standard', 'hd'] as Quality[]).map(q => (
                  <button key={q} onClick={() => setQuality(q)} className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${quality === q ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                    {q === 'standard' ? t.studio.standard : t.studio.hd}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground mb-2">{t.settingsView.defaultAspectRatio}</p>
              <div className="flex gap-2">
                {ratios.map(r => (<button key={r} onClick={() => setAspectRatio(r)} className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${aspectRatio === r ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>{r}</button>))}
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-card border border-destructive/20 rounded-xl p-6">
            <button onClick={logout} className="text-sm text-muted-foreground hover:text-destructive transition-colors">{t.settingsView.deleteAccount}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current plan */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-medium text-foreground">{planLabel} {isAr ? 'خطة' : 'Plan'}</h3>
                <p className="text-sm text-muted-foreground">{plan === 'free' ? (isAr ? 'مجاني' : 'Free forever') : (isAr ? 'تجدد شهرياً' : 'Renews monthly')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/pricing')} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-90 transition-all flex items-center gap-1">
                <ArrowUpRight size={14} /> {isAr ? 'ترقية الخطة' : 'Upgrade Plan'}
              </button>
            </div>
          </div>

          {/* Credit balance */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-foreground mb-1">{isAr ? 'رصيد الأرصدة' : 'Credit Balance'}</h3>
            <p className="text-3xl font-extralight text-foreground">{credits} <span className="text-sm text-muted-foreground">{isAr ? 'رصيد' : 'credits'}</span></p>
            <p className="text-sm text-muted-foreground mt-1">≈ {Math.floor(credits / 2)} {isAr ? 'صورة متبقية' : 'standard images'}</p>
            <button onClick={() => navigate('/credits')} className="mt-3 h-9 px-4 rounded-lg border border-border text-foreground text-[13px] font-medium hover:bg-muted transition-colors">
              {isAr ? 'شراء المزيد' : 'Buy More Credits'}
            </button>
          </div>

          {/* Payment method (placeholder) */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard size={20} className="text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-foreground">{isAr ? 'طريقة الدفع' : 'Payment Method'}</h3>
                <p className="text-sm text-muted-foreground">Visa {isAr ? 'تنتهي بـ' : 'ending in'} ••••4242</p>
              </div>
            </div>
            <button className="h-9 px-4 rounded-lg border border-border text-foreground text-[13px] font-medium hover:bg-muted transition-colors">
              {isAr ? 'تحديث البطاقة' : 'Update Card'}
            </button>
          </div>

          {/* Transaction history */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">{isAr ? 'سجل المعاملات' : 'Transaction History'}</h3>
            </div>
            <div className="divide-y divide-border">
              {MOCK_TRANSACTIONS.map((tx, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground">{tx.amount}</span>
                    <span className="text-[11px] font-medium bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
