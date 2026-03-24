import { useState } from 'react';
import { useApp, TEMPLATE_PROMPTS } from '@/context/AppContext';
import { Download, RefreshCw } from 'lucide-react';

const CATEGORIES = ['All', 'Ads', 'Social', 'Fashion', 'Products', 'Food', 'Architecture'] as const;

const FEED_ITEMS = [
  { image: 'https://picsum.photos/seed/cine1/400/500', prompt: 'Cinematic perfume ad, dramatic lighting, dark background, luxury feel', category: 'Ads', height: 'h-[280px]' },
  { image: 'https://picsum.photos/seed/fashion2/400/600', prompt: 'High-end modest fashion editorial, soft studio lighting, clean background', category: 'Fashion', height: 'h-[340px]' },
  { image: 'https://picsum.photos/seed/food3/400/400', prompt: 'Gourmet restaurant dish, professional food photography, warm tones, steam rising', category: 'Food', height: 'h-[240px]' },
  { image: 'https://picsum.photos/seed/arch4/400/550', prompt: 'Modern luxury villa, blue sky, architectural photography, wide angle', category: 'Architecture', height: 'h-[300px]' },
  { image: 'https://picsum.photos/seed/prod5/400/450', prompt: 'Premium watch on marble surface, studio lighting, commercial quality', category: 'Products', height: 'h-[260px]' },
  { image: 'https://picsum.photos/seed/social6/400/500', prompt: 'Trendy Instagram post, bold modern aesthetic, vibrant colors, social media ready', category: 'Social', height: 'h-[290px]' },
  { image: 'https://picsum.photos/seed/ram7/400/520', prompt: TEMPLATE_PROMPTS['Ramadan'], category: 'Ads', height: 'h-[310px]' },
  { image: 'https://picsum.photos/seed/fash8/400/480', prompt: 'Streetwear lookbook, urban backdrop, moody lighting, editorial quality', category: 'Fashion', height: 'h-[270px]' },
  { image: 'https://picsum.photos/seed/prod9/400/420', prompt: 'Skincare product flatlay, minimal white background, soft shadows, clean aesthetic', category: 'Products', height: 'h-[250px]' },
  { image: 'https://picsum.photos/seed/food10/400/560', prompt: 'Arabic coffee setup, dates, traditional, warm golden hour lighting', category: 'Food', height: 'h-[320px]' },
  { image: 'https://picsum.photos/seed/arch11/400/440', prompt: 'Futuristic office interior, glass and steel, professional real estate photography', category: 'Architecture', height: 'h-[260px]' },
  { image: 'https://picsum.photos/seed/social12/400/500', prompt: 'YouTube thumbnail, energetic, bold text space, eye-catching composition', category: 'Social', height: 'h-[280px]' },
];

export function InspirationFeed() {
  const {
    setPrompt, setSelectedTemplate,
    generatedImages, currentImageIndex, setCurrentImageIndex,
    isGenerating, generate,
  } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filtered = activeCategory === 'All'
    ? FEED_ITEMS
    : FEED_ITEMS.filter(item => item.category === activeCategory);

  const handleUse = (item: typeof FEED_ITEMS[0]) => {
    setPrompt(item.prompt);
    setSelectedTemplate(null);
  };

  const hasImages = generatedImages.length > 0;
  const currentImage = generatedImages[currentImageIndex];

  // Show result view after generation
  if (hasImages || isGenerating) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {isGenerating ? (
            <div className="w-full max-w-[640px] aspect-square rounded-2xl bg-card animate-shimmer flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Generating...</span>
              </div>
            </div>
          ) : currentImage ? (
            <>
              <div className="w-full max-w-[640px] rounded-2xl overflow-hidden">
                <img
                  src={currentImage.url}
                  alt={currentImage.prompt}
                  className="w-full object-cover animate-fade-in"
                />
              </div>

              {/* Variations */}
              <div className="w-full max-w-[640px] flex gap-2 mt-3">
                {generatedImages.slice(0, 4).map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`flex-1 h-16 rounded-xl overflow-hidden border-[1.5px] transition-colors ${
                      i === currentImageIndex ? 'border-primary' : 'border-border/50 hover:border-muted-foreground/40'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="w-full max-w-[640px] flex justify-end gap-2.5 mt-4">
                <button
                  onClick={generate}
                  className="h-9 px-4 rounded-xl border border-border/50 text-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-card transition-colors"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </button>
                <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:brightness-90 transition-all">
                  <Download size={14} />
                  Download
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // Default: inspiration feed
  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Explore ideas</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="columns-2 lg:columns-3 gap-3 space-y-3">
          {filtered.map((item, i) => (
            <button
              key={`${item.image}-${i}`}
              onClick={() => handleUse(item)}
              className="group relative break-inside-avoid w-full rounded-xl overflow-hidden block"
            >
              <img
                src={item.image}
                alt=""
                className={`w-full ${item.height} object-cover transition-transform duration-300 group-hover:scale-[1.03]`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                <p className="text-xs text-foreground/90 line-clamp-2 mb-2">{item.prompt}</p>
                <span className="self-start px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-medium">
                  Use this
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
