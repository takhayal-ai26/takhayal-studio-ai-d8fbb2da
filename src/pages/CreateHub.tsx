import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useApp } from '@/context/AppContext';
import { Sparkles, Film } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Tab = 'image' | 'video';

export default function CreateHub() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { tools } = useToolsDB();
  const { setActivePage } = useApp();
  const isAr = lang === 'ar';
  const [tab, setTab] = useState<Tab>('image');

  const heroTool = tools.find(t => t.slug === 'generate');
  const quickTools = tools.filter(t => t.slug !== 'generate');

  const handleToolClick = (tool: typeof tools[0]) => {
    if (tool.slug === 'generate') {
      setActivePage('canvas');
      navigate('/studio');
      return;
    }
    navigate(`/tools/${tool.slug}`);
  };

  return (
    <div
      className="flex-1 overflow-y-auto animate-page-enter pb-24"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
    >
      <div className="max-w-lg mx-auto px-5 pt-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="typo-heading-page">
            {isAr ? 'إنشاء' : 'Create'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'ابدأ الإنشاء فوراً' : 'Start creating instantly'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-muted/30 mb-5 w-fit mx-auto">
          {(['image', 'video'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200',
                tab === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'image'
                ? (isAr ? 'صورة' : 'Image')
                : (isAr ? 'فيديو' : 'Video')}
            </button>
          ))}
        </div>

        {/* Image Tab */}
        <div className={cn('transition-opacity duration-200', tab === 'image' ? 'opacity-100' : 'opacity-0 hidden')}>
          {/* Hero Card — Generate Image */}
          {heroTool && (
            <button
              onClick={() => handleToolClick(heroTool)}
              className="w-full rounded-3xl overflow-hidden relative group mb-4 focus:outline-none active:scale-[0.98] transition-transform shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
              style={{ textAlign: isAr ? 'right' : 'left' }}
            >
              <div className="aspect-[2/1] relative">
                {heroTool.image ? (
                  <img
                    src={heroTool.image}
                    alt={heroTool.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                    <Sparkles size={48} className="text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2 className="text-xl font-bold text-white">{heroTool.name}</h2>
                <p className="text-sm text-white/60 mt-0.5">{heroTool.shortDesc}</p>
              </div>
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.08] group-hover:ring-primary/25 transition-all pointer-events-none" />
            </button>
          )}

          {/* Quick Action Tools */}
          <div className="grid grid-cols-2 gap-3">
            {quickTools.map(tool => {
              const Icon = tool.icon;
              const hasImage = !!tool.image;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className="rounded-3xl overflow-hidden relative group focus:outline-none active:scale-[0.97] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                  style={{ textAlign: isAr ? 'right' : 'left' }}
                >
                  <div className="aspect-square relative">
                    {hasImage ? (
                      <img
                        src={tool.image}
                        alt={tool.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/15 via-muted/20 to-background flex items-center justify-center">
                        <Icon size={36} className="text-primary/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-[15px] font-bold text-white leading-tight">{tool.name}</h3>
                    <p className="text-[12px] text-white/55 mt-1 line-clamp-1">{tool.shortDesc}</p>
                  </div>
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.06] group-hover:ring-white/15 transition-all pointer-events-none" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Tab */}
        <div className={cn('transition-opacity duration-200', tab === 'video' ? 'opacity-100' : 'opacity-0 hidden')}>
          <button
            onClick={() => navigate('/video')}
            className="w-full rounded-3xl overflow-hidden relative group focus:outline-none active:scale-[0.98] transition-transform shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
            style={{ textAlign: isAr ? 'right' : 'left' }}
          >
            <div className="aspect-[2/1] relative">
              <div className="w-full h-full bg-gradient-to-br from-primary/25 via-muted/15 to-background flex items-center justify-center">
                <Film size={56} className="text-primary/25" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="text-xl font-bold text-white">
                {isAr ? 'إنشاء فيديو' : 'Create Video'}
              </h2>
              <p className="text-sm text-white/60 mt-0.5">
                {isAr ? 'أنشئ فيديوهات من نص أو صورة' : 'Generate videos from text or image'}
              </p>
            </div>
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.08] group-hover:ring-primary/25 transition-all pointer-events-none" />
          </button>

          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            {isAr ? 'المزيد من أدوات الفيديو قريباً' : 'More video tools coming soon'}
          </p>
        </div>
      </div>
    </div>
  );
}
