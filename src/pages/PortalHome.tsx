import { useNavigate } from 'react-router-dom';
import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { AuthModal } from '@/components/AuthModal';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { TOOLS } from '@/data/tools';

const toolsData = TOOLS;

/* ─── Data ─── */

const featuredItems = [
  { image: 'https://picsum.photos/seed/feat-cinema/800/450', label: 'Cinematic Ad', prompt: 'Cinematic product advertisement, dramatic studio lighting, dark moody tones, volumetric fog, 4K commercial quality', template: 'Product Shot' },
  { image: 'https://picsum.photos/seed/feat-fashion/800/450', label: 'Fashion Editorial', prompt: 'High-end fashion editorial, modern modest style, soft diffused lighting, clean background, editorial quality', template: 'Fashion' },
  { image: 'https://picsum.photos/seed/feat-ramadan/800/450', label: 'Ramadan Campaign', prompt: 'Warm cinematic Ramadan ad, golden lantern, crescent moon, deep purple and gold palette, soft volumetric lighting', template: 'Ramadan' },
  { image: 'https://picsum.photos/seed/feat-realestate/800/450', label: 'Architecture', prompt: 'Luxury real estate ad, modern building, blue sky, professional architectural photography, premium feel', template: 'Real Estate' },
];

const createCards = [
  { name: 'Product Ad', image: 'https://picsum.photos/seed/create-prod/400/500', template: 'Product Shot' },
  { name: 'Instagram Post', image: 'https://picsum.photos/seed/create-insta/400/500', template: 'Reels Cover' },
  { name: 'Fashion', image: 'https://picsum.photos/seed/create-fashion/400/500', template: 'Fashion' },
  { name: 'Real Estate', image: 'https://picsum.photos/seed/create-real/400/500', template: 'Real Estate' },
  { name: 'Restaurant', image: 'https://picsum.photos/seed/create-food/400/500', template: 'Restaurant' },
  { name: 'Medical', image: 'https://picsum.photos/seed/create-med/400/500', template: 'Medical' },
];

const categories = ['All', 'Ads', 'Social', 'Fashion', 'Products', 'Food', 'Architecture'];

const masonryImages = [
  { image: 'https://picsum.photos/seed/m1/400/600', prompt: 'Luxury perfume ad, dramatic side lighting, dark background, elegant glass bottle', template: 'Product Shot', cat: 'Products' },
  { image: 'https://picsum.photos/seed/m2/400/400', prompt: 'Trendy streetwear fashion shoot, urban backdrop, bold colors', template: 'Fashion', cat: 'Fashion' },
  { image: 'https://picsum.photos/seed/m3/400/500', prompt: 'Golden hour restaurant scene, appetizing table spread, warm ambiance', template: 'Restaurant', cat: 'Food' },
  { image: 'https://picsum.photos/seed/m4/400/350', prompt: 'Minimalist tech product floating, clean gradient background, 3D render', template: 'Product Shot', cat: 'Products' },
  { image: 'https://picsum.photos/seed/m5/400/550', prompt: 'Cinematic Ramadan greeting, lanterns and stars, cinematic depth of field', template: 'Ramadan', cat: 'Ads' },
  { image: 'https://picsum.photos/seed/m6/400/450', prompt: 'Instagram story design, bold typography, vibrant gradient, social media', template: 'Reels Cover', cat: 'Social' },
  { image: 'https://picsum.photos/seed/m7/400/380', prompt: 'Modern villa exterior, blue sky, lush garden, architectural photography', template: 'Real Estate', cat: 'Architecture' },
  { image: 'https://picsum.photos/seed/m8/400/520', prompt: 'Haute couture fashion editorial, flowing fabric, studio lighting', template: 'Fashion', cat: 'Fashion' },
  { image: 'https://picsum.photos/seed/m9/400/440', prompt: 'Eid celebration ad, festive colors, joyful atmosphere, commercial quality', template: 'Eid', cat: 'Ads' },
  { image: 'https://picsum.photos/seed/m10/400/480', prompt: 'Artisan coffee flat lay, latte art, warm morning light, overhead shot', template: 'Restaurant', cat: 'Food' },
  { image: 'https://picsum.photos/seed/m11/400/360', prompt: 'Clean skincare product on marble, soft shadows, premium aesthetic', template: 'Product Shot', cat: 'Products' },
  { image: 'https://picsum.photos/seed/m12/400/550', prompt: 'National Day parade scene, flags and fireworks, patriotic celebration', template: 'National Day', cat: 'Ads' },
];

const templatePills = Object.keys(TEMPLATE_PROMPTS);

