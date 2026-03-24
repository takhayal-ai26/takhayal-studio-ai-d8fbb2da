import { useNavigate } from 'react-router-dom';
import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { AuthModal } from '@/components/AuthModal';
import { ArrowRight } from 'lucide-react';

const quickStartCards = [
  { name: 'Product Ad', image: 'https://picsum.photos/seed/product-ad/400/300', template: 'Product Shot' },
  { name: 'Instagram Post', image: 'https://picsum.photos/seed/insta-post/400/300', template: 'Reels Cover' },
  { name: 'Ramadan', image: 'https://picsum.photos/seed/ramadan-qs/400/300', template: 'Ramadan' },
  { name: 'Fashion', image: 'https://picsum.photos/seed/fashion-qs/400/300', template: 'Fashion' },
  { name: 'Real Estate', image: 'https://picsum.photos/seed/realestate-qs/400/300', template: 'Real Estate' },
  { name: 'Restaurant', image: 'https://picsum.photos/seed/restaurant-qs/400/300', template: 'Restaurant' },
];

const trendingItems = [
  { image: 'https://picsum.photos/seed/trend1/300/300', prompt: 'Luxury perfume ad, dramatic lighting, dark background', template: 'Product Shot' },
  { image: 'https://picsum.photos/seed/trend2/300/300', prompt: 'Cinematic Ramadan ad, golden lantern, warm glow', template: 'Ramadan' },
  { image: 'https://picsum.photos/seed/trend3/300/300', prompt: 'High-end fashion ad, modern modest style, editorial', template: 'Fashion' },
  { image: 'https://picsum.photos/seed/trend4/300/300', prompt: 'Appetizing restaurant ad, professional food photography', template: 'Restaurant' },
  { image: 'https://picsum.photos/seed/trend5/300/300', prompt: 'Luxury real estate ad, modern building, blue sky', template: 'Real Estate' },
  { image: 'https://picsum.photos/seed/trend6/300/300', prompt: 'Clean medical clinic ad, trustworthy atmosphere', template: 'Medical' },
];

const templatePills = Object.keys(TEMPLATE_PROMPTS);

export default function PortalHome() {
  const navigate = useNavigate();
  const { setPrompt, setSelectedTemplate, setActivePage, gallery, userName } = useApp();

  const handleQuickStart = (template: string) => {
    const prompt = TEMPLATE_PROMPTS[template];
    if (prompt) {
      setPrompt(prompt);
      setSelectedTemplate(template);
    }
    setActivePage('canvas');
    navigate('/canvas');
  };

  const handleTrending = (prompt: string, template: string) => {
    setPrompt(prompt);
    setSelectedTemplate(template);
    setActivePage('canvas');
    navigate('/canvas');
  };

  const handleTemplatePill = (name: string) => {
    const prompt = TEMPLATE_PROMPTS[name];
    if (prompt) {
      setPrompt(prompt);
      setSelectedTemplate(name);
    }
    setActivePage('canvas');
    navigate('/canvas');
  };

  const recentImages = gallery.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNavbar />
      <div className="flex-1 pt-16 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10">

          {/* Header — compact, no hero */}
          <div className="mb-8">
            <h1 className="text-xl font-medium text-foreground">
              {userName ? `Welcome back, ${userName}` : 'Start creating'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Choose a starting point</p>
          </div>

          {/* Section 1: Quick Start */}
          <section className="mb-10">
            <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Quick Start</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickStartCards.map((card) => (
                <button
                  key={card.name}
                  onClick={() => handleQuickStart(card.template)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
                >
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-foreground">{card.name}</span>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Section 2: Recent Creations */}
          {recentImages.length > 0 && (
            <section className="mb-10">
              <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Recent creations</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {recentImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleTrending(img.prompt, img.template || '')}
                    className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Trending / Popular Ideas */}
          <section className="mb-10">
            <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Popular ideas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {trendingItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleTrending(item.prompt, item.template)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
                >
                  <img src={item.image} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[11px] text-foreground/80 line-clamp-2">{item.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Section 4: Template Pills */}
          <section className="mb-10">
            <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Templates</h2>
            <div className="flex flex-wrap gap-2">
              {templatePills.map((name) => (
                <button
                  key={name}
                  onClick={() => handleTemplatePill(name)}
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
