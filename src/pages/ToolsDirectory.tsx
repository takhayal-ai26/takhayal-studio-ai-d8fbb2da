import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useToolsDB } from '@/hooks/useToolsDB';

export default function ToolsDirectory() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { tools } = useToolsDB();
  const [search, setSearch] = useState('');

  const filtered = tools.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.shortDesc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 pt-14 overflow-y-auto animate-page-enter">
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10 pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
              {t.toolsDir.findNewWays}
            </h1>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.toolsDir.searchPlaceholder}
              className="w-full h-11 bg-card/50 border border-border/30 rounded-2xl pl-10 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
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
                  className="group relative rounded-2xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 focus:outline-none"
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
                  <div className="absolute top-4 left-4">
                    <div className="w-9 h-9 rounded-xl bg-black/30 backdrop-blur-md border border-white/8 flex items-center justify-center">
                      <Icon size={16} className="text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                    <p className="text-[13px] text-white/50 mt-1">{tool.shortDesc}</p>
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
