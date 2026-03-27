import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useTemplates, FrontendTemplate } from '@/hooks/useTemplates';

/* Convert ratio string like "9:16" to a numeric value for CSS aspect-ratio */
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

  const featured = templates.filter(tpl => tpl.featured);

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{t.templatesView.title}</h1>
        <div className="relative mt-5 max-w-lg">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.templatesView.searchPlaceholder}
            className="w-full h-12 bg-card border border-border rounded-2xl pl-11 pr-5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 md:px-10 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {categoryNames.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-10">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {activeCategory === 'All' && !search && featured.length > 0 && (
              <section className="mt-8 mb-10">
                <h2 className="text-lg font-semibold text-foreground mb-5">{t.templatesView.featured}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {featured.map(tpl => (
                    <TemplateCard key={tpl.id} tpl={tpl} onUse={handleUse} isRTL={isRTL} useLabel={t.portal?.use || 'Use'} />
                  ))}
                </div>
              </section>
            )}

            {/* All Templates */}
            <section className="pb-10">
              {activeCategory === 'All' && !search && (
                <h2 className="text-lg font-semibold text-foreground mb-5">{t.templatesView.allTemplates}</h2>
              )}
              {filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-sm text-muted-foreground">{t.templatesView.noTemplatesFound}</p>
                </div>
              ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {filtered.map(tpl => (
                    <TemplateCard key={tpl.id} tpl={tpl} onUse={handleUse} isRTL={isRTL} useLabel={t.portal?.use || 'Use'} />
                  ))}
                </div>
              )}
            </section>
          </>
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
      className="group w-full break-inside-avoid rounded-2xl overflow-hidden border border-border hover:border-primary/60 transition-all duration-200 bg-card hover:shadow-lg text-left block"
    >
      <div className="relative overflow-hidden" style={{ aspectRatio }}>
        <img
          src={tpl.image}
          alt={tpl.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="h-8 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 shadow-lg">
            {useLabel} <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-foreground leading-tight">{tpl.name}</h3>
      </div>
    </button>
  );
}
