import { TopNavbar } from '@/components/layout/TopNavbar';
import { AuthModal } from '@/components/AuthModal';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { Heart, Repeat2, Copy, X, ArrowRight, Sparkles } from 'lucide-react';

/* ─── Mock community data ─── */
const FILTERS = ['All', 'Trending', 'New', 'Ads', 'Products', 'Fashion', 'Portraits'];

interface CommunityImage {
  id: string;
  image: string;
  prompt: string;
  creator: string;
  likes: number;
  category: string;
  liked?: boolean;
}

const generateMockImages = (count: number, offset = 0): CommunityImage[] =>
  Array.from({ length: count }, (_, i) => {
    const idx = offset + i;
    const cats = ['Ads', 'Products', 'Fashion', 'Portraits', 'Ads', 'Products'];
    const heights = [400, 500, 350, 600, 450, 520, 380, 550, 420, 480];
    const prompts = [
      'Luxury perfume ad, dramatic studio lighting, dark background, elegant glass bottle',
      'Trendy streetwear fashion shoot, urban backdrop, bold neon colors',
      'Golden hour restaurant scene, appetizing table spread, warm ambiance',
      'Minimalist tech product floating, clean gradient background, 3D render',
      'Cinematic Ramadan greeting, lanterns and crescent moon, cinematic depth of field',
      'High-end fashion editorial, flowing silk, studio lighting, editorial quality',
      'Modern villa exterior, blue sky, lush garden, architectural photography',
      'Instagram story design, bold typography, vibrant gradient, social media',
      'Haute couture portrait, dramatic shadows, high contrast, premium feel',
      'Artisan coffee flat lay, latte art, warm morning light, overhead shot',
    ];
    const creators = ['Sarah M.', 'Ahmed K.', 'Noor R.', 'Khalid S.', 'Fatima A.', 'Omar Z.'];
    return {
      id: `img-${idx}`,
      image: `https://picsum.photos/seed/community-${idx}/400/${heights[idx % heights.length]}`,
      prompt: prompts[idx % prompts.length],
      creator: creators[idx % creators.length],
      likes: Math.floor(Math.random() * 500) + 10,
      category: cats[idx % cats.length],
    };
  });

export default function Community() {
  const navigate = useNavigate();
  const { setPrompt, setActivePage, requireAuth } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');
  const [images, setImages] = useState<CommunityImage[]>(() => generateMockImages(18));
  const [selectedImage, setSelectedImage] = useState<CommunityImage | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = activeFilter === 'All'
    ? images
    : activeFilter === 'Trending'
      ? [...images].sort((a, b) => b.likes - a.likes)
      : activeFilter === 'New'
        ? [...images].reverse()
        : images.filter(img => img.category === activeFilter);

  // Infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && !loading) {
      setLoading(true);
      setTimeout(() => {
        setImages(prev => [...prev, ...generateMockImages(9, prev.length)]);
        setLoading(false);
      }, 800);
    }
  }, [loading]);

  const handleUsePrompt = (prompt: string) => {
    setPrompt(prompt);
    setActivePage('canvas');
    setSelectedImage(null);
    navigate('/studio');
  };

  const handleLike = (id: string) => {
    requireAuth(() => {
      setImages(prev => prev.map(img =>
        img.id === id ? { ...img, liked: !img.liked, likes: img.liked ? img.likes - 1 : img.likes + 1 } : img
      ));
    });
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  // Close modal on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNavbar />
      <div className="flex-1 pt-16 overflow-y-auto" onScroll={handleScroll}>

        {/* ── Hero ── */}
        <section className="text-center px-5 pt-12 pb-8 animate-fade-in">
          <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">Community</span>
          <h1 className="text-3xl md:text-4xl font-extralight text-foreground mt-3 leading-tight">
            Created by the community
          </h1>
          <p className="text-base font-light mt-2">
            <span className="text-primary">Powered by imagination</span>
          </p>
          <button
            onClick={() => requireAuth(() => navigate('/studio'))}
            className="mt-6 h-11 px-6 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Share your creations
          </button>
        </section>

        {/* ── Filters ── */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-5 md:px-8 py-3 border-b border-border/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-6xl mx-auto">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                  activeFilter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Masonry Feed ── */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {filtered.length === 0 ? (
            <div className="py-24 text-center animate-fade-in">
              <Sparkles size={24} className="text-primary mx-auto mb-3" />
              <p className="text-foreground font-light text-lg">No creations yet</p>
              <p className="text-muted-foreground text-[13px] mt-1">Be the first to create</p>
              <button
                onClick={() => navigate('/studio')}
                className="mt-5 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
              >
                Start creating
              </button>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
              {filtered.map((img) => (
                <div
                  key={img.id}
                  className="group relative break-inside-avoid rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img.image}
                    alt={img.prompt}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <p className="text-[11px] text-white/80 line-clamp-1 mb-2">{img.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/50">{img.creator}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleLike(img.id); }}
                          className={`flex items-center gap-1 text-[10px] transition-colors ${img.liked ? 'text-primary' : 'text-white/60 hover:text-white'}`}
                        >
                          <Heart size={12} fill={img.liked ? 'currentColor' : 'none'} />
                          {img.likes}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleUsePrompt(img.prompt); }}
                          className="text-white/60 hover:text-primary transition-colors"
                          title="Remix"
                        >
                          <Repeat2 size={12} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); copyPrompt(img.prompt); }}
                          className="text-white/60 hover:text-white transition-colors"
                          title="Copy prompt"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </section>
      </div>

      {/* ── Image Modal ── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-card border border-border rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col md:flex-row animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {/* Image */}
            <div className="flex-1 min-h-0 md:max-w-[55%]">
              <img
                src={selectedImage.image}
                alt={selectedImage.prompt}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex flex-col p-5 md:p-6 md:w-[45%] md:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-primary/[0.15] flex items-center justify-center text-[10px] font-medium text-primary">
                  {selectedImage.creator.charAt(0)}
                </div>
                <span className="text-[13px] text-foreground">{selectedImage.creator}</span>
              </div>

              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2">Prompt</h3>
              <p className="text-[13px] text-foreground/80 leading-relaxed">{selectedImage.prompt}</p>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => handleLike(selectedImage.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
                    selectedImage.liked
                      ? 'border-primary/30 text-primary bg-primary/[0.08]'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Heart size={13} fill={selectedImage.liked ? 'currentColor' : 'none'} />
                  {selectedImage.likes}
                </button>
                <button
                  onClick={() => copyPrompt(selectedImage.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy size={13} />
                  Copy
                </button>
              </div>

              <div className="mt-auto pt-5">
                <button
                  onClick={() => handleUsePrompt(selectedImage.prompt)}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Use this prompt
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal />
    </div>
  );
}
