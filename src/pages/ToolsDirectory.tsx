import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function ToolsDirectory() {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { tools } = useToolsDB();
  const { setActivePage } = useApp();
  const [search, setSearch] = useState('');

  const filtered = tools
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.shortDesc.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10 pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="typo-heading-page">
              {t.toolsDir.findNewWays}
            </h1>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={15} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground/40", isRTL ? "right-3.5" : "left-3.5")} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.toolsDir.searchPlaceholder}
              className={cn(
                "w-full h-11 bg-card/50 border border-border/30 rounded-2xl pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all",
                isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
              )}
            />
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground/50 text-[14px]">{t.toolsDir.noToolsMatch}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tool => {
              const Icon = tool.icon;
              const hasImage = !!tool.image;
              return (
                <button
                  key={tool.id}
                  onClick={() => navigate(tool.slug === 'generate' ? '/studio' : `/tools/${tool.slug}`)}
                  className={cn(
                    "group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 focus:outline-none",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  <div className="aspect-[4/3] relative">
                    {hasImage ? (
                      <img
                        src={tool.image}
                        alt={tool.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/15 via-muted/20 to-background flex items-center justify-center">
                        <Icon size={48} className="text-primary/20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                    <p className="text-[15px] text-white/50 mt-1">{tool.shortDesc}</p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.04] group-hover:ring-primary/20 transition-all duration-300 pointer-events-none" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
