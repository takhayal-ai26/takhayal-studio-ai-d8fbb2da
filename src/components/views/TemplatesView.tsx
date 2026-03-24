import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { useTemplates, FrontendTemplate } from '@/hooks/useTemplates';

export function TemplatesView() {
  const { setPrompt, setSelectedTemplate, setActivePage } = useApp();
  const { t, isRTL } = useLanguage();
  const { templates, categories } = useTemplates();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleUse = (tpl: FrontendTemplate) => { setPrompt(tpl.prompt); setSelectedTemplate(tpl.name); setActivePage('canvas'); };
  const filtered = templates.filter(tpl => {
    const matchCategory = activeCategory === 'All' || tpl.category === activeCategory;
    const matchSearch = !search || tpl.name.toLowerCase().includes(search.toLowerCase()) || tpl.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });
  const featured = templates.filter(tpl => tpl.featured);

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
      <div className="px-5 md:px-8 pt-5 pb-4">
        <h1 className="text-xl font-medium text-foreground">{t.templatesView.title}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{t.templatesView.subtitle}</p>
        <div className="relative mt-4 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.templatesView.searchPlaceholder} className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors" />
        </div>
      </div>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-5 md:px-8 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'}`}>{cat}</button>))}
        </div>
      </div>
      <div className="px-5 md:px-8">
        {activeCategory === 'All' && !search && featured.length > 0 && (
          <section className="mt-6 mb-8">
            <div className="flex items-center gap-2 mb-4"><Sparkles size={14} className="text-primary" /><span className="text-[13px] font-medium text-foreground">{t.templatesView.featured}</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {featured.map(tpl => (
                <button key={tpl.name} onClick={() => handleUse(tpl)} className="group relative rounded-2xl overflow-hidden border border-border hover:border-primary transition-all duration-200 hover:scale-[1.02]">
                  <div className="aspect-[3/2]"><img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" width={600} height={400} /></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-[15px] font-medium text-foreground">{tpl.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">{tpl.tags.slice(0, 2).map(tag => (<span key={tag} className="px-2 py-0.5 rounded-md bg-foreground/10 text-[10px] text-foreground/60">{tag}</span>))}</div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium flex items-center gap-1">{t.portal.use} <ArrowRight size={10} className={isRTL ? 'rotate-180' : ''} /></span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
        <section className="pb-8">
          {activeCategory === 'All' && !search && (<h2 className="text-[13px] font-medium text-foreground mb-4">{t.templatesView.allTemplates}</h2>)}
          {filtered.length === 0 ? (<div className="py-16 text-center"><p className="text-[13px] text-muted-foreground">{t.templatesView.noTemplatesFound}</p></div>) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map(tpl => (
                <button key={tpl.name} onClick={() => handleUse(tpl)} className="group text-left rounded-2xl overflow-hidden border border-border hover:border-primary/60 transition-all duration-200 bg-card hover:scale-[1.02]">
                  <div className="aspect-[3/2] overflow-hidden"><img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" width={600} height={400} /></div>
                  <div className="p-3.5">
                    <div className="flex items-center justify-between"><h3 className="text-[13px] font-medium text-foreground">{tpl.name}</h3><ArrowRight size={12} className={`text-muted-foreground/40 group-hover:text-primary transition-colors ${isRTL ? 'rotate-180' : ''}`} /></div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{tpl.description}</p>
                    <div className="flex items-center gap-1.5 mt-2.5">{tpl.tags.map(tag => (<span key={tag} className="px-2 py-0.5 rounded-md bg-foreground/[0.06] text-[10px] text-muted-foreground">{tag}</span>))}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
