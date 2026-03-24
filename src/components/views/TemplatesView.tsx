import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';
import { useState } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';

/* ─── Template data with images, tags, descriptions ─── */

interface TemplateDef {
  name: string;
  prompt: string;
  image: string;
  description: string;
  tags: string[];
  category: string;
  featured?: boolean;
}

const TEMPLATES: TemplateDef[] = [
  {
    name: 'Ramadan Campaign',
    prompt: TEMPLATE_PROMPTS['Ramadan'],
    image: 'https://picsum.photos/seed/tpl-ramadan/600/400',
    description: 'Warm cinematic Ramadan visuals with golden lanterns',
    tags: ['Ads', 'Seasonal', '16:9'],
    category: 'Ramadan',
    featured: true,
  },
  {
    name: 'Product Shot',
    prompt: TEMPLATE_PROMPTS['Product Shot'],
    image: 'https://picsum.photos/seed/tpl-product/600/400',
    description: 'Clean studio product photography with sharp details',
    tags: ['Product', '1:1', 'Commercial'],
    category: 'Product',
    featured: true,
  },
  {
    name: 'Reels Cover',
    prompt: TEMPLATE_PROMPTS['Reels Cover'],
    image: 'https://picsum.photos/seed/tpl-reels/600/400',
    description: 'Bold vertical covers for Instagram Reels',
    tags: ['Social', '9:16', 'Trendy'],
    category: 'Social',
    featured: true,
  },
  {
    name: 'Eid Celebration',
    prompt: TEMPLATE_PROMPTS['Eid'],
    image: 'https://picsum.photos/seed/tpl-eid/600/400',
    description: 'Vibrant festive Eid designs with joyful energy',
    tags: ['Ads', 'Seasonal'],
    category: 'Eid',
  },
  {
    name: 'National Day',
    prompt: TEMPLATE_PROMPTS['National Day'],
    image: 'https://picsum.photos/seed/tpl-national/600/400',
    description: 'Patriotic modern designs with national colors',
    tags: ['Ads', 'Seasonal'],
    category: 'Eid',
  },
  {
    name: 'Sale & Offers',
    prompt: TEMPLATE_PROMPTS['Sale/Offers'],
    image: 'https://picsum.photos/seed/tpl-sale/600/400',
    description: 'Eye-catching promotional and sale graphics',
    tags: ['Ads', 'Commercial'],
    category: 'Product',
  },
  {
    name: 'Fashion Editorial',
    prompt: TEMPLATE_PROMPTS['Fashion'],
    image: 'https://picsum.photos/seed/tpl-fashion/600/400',
    description: 'High-end fashion with editorial lighting',
    tags: ['Fashion', 'Editorial'],
    category: 'Fashion',
  },
  {
    name: 'Real Estate',
    prompt: TEMPLATE_PROMPTS['Real Estate'],
    image: 'https://picsum.photos/seed/tpl-realestate/600/400',
    description: 'Luxury property ads with architectural beauty',
    tags: ['Real Estate', 'Commercial'],
    category: 'Real Estate',
  },
  {
    name: 'Restaurant',
    prompt: TEMPLATE_PROMPTS['Restaurant'],
    image: 'https://picsum.photos/seed/tpl-restaurant/600/400',
    description: 'Appetizing food photography for restaurants',
    tags: ['Food', 'Social'],
    category: 'Restaurant',
  },
  {
    name: 'Medical Clinic',
    prompt: TEMPLATE_PROMPTS['Medical'],
    image: 'https://picsum.photos/seed/tpl-medical/600/400',
    description: 'Clean trustworthy healthcare designs',
    tags: ['Medical', 'Professional'],
    category: 'Medical',
  },
];

const CATEGORIES = ['All', 'Ramadan', 'Eid', 'Product', 'Social', 'Fashion', 'Real Estate', 'Restaurant', 'Medical'];

export function TemplatesView() {
  const { setPrompt, setSelectedTemplate, setActivePage } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleUse = (tpl: TemplateDef) => {
    setPrompt(tpl.prompt);
    setSelectedTemplate(tpl.name);
    setActivePage('canvas');
  };

  const filtered = TEMPLATES.filter(t => {
    const matchCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const featured = TEMPLATES.filter(t => t.featured);

  return (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-6">

      {/* ── Header ── */}
      <div className="px-5 md:px-8 pt-5 pb-4">
        <h1 className="text-xl font-medium text-foreground">Templates</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Ready-made starting points for high-quality visuals</p>

        {/* Search */}
        <div className="relative mt-4 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* ── Sticky categories ── */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-5 md:px-8 py-2.5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 md:px-8">

        {/* ── Featured row ── */}
        {activeCategory === 'All' && !search && (
          <section className="mt-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[13px] font-medium text-foreground">Featured</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {featured.map(tpl => (
                <button
                  key={tpl.name}
                  onClick={() => handleUse(tpl)}
                  className="group relative rounded-2xl overflow-hidden border border-border hover:border-primary transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="aspect-[3/2]">
                    <img
                      src={tpl.image}
                      alt={tpl.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      width={600}
                      height={400}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-[15px] font-medium text-foreground">{tpl.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {tpl.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-foreground/10 text-[10px] text-foreground/60">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {/* Hover CTA */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium flex items-center gap-1">
                      Use <ArrowRight size={10} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Main grid ── */}
        <section className="pb-8">
          {activeCategory === 'All' && !search && (
            <h2 className="text-[13px] font-medium text-foreground mb-4">All Templates</h2>
          )}

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[13px] text-muted-foreground">No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map(tpl => (
                <button
                  key={tpl.name}
                  onClick={() => handleUse(tpl)}
                  className="group text-left rounded-2xl overflow-hidden border border-border hover:border-primary/60 transition-all duration-200 bg-card hover:scale-[1.02]"
                >
                  {/* Image */}
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={tpl.image}
                      alt={tpl.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      width={600}
                      height={400}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-medium text-foreground">{tpl.name}</h3>
                      <ArrowRight size={12} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{tpl.description}</p>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {tpl.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-foreground/[0.06] text-[10px] text-muted-foreground">{tag}</span>
                      ))}
                    </div>
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
