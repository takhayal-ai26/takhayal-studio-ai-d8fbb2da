import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useApp } from '@/context/AppContext';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function CreateHub() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { tools } = useToolsDB();
  const { setActivePage } = useApp();
  const isAr = lang === 'ar';

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? 'إنشاء' : 'Create'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'ابدأ الإنشاء فوراً' : 'Start creating instantly'}
          </p>
        </div>

        {/* Hero Card — Generate Image */}
        {heroTool && (
          <button
            onClick={() => handleToolClick(heroTool)}
            className="w-full rounded-3xl overflow-hidden relative group mb-4 text-left focus:outline-none active:scale-[0.98] transition-transform shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
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
              {/* Orange glow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-primary/20 blur-2xl rounded-full pointer-events-none" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Sparkles size={16} className="text-primary-foreground" />
                </div>
                <span className="text-xs font-medium text-white/60">
                  {heroTool.creditCost} {isAr ? 'رصيد' : 'credits'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{heroTool.name}</h2>
              <p className="text-sm text-white/60 mt-0.5">{heroTool.shortDesc}</p>
            </div>
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.08] group-hover:ring-primary/25 transition-all pointer-events-none" />
          </button>
        )}

        {/* Quick Action Tools — Image cards */}
        <div className="grid grid-cols-2 gap-3">
          {quickTools.map(tool => {
            const Icon = tool.icon;
            const hasImage = !!tool.image;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className="rounded-3xl overflow-hidden relative group text-left focus:outline-none active:scale-[0.97] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
              >
                <div className="aspect-[4/3] relative">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent" />
                </div>
                {/* Icon badge */}
                <div className="absolute top-3 left-3">
                  <div className="w-8 h-8 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center ring-1 ring-white/[0.08]">
                    <Icon size={15} className="text-white/80" />
                  </div>
                </div>
                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <h3 className="text-[13px] font-semibold text-white leading-tight">
                    {tool.name}
                  </h3>
                  <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">
                    {tool.shortDesc}
                  </p>
                </div>
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.06] group-hover:ring-white/15 transition-all pointer-events-none" />
              </button>
            );
          })}
        </div>

        {/* Explore more */}
        <button
          onClick={() => navigate('/tools')}
          className="flex items-center gap-1 mx-auto mt-6 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {isAr ? 'استكشف المزيد من الأدوات' : 'Explore more tools'}
          <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
        </button>
      </div>
    </div>
  );
}
