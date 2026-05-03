import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAppTheme } from '@/context/AppThemeContext';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { ArrowUpRight, Copy, Loader2, Sun, Moon } from 'lucide-react';

const t_labels = {
  en: {
    title: 'Settings',
    profile: 'Profile',
    name: 'Name',
    username: 'Username',
    email: 'Email',
    birthday: 'Birthday',
    country: 'Country',
    saveChanges: 'Save Changes',
    saving: 'Saving…',
    saved: 'Changes saved',
    preferences: 'Preferences',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    billing: 'Billing',
    plan: 'Plan',
    credits: 'credits',
    upgradePlan: 'Upgrade Plan',
    buyCredits: 'Buy More Credits',
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',
    deleteWarning: 'This action is permanent and cannot be undone. All your data will be deleted.',
    deleteConfirm: 'Yes, Delete My Account',
    cancel: 'Cancel',
    uploadAvatar: 'Change photo',
    freeForever: 'Free forever',
    renewsMonthly: 'Renews monthly',
    standardImages: 'standard images',
    optional: 'Optional',
    paymentMethods: 'Payment Methods',
    balanceHistory: 'Balance History',
    referralProgram: 'Referral Program',
    referralRule: 'Earn bonus credits when an invited user signs up and completes their first payment.',
    referralReward: 'Reward rule: 50 bonus credits after the invited user completes their first paid checkout.',
    referralTodo: 'Reward tracking is UI-ready here; backend attribution will connect to checkout events.',
    copyInvite: 'Copy invite link',
    copiedInvite: 'Invite link copied',
    loadingHistory: 'Loading activity...',
    creditPurchase: 'Credit purchase',
    subscriptionActivation: 'Plan credits',
    generationUsage: 'Generation',
    notifications: 'Notifications',
    security: 'Security',
    privacy: 'Privacy',
    emptyState: 'No activity yet',
  },
  ar: {
    title: 'الإعدادات',
    profile: 'الملف الشخصي',
    name: 'الاسم',
    username: 'اسم المستخدم',
    email: 'البريد الإلكتروني',
    birthday: 'تاريخ الميلاد',
    country: 'الدولة',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ…',
    saved: 'تم حفظ التغييرات',
    preferences: 'التفضيلات',
    language: 'اللغة',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    billing: 'الفوترة',
    plan: 'الخطة',
    credits: 'رصيد',
    upgradePlan: 'ترقية الخطة',
    buyCredits: 'شراء المزيد',
    dangerZone: 'منطقة الخطر',
    deleteAccount: 'حذف الحساب',
    deleteWarning: 'هذا الإجراء دائم ولا يمكن التراجع عنه. سيتم حذف جميع بياناتك.',
    deleteConfirm: 'نعم، احذف حسابي',
    cancel: 'إلغاء',
    uploadAvatar: 'تغيير الصورة',
    freeForever: 'مجاني للأبد',
    renewsMonthly: 'يتجدد شهرياً',
    standardImages: 'صورة عادية',
    optional: 'اختياري',
    paymentMethods: 'طرق الدفع',
    balanceHistory: 'سجل الرصيد',
    referralProgram: 'برنامج الإحالة',
    referralRule: 'اكسب أرصدة إضافية عندما يسجل مستخدم مدعو ويكمل أول عملية دفع.',
    referralReward: 'قاعدة المكافأة: 50 رصيداً إضافياً بعد أن يكمل المستخدم المدعو أول عملية دفع.',
    referralTodo: 'واجهة الإحالة جاهزة؛ سيتم ربط تتبع المكافآت بأحداث الدفع لاحقاً.',
    copyInvite: 'نسخ رابط الدعوة',
    copiedInvite: 'تم نسخ رابط الدعوة',
    loadingHistory: 'جارٍ تحميل النشاط...',
    creditPurchase: 'شراء رصيد',
    subscriptionActivation: 'رصيد الخطة',
    generationUsage: 'توليد',
    notifications: 'الإشعارات',
    security: 'الأمان',
    privacy: 'الخصوصية',
    emptyState: 'لا يوجد نشاط بعد',
  },
};

