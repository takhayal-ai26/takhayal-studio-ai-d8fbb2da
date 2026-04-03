import { useApp } from '@/context/AppContext';

import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { Heart, Repeat2, Copy, X, ArrowRight, Sparkles } from 'lucide-react';

interface CommunityImage {
  id: string; image: string; prompt: string; creator: string; likes: number; category: string; liked?: boolean;
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
      id: `img-${idx}`, image: `https://picsum.photos/seed/community-${idx}/400/${heights[idx % heights.length]}`,
      prompt: prompts[idx % prompts.length], creator: creators[idx % creators.length],
      likes: Math.floor(Math.random() * 500) + 10, category: cats[idx % cats.length],
    };
  });

export default function Community() {
  const navigate = useNavigate();
  const { setPrompt, setActivePage, requireAuth } = useApp();
  const { t, isRTL } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('All');
  const [images, setImages] = useState<CommunityImage[]>(() => generateMockImages(18));
  const [selectedImage, setSelectedImage] = useState<CommunityImage | null>(null);
  const [loading, setLoading] = useState(false);

  const FILTERS_LOCALIZED = [
    { key: 'All', label: t.portal.all },
    { key: 'Trending', label: t.community.trending },
    { key: 'New', label: t.community.new },
    { key: 'Ads', label: t.portal.ads },
    { key: 'Products', label: t.portal.products },
    { key: 'Fashion', label: t.portal.fashion },
    { key: 'Portraits', label: t.community.portraits },
  ];

  const filtered = images;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && !loading) {
      setLoading(true);
      setTimeout(() => { setImages(prev => [...prev, ...generateMockImages(9, prev.length)]); setLoading(false); }, 800);
    }
  }, [loading]);

  const handleUsePrompt = (prompt: string) => {
    setPrompt(prompt); setActivePage('canvas'); setSelectedImage(null); navigate('/studio');
  };

  const handleLike = (id: string) => {
    requireAuth(() => {
      setImages(prev => prev.map(img => img.id === id ? { ...img, liked: !img.liked, likes: img.liked ? img.likes - 1 : img.likes + 1 } : img));
    });
  };

  const copyPrompt = (prompt: string) => navigator.clipboard.writeText(prompt);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedImage(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(4rem + var(--banner-h, 0px))' }} onScroll={handleScroll}>
      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(4rem + var(--banner-h, 0px))' }} onScroll={handleScroll}>
        <section className="text-center px-5 pt-12 pb-8 animate-fade-in">
          <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">{t.community.label}</span>
          <h1 className="text-3xl md:text-4xl font-extralight text-foreground mt-3 leading-tight">{t.community.title}</h1>
          <p className="text-base font-light mt-2"><span className="text-primary">{t.community.poweredBy}</span></p>
          <button onClick={() => requireAuth(() => navigate('/studio'))} className="mt-6 h-11 px-6 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
            {t.community.shareCreations}
          </button>
        </section>


        <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {filtered.length === 0 ? (
            <div className="py-24 text-center animate-fade-in">
              <Sparkles size={24} className="text-primary mx-auto mb-3" />
              <p className="text-foreground font-light text-lg">{t.community.noCreationsYet}</p>
              <p className="text-muted-foreground text-[13px] mt-1">{t.community.beFirst}</p>
              <button onClick={() => navigate('/studio')} className="mt-5 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
                {t.community.startCreating}
              </button>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {filtered.map((img) => (
                <div key={img.id} className="group relative break-inside-avoid rounded-2xl overflow-hidden cursor-pointer" onClick={() => setSelectedImage(img)}>
                  <img src={img.image} alt={img.prompt} className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <p className="text-[11px] text-white/80 line-clamp-1 mb-2">{img.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/50">{img.creator}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); handleLike(img.id); }} className={`flex items-center gap-1 text-[10px] transition-colors ${img.liked ? 'text-primary' : 'text-white/60 hover:text-white'}`}>
                          <Heart size={12} fill={img.liked ? 'currentColor' : 'none'} />{img.likes}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleUsePrompt(img.prompt); }} className="text-white/60 hover:text-primary transition-colors" title={t.community.remix}><Repeat2 size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); copyPrompt(img.prompt); }} className="text-white/60 hover:text-white transition-colors" title={t.community.copyPrompt}><Copy size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {loading && (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          )}
        </section>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedImage(null)}>
          <div className="relative bg-card border border-border rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col md:flex-row animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"><X size={16} /></button>
            <div className="flex-1 min-h-0 md:max-w-[55%]"><img src={selectedImage.image} alt={selectedImage.prompt} className="w-full h-full object-cover" /></div>
            <div className="flex flex-col p-5 md:p-6 md:w-[45%] md:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-primary/[0.15] flex items-center justify-center text-[10px] font-medium text-primary">{selectedImage.creator.charAt(0)}</div>
                <span className="text-[13px] text-foreground">{selectedImage.creator}</span>
              </div>
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-2">{t.community.promptLabel}</h3>
              <p className="text-[13px] text-foreground/80 leading-relaxed">{selectedImage.prompt}</p>
              <div className="flex items-center gap-3 mt-5">
                <button onClick={() => handleLike(selectedImage.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${selectedImage.liked ? 'border-primary/30 text-primary bg-primary/[0.08]' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  <Heart size={13} fill={selectedImage.liked ? 'currentColor' : 'none'} />{selectedImage.likes}
                </button>
                <button onClick={() => copyPrompt(selectedImage.prompt)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"><Copy size={13} />{t.community.copy}</button>
              </div>
              <div className="mt-auto pt-5">
                <button onClick={() => handleUsePrompt(selectedImage.prompt)} className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  {t.community.useThisPrompt} <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
