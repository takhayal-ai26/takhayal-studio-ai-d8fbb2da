import { useApp, AspectRatio, Quality } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';

export function SettingsView() {
  const { userName, userEmail, aspectRatio, setAspectRatio, quality, setQuality, logout } = useApp();
  const { t, lang, setLang } = useLanguage();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';
  const ratios: AspectRatio[] = ['1:1', '9:16', '16:9', '4:5'];

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 max-w-2xl">
      <h1 className="text-xl font-medium text-foreground mb-6">{t.settingsView.title}</h1>
      <div className="bg-card border border-surface-border rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary flex items-center justify-center text-lg font-medium text-foreground">{initials}</div>
          <div><p className="text-lg font-medium text-foreground">{userName}</p><p className="text-sm text-muted-foreground">{userEmail}</p></div>
        </div>
        <button className="mt-4 h-9 px-4 rounded-lg border border-surface-border text-foreground text-[13px] font-medium hover:bg-card transition-colors">{t.settingsView.editProfile}</button>
      </div>
      <div className="bg-card border border-surface-border rounded-xl p-6 mb-4">
        <h3 className="text-sm font-medium text-foreground mb-4">{t.settingsView.preferences}</h3>
        <div className="mb-4">
          <p className="text-[12px] text-muted-foreground mb-2">{t.settingsView.language}</p>
          <div className="flex gap-2">
            <button onClick={() => setLang('en')} className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'bg-card border border-surface-border text-muted-foreground'}`}>{t.settingsView.english}</button>
            <button onClick={() => setLang('ar')} className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'bg-card border border-surface-border text-muted-foreground'}`}>{t.settingsView.arabic}</button>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-[12px] text-muted-foreground mb-2">{t.settingsView.defaultQuality}</p>
          <div className="flex gap-2">
            {(['standard', 'hd'] as Quality[]).map(q => (
              <button key={q} onClick={() => setQuality(q)} className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${quality === q ? 'bg-primary text-primary-foreground' : 'bg-card border border-surface-border text-muted-foreground'}`}>
                {q === 'standard' ? t.studio.standard : t.studio.hd}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground mb-2">{t.settingsView.defaultAspectRatio}</p>
          <div className="flex gap-2">
            {ratios.map(r => (<button key={r} onClick={() => setAspectRatio(r)} className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${aspectRatio === r ? 'bg-primary text-primary-foreground' : 'bg-card border border-surface-border text-muted-foreground'}`}>{r}</button>))}
          </div>
        </div>
      </div>
      <div className="bg-card border border-destructive/20 rounded-xl p-6">
        <button onClick={logout} className="text-sm text-muted-foreground hover:text-destructive transition-colors">{t.settingsView.deleteAccount}</button>
      </div>
    </div>
  );
}