const COUNTRIES = [
  'Kuwait', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Oman',
  'Jordan', 'Lebanon', 'Egypt', 'Iraq', 'Morocco', 'Tunisia', 'Algeria',
  'United States', 'United Kingdom', 'India', 'Pakistan', 'Philippines',
];

const REFERRAL_REWARD_CREDITS = 50;

type CreditLedgerEntry = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

type GenerationUsageEntry = {
  id: string;
  credits_used: number;
  created_at: string;
  model_id: string | null;
  tool_id: string | null;
  status: string;
};

type BalanceActivity = {
  id: string;
  label: string;
  detail: string | null;
  amount: number;
  createdAt: string;
};

type CreditLedgerQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

// Moved OUTSIDE component to prevent remounting on re-render (fixes focus loss bug)
function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 md:p-6 ${danger ? 'bg-destructive/5 border border-destructive/10' : 'bg-card/60 backdrop-blur-sm'}`}>
      <h2 className={`text-[13px] font-semibold uppercase tracking-wider mb-4 ${danger ? 'text-destructive/70' : 'text-muted-foreground/70'}`}>{title}</h2>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-full text-[13px] font-medium transition-all ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function SettingsView() {
  const { user, profile, refreshProfile } = useAuth();
  const { lang, setLang } = useLanguage();
  const { mode, toggleMode } = useAppTheme();
  const { credits, plan, logout } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAr = lang === 'ar';
  const l = t_labels[isAr ? 'ar' : 'en'];

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [balanceActivity, setBalanceActivity] = useState<BalanceActivity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load profile data ONCE
  useEffect(() => {
    if (profile && !profileLoaded) {
      setDisplayName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || null);
      setUsername((profile as any).username || '');
      setBirthday((profile as any).birthday || '');
      setCountry((profile as any).country || '');
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  const initials = (() => {
    const parts = displayName.trim().split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) || '' : '';
    if (first) return (first + last).toUpperCase();
    return 'U';
  })();

  const planLabel = plan === 'free' ? 'Free' : plan === 'pro' ? 'Creator' : 'Studio';
  const referralCode = user?.id ? `TKH-${user.id.slice(0, 8).toUpperCase()}` : 'TKH-CREATOR';
  const referralLink = `https://takhayal.ai/signup?ref=${referralCode}`;
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(isAr ? 'ar-KW' : 'en-US', { month: 'short', day: 'numeric' }),
    [isAr]
  );

  useEffect(() => {
    if (!user) {
      setBalanceActivity([]);
      return;
    }

    let isMounted = true;
    const loadBalanceActivity = async () => {
      setHistoryLoading(true);
      const fromUntyped = supabase.from as unknown as (table: string) => CreditLedgerQuery;

      const [ledgerResult, generationResult] = await Promise.all([
        fromUntyped('credit_ledger')
          .select('id, amount, reason, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('generation_logs')
          .select('id, credits_used, created_at, model_id, tool_id, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      if (!isMounted) return;

      const ledgerItems = ((ledgerResult.data as CreditLedgerEntry[] | null) || []).map((entry) => ({
        id: `ledger-${entry.id}`,
        label: entry.reason === 'subscription_activation' ? l.subscriptionActivation : l.creditPurchase,
        detail: entry.reason.replace(/_/g, ' '),
        amount: entry.amount,
        createdAt: entry.created_at,
      }));

      const usageItems = ((generationResult.data as GenerationUsageEntry[] | null) || [])
        .filter((entry) => (entry.credits_used || 0) > 0)
        .map((entry) => ({
          id: `generation-${entry.id}`,
          label: l.generationUsage,
          detail: entry.tool_id || entry.model_id || entry.status,
          amount: -entry.credits_used,
          createdAt: entry.created_at,
        }));

      setBalanceActivity(
        [...ledgerItems, ...usageItems]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6)
      );
      setHistoryLoading(false);
    };

    loadBalanceActivity().catch(() => {
      if (!isMounted) return;
      setBalanceActivity([]);
      setHistoryLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user, l.creditPurchase, l.generationUsage, l.subscriptionActivation]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: displayName.trim(),
          username: username.trim(),
          birthday: birthday || null,
          country: country.trim() || null,
        } as any)
        .eq('user_id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(l.saved);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase
        .from('profiles')
        .update({ avatar_url: newUrl } as any)
        .eq('user_id', user.id);
      setAvatarUrl(newUrl);
      await refreshProfile();
      toast.success(isAr ? 'تم تحديث الصورة' : 'Avatar updated');
    } catch {
      toast.error(isAr ? 'فشل رفع الصورة' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLanguageChange = async (newLang: 'en' | 'ar') => {
    setLang(newLang);
    if (user) {
      await supabase.from('profiles').update({ language: newLang } as any).eq('user_id', user.id);
    }
  };

  const handleThemeChange = (newMode: 'light' | 'dark') => {
    if (mode !== newMode) toggleMode();
    if (user) {
      supabase.from('profiles').update({ theme_preference: newMode } as any).eq('user_id', user.id);
    }
  };

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success(l.copiedInvite);
    } catch {
      toast.error(isAr ? 'تعذر نسخ الرابط' : 'Could not copy link');
    }
  };

  const inputClass = "w-full h-11 px-3 rounded-xl bg-muted/30 border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-xl mx-auto space-y-5">
        <h1 className="typo-heading-page">{l.title}</h1>

        {/* ── Profile ── */}
        <Section title={l.profile}>
          <div className="flex flex-col items-center md:flex-row md:items-start gap-5">
            {/* Avatar */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group shrink-0"
              disabled={uploading}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-border/30" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-foreground ring-2 ring-border/30">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <span className="text-[11px] text-white font-medium">{l.uploadAvatar}</span>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </button>

            {/* Fields */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">{l.name}</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                  placeholder={l.name}
                />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">{l.username} <span className="text-muted-foreground/40">({l.optional})</span></label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  placeholder={isAr ? 'مثال: peter_parker' : 'e.g. peter_parker'}
                />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">{l.email}</label>
                <div className="w-full h-11 px-3 rounded-xl bg-muted/10 flex items-center text-sm text-muted-foreground/60 select-none">
                  {profile?.email || user?.email || ''}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">{l.birthday} <span className="text-muted-foreground/40">({l.optional})</span></label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">{l.country} <span className="text-muted-foreground/40">({l.optional})</span></label>
                  <input
                    list="settings-country-options"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputClass}
                    placeholder={isAr ? 'مثال: السعودية' : 'e.g. Saudi Arabia'}
                  />
                  <datalist id="settings-country-options">
                    {COUNTRIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? l.saving : l.saveChanges}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Preferences ── */}
        <Section title={l.preferences}>
          <div className="space-y-4">
            <div>
              <p className="text-[12px] text-muted-foreground mb-2">{l.language}</p>
              <div className="flex gap-2">
                <Pill active={lang === 'en'} onClick={() => handleLanguageChange('en')}>English</Pill>
                <Pill active={lang === 'ar'} onClick={() => handleLanguageChange('ar')}>العربية</Pill>
              </div>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground mb-2">{l.theme}</p>
              <div className="flex gap-2">
                <Pill active={mode === 'light'} onClick={() => handleThemeChange('light')}>
                  <span className="flex items-center gap-1.5"><Sun size={14} /> {l.light}</span>
                </Pill>
                <Pill active={mode === 'dark'} onClick={() => handleThemeChange('dark')}>
                  <span className="flex items-center gap-1.5"><Moon size={14} /> {l.dark}</span>
                </Pill>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Billing ── */}
        <Section title={l.billing}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-foreground">{planLabel} {l.plan}</p>
                <p className="text-sm text-muted-foreground">
                  {plan === 'free' ? l.freeForever : l.renewsMonthly}
                </p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-90 transition-all flex items-center gap-1"
              >
                <ArrowUpRight size={14} /> {l.upgradePlan}
              </button>
            </div>
            <div className="h-px bg-border/20" />
            <div>
              <p className="text-sm font-medium text-foreground">{l.paymentMethods}</p>
              <p className="text-[13px] text-muted-foreground mt-1">{isAr ? 'ستظهر طرق الدفع المحفوظة هنا بعد أول عملية دفع.' : 'Saved payment methods will appear here after your first checkout.'}</p>
            </div>
            <div className="h-px bg-border/20" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-light text-foreground">{credits} <span className="text-sm text-muted-foreground">{l.credits}</span></p>
                <p className="text-[13px] text-muted-foreground">≈ {Math.floor(credits / 2)} {l.standardImages}</p>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="h-9 px-4 rounded-full bg-muted/40 text-foreground text-[13px] font-medium hover:bg-muted/60 transition-all"
              >
                {l.buyCredits}
              </button>
            </div>
            <div className="h-px bg-border/20" />
            <div>
              <p className="text-sm font-medium text-foreground">{l.balanceHistory}</p>
              {historyLoading ? (
                <p className="text-[13px] text-muted-foreground mt-1">{l.loadingHistory}</p>
              ) : balanceActivity.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {balanceActivity.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/20 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {dateFormatter.format(new Date(item.createdAt))}
                          {item.detail ? ` · ${item.detail}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[13px] font-semibold ${item.amount >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {item.amount >= 0 ? '+' : ''}{item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground mt-1">{l.emptyState}</p>
              )}
            </div>
            <div className="h-px bg-border/20" />
            <div>
              <p className="text-sm font-medium text-foreground">{l.referralProgram}</p>
              <p className="text-[13px] text-muted-foreground mt-1">{l.referralRule}</p>
              <p className="text-[12px] text-muted-foreground/80 mt-1">
                {l.referralReward.replace('50', REFERRAL_REWARD_CREDITS.toString())}
              </p>
              <div className="mt-3 rounded-xl bg-muted/25 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{isAr ? 'رابط الدعوة' : 'Invite link'}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="min-w-0 flex-1 text-[13px] font-medium text-foreground break-all">{referralLink}</p>
                  <button
                    onClick={handleCopyReferral}
                    className="min-h-11 min-w-11 shrink-0 rounded-lg bg-background/70 text-muted-foreground hover:text-foreground hover:bg-background transition-colors flex items-center justify-center"
                    aria-label={l.copyInvite}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground/70 mt-2">{l.referralTodo}</p>
            </div>
          </div>
        </Section>

        <Section title={l.notifications}>
          <p className="text-sm text-muted-foreground">{isAr ? 'سيتم عرض تفضيلات البريد والتنبيهات هنا.' : 'Email and notification preferences will appear here.'}</p>
        </Section>

        <Section title={l.security}>
          <p className="text-sm text-muted-foreground">{isAr ? 'إعدادات تسجيل الدخول والحساب ستظهر هنا.' : 'Login and account security settings will appear here.'}</p>
        </Section>

        <Section title={l.privacy}>
          <p className="text-sm text-muted-foreground">{isAr ? 'عناصر التحكم في الخصوصية والبيانات ستظهر هنا.' : 'Privacy and data controls will appear here.'}</p>
        </Section>

        {/* ── Danger Zone ── */}
        <Section title={l.dangerZone} danger>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              {l.deleteAccount}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-destructive/80">{l.deleteWarning}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { logout(); }}
                  className="h-9 px-4 rounded-full bg-destructive text-destructive-foreground text-[13px] font-medium"
                >
                  {l.deleteConfirm}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-9 px-4 rounded-full bg-muted/40 text-foreground text-[13px] font-medium"
                >
                  {l.cancel}
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
