import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToolsDB } from '@/hooks/useToolsDB';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function CreateHub() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { tools } = useToolsDB();
  const isAr = lang === 'ar';

  // "generate" is the hero tool; rest are quick actions
  const heroTool = tools.find(t => t.slug === 'generate');
  const quickTools = tools.filter(t => t.slug !== 'generate');

  const handleToolClick = (tool: typeof tools[0]) => {
    navigate(tool.slug === 'generate' ? '/studio' : `/tools/${tool.slug}`);
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
            className="w-full rounded-2xl overflow-hidden relative group mb-4 text-left focus:outline-none active:scale-[0.98] transition-transform"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-primary/90 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary-foreground" />
                </div>
                <span className="text-xs font-medium text-white/60">
                  {heroTool.creditCost} {isAr ? 'رصيد' : 'credits'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{heroTool.name}</h2>
              <p className="text-sm text-white/60 mt-0.5">{heroTool.shortDesc}</p>
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06] group-hover:ring-primary/20 transition-all pointer-events-none" />
          </button>
        )}

        {/* Quick Action Tools */}
        <div className="grid grid-cols-2 gap-3">
          {quickTools.map(tool => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className="rounded-2xl bg-card/60 backdrop-blur-sm p-4 text-left group focus:outline-none active:scale-[0.97] transition-all hover:bg-card/80"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  {tool.shortDesc}
                </p>
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
