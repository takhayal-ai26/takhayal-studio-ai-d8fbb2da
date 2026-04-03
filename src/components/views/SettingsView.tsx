import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAppTheme } from '@/context/AppThemeContext';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ArrowUpRight, Loader2, Sun, Moon, Monitor } from 'lucide-react';

const t_labels = {
  en: {
    title: 'Settings',
    profile: 'Profile',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    saveChanges: 'Save Changes',
    saving: 'Saving…',
    saved: 'Changes saved',
    preferences: 'Preferences',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
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
  },
  ar: {
    title: 'الإعدادات',
    profile: 'الملف الشخصي',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    email: 'البريد الإلكتروني',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ…',
    saved: 'تم حفظ التغييرات',
    preferences: 'التفضيلات',
    language: 'اللغة',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    system: 'تلقائي',
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
  },
};

export function SettingsView() {
  const { user, profile, refreshProfile } = useAuth();
  const { lang, setLang } = useLanguage();
  const { mode, toggleMode } = useAppTheme();
  const { credits, plan, logout } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAr = lang === 'ar';
  const l = t_labels[isAr ? 'ar' : 'en'];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load profile data — fallback: split full_name if first/last empty
  useEffect(() => {
    if (profile) {
      let fn = (profile as any).first_name || '';
      let ln = (profile as any).last_name || '';
      if (!fn && !ln && profile.full_name) {
        const parts = profile.full_name.trim().split(' ');
        fn = parts[0] || '';
        ln = parts.slice(1).join(' ') || '';
      }
      setFirstName(fn);
      setLastName(ln);
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const initials = (() => {
    const f = firstName?.charAt(0) || '';
    const la = lastName?.charAt(0) || '';
    if (f || la) return (f + la).toUpperCase();
    return profile?.full_name?.slice(0, 2).toUpperCase() || 'U';
  })();

  const planLabel = plan === 'free' ? 'Free' : plan === 'pro' ? 'Creator' : 'Studio';

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
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

  const Section = ({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) => (
    <div className={`rounded-2xl p-5 md:p-6 ${danger ? 'bg-destructive/5 border border-destructive/10' : 'bg-card/60 backdrop-blur-sm'}`}>
      <h2 className={`text-[13px] font-semibold uppercase tracking-wider mb-4 ${danger ? 'text-destructive/70' : 'text-muted-foreground/70'}`}>{title}</h2>
      {children}
    </div>
  );

  const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
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

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-xl mx-auto space-y-5">
        <h1 className="text-xl font-semibold text-foreground">{l.title}</h1>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">{l.firstName}</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-muted/30 border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder={l.firstName}
                  />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1 block">{l.lastName}</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-muted/30 border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder={l.lastName}
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground mb-1 block">{l.email}</label>
                <input
                  <div className="w-full h-11 px-3 rounded-xl bg-muted/10 flex items-center text-sm text-muted-foreground/60 select-none">
                    {profile?.email || user?.email || ''}
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-light text-foreground">{credits} <span className="text-sm text-muted-foreground">{l.credits}</span></p>
                <p className="text-[13px] text-muted-foreground">≈ {Math.floor(credits / 2)} {l.standardImages}</p>
              </div>
              <button
                onClick={() => navigate('/credits')}
                className="h-9 px-4 rounded-full bg-muted/40 text-foreground text-[13px] font-medium hover:bg-muted/60 transition-all"
              >
                {l.buyCredits}
              </button>
            </div>
          </div>
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