import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useTemplates, FrontendTemplate } from '@/hooks/useTemplates';

function ratioToNumber(ratio: string): number {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return 1;
  return w / h;
}

export function TemplatesView() {
  const { setPrompt, setSelectedTemplate, setActivePage } = useApp();
  const { t, isRTL } = useLanguage();
  const { templates, categoryNames, loading } = useTemplates();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleUse = (tpl: FrontendTemplate) => {
    setPrompt(tpl.prompt);
    setSelectedTemplate(tpl.name);
    setActivePage('canvas');
  };

  const filtered = templates.filter(tpl => {
    const matchCategory = activeCategory === 'All' || tpl.category === activeCategory;
    const matchSearch = !search || tpl.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-6 animate-page-enter">
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{t.templatesView.title}</h1>
        <div className="relative mt-5 max-w-lg">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.templatesView.searchPlaceholder}
            className="w-full h-12 bg-card/50 border border-border/30 rounded-2xl pl-11 pr-5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/20 px-6 md:px-10 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categoryNames.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`filter-pill flex-shrink-0 transition-all duration-200 ${
                activeCategory === cat ? 'active' : ''
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground/50">Loading templates...</p>
          </div>
        ) : (
          <section className="pt-4 pb-10">
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm text-muted-foreground/50">{t.templatesView.noTemplatesFound}</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2 [column-fill:_balance]">
                {filtered.map(tpl => (
                  <div key={tpl.id} className="break-inside-avoid mb-2">
                    <TemplateCard tpl={tpl} onUse={handleUse} isRTL={isRTL} useLabel={t.portal?.use || 'Use'} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function TemplateCard({
  tpl,
  onUse,
  isRTL,
  useLabel,
}: {
  tpl: FrontendTemplate;
  onUse: (tpl: FrontendTemplate) => void;
  isRTL: boolean;
  useLabel: string;
}) {
  const aspectRatio = ratioToNumber(tpl.ratio);

  return (
    <button
      onClick={() => onUse(tpl)}
      className="group w-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10 text-left block"
    >
      <div className="relative overflow-hidden" style={{ aspectRatio }}>
        <img
          src={tpl.image}
          alt={tpl.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <h3 className="absolute bottom-3 left-3 right-3 text-[13px] font-semibold text-white leading-tight drop-shadow-lg">
          {tpl.name}
        </h3>
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <span className="h-7 px-3 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center gap-1 shadow-lg">
            {useLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