export default function PortalHome() {
  const navigate = useNavigate();
  const { setPrompt, setSelectedTemplate, setActivePage, userName } = useApp();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const scrollRef = useRef<HTMLDivElement>(null);

  /* auto-advance carousel */
  useEffect(() => {
    const t = setInterval(() => setCarouselIndex(i => (i + 1) % featuredItems.length), 5000);
    return () => clearInterval(t);
  }, []);

  const goToCanvas = (prompt: string, template: string) => {
    setPrompt(prompt);
    setSelectedTemplate(template);
    setActivePage('canvas');
    navigate('/studio');
  };

  const filteredMasonry = activeCategory === 'All'
    ? masonryImages
    : masonryImages.filter(m => m.cat === activeCategory);

  const scrollCreate = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNavbar />
      <div className="flex-1 pt-16 overflow-y-auto">

        {/* ── Section 1: Featured Carousel ── */}
        <section className="relative w-full overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
          >
            {featuredItems.map((item, i) => (
              <div key={i} className="w-full flex-shrink-0 relative aspect-[21/9] min-h-[260px] max-h-[400px]">
                <img src={item.image} alt={item.label} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                  <span className="text-[11px] uppercase tracking-widest text-primary font-medium">Featured</span>
                  <h2 className="text-2xl md:text-3xl font-extralight text-foreground mt-1">{item.label}</h2>
                  <button
                    onClick={() => goToCanvas(item.prompt, item.template)}
                    className="mt-4 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-80 transition-opacity"
                  >
                    Try this style
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* dots */}
          <div className="absolute bottom-4 right-6 flex gap-1.5">
            {featuredItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === carouselIndex ? 'bg-primary' : 'bg-foreground/20'}`}
              />
            ))}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-5 md:px-8">

          {/* ── Section 2: Seasonal Banner ── */}
          <section className="my-8">
            <button
              onClick={() => goToCanvas(TEMPLATE_PROMPTS['Ramadan'], 'Ramadan')}
              className="group w-full relative h-36 md:h-44 rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
            >
              <img src="https://picsum.photos/seed/banner-ramadan/1200/400" alt="Ramadan Campaign" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
                <span className="text-[11px] uppercase tracking-widest text-primary font-medium">Seasonal</span>
                <h3 className="text-xl md:text-2xl font-extralight text-foreground mt-1">Ramadan Campaign Ideas</h3>
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-primary font-medium group-hover:gap-2 transition-all">
                  Try this style <ArrowRight size={14} />
                </span>
              </div>
            </button>
          </section>


          {/* ── Section 4: Category Filter ── */}
          <section className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                    activeCategory === cat
                      ? 'bg-primary/[0.15] border-primary text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* ── Section 5: Masonry Feed ── */}
          <section className="mb-10">
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {filteredMasonry.map((item, i) => (
                <button
                  key={i}
                  onClick={() => goToCanvas(item.prompt, item.template)}
                  className="group relative w-full rounded-xl overflow-hidden border border-border hover:border-primary transition-colors break-inside-avoid block"
                >
                  <img src={item.image} alt={item.prompt} className="w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between gap-2">
                    <p className="text-[11px] text-foreground/80 line-clamp-2 flex-1">{item.prompt}</p>
                    <span className="flex-shrink-0 h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium flex items-center">Use</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Section 6: Image Tools ── */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-medium text-foreground">Image Tools</h2>
              <button
                onClick={() => navigate('/tools/generate')}
                className="text-[12px] text-primary font-medium hover:underline flex items-center gap-1"
              >
                See all <ArrowRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {toolsData.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => navigate(tool.route)}
                    className="group relative rounded-xl overflow-hidden border border-border hover:border-primary transition-all hover:scale-[1.03] aspect-[4/5]"
                  >
                    <img src={tool.image} alt={tool.name} className="w-full h-full object-cover" loading="lazy" width={400} height={500} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/[0.2] backdrop-blur-sm flex items-center justify-center">
                        <Icon size={13} className="text-primary" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="text-[13px] font-medium text-foreground block">{tool.name}</span>
                      <span className="text-[11px] text-muted-foreground">{tool.shortDesc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Section 7: Quick Templates ── */}
          <section className="mb-12 pb-4">
            <h2 className="text-[15px] font-medium text-foreground mb-4">Quick Templates</h2>
            <div className="flex flex-wrap gap-2">
              {templatePills.map(name => (
                <button
                  key={name}
                  onClick={() => goToCanvas(TEMPLATE_PROMPTS[name], name)}
                  className="px-4 py-2 rounded-full bg-card border border-border text-[13px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
      <AuthModal />
    </div>
  );
}
