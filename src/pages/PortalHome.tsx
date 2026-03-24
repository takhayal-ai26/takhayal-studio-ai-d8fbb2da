import { useNavigate } from 'react-router-dom';
import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TOOLS } from '@/data/tools';

import toolGenerate from '@/assets/tools/tool-generate.jpg';
import toolUpscale from '@/assets/tools/tool-upscale.jpg';
import toolLogo from '@/assets/tools/tool-logo.jpg';
import toolRemovebg from '@/assets/tools/tool-removebg.jpg';
import toolEnhance from '@/assets/tools/tool-enhance.jpg';

const toolImages: Record<string, string> = {
  'generate': toolGenerate, 'upscale': toolUpscale, 'logo': toolLogo,
  'remove-bg': toolRemovebg, 'enhance': toolEnhance,
};

const toolsData = TOOLS;

const featuredItems = [
  { image: 'https://picsum.photos/seed/feat-cinema/800/450', labelKey: 'cinematicAd', prompt: 'Cinematic product advertisement, dramatic studio lighting, dark moody tones, volumetric fog, 4K commercial quality', template: 'Product Shot' },
  { image: 'https://picsum.photos/seed/feat-fashion/800/450', labelKey: 'fashionEditorial', prompt: 'High-end fashion editorial, modern modest style, soft diffused lighting, clean background, editorial quality', template: 'Fashion' },
  { image: 'https://picsum.photos/seed/feat-ramadan/800/450', labelKey: 'ramadanCampaignLabel', prompt: 'Warm cinematic Ramadan ad, golden lantern, crescent moon, deep purple and gold palette, soft volumetric lighting', template: 'Ramadan' },
  { image: 'https://picsum.photos/seed/feat-realestate/800/450', labelKey: 'architectureLabel', prompt: 'Luxury real estate ad, modern building, blue sky, professional architectural photography, premium feel', template: 'Real Estate' },
];

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

export default function PortalHome() {
  const navigate = useNavigate();
  const { setPrompt, setSelectedTemplate, setActivePage } = useApp();
  const { t, isRTL } = useLanguage();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');

  const categoryKeys = [
    { key: 'All', label: t.portal.all },
    { key: 'Ads', label: t.portal.ads },
    { key: 'Social', label: t.portal.social },
    { key: 'Fashion', label: t.portal.fashion },
    { key: 'Products', label: t.portal.products },
    { key: 'Food', label: t.portal.food },
    { key: 'Architecture', label: t.portal.architecture },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCarouselIndex(i => (i + 1) % featuredItems.length), 5000);
    return () => clearInterval(timer);
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

  return (
    <div className="flex-1 pt-16 overflow-y-auto">

        {/* ── Section 1: Featured Carousel ── */}
        <section className="relative w-full overflow-hidden">
          <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(${isRTL ? '' : '-'}${carouselIndex * 100}%)` }}>
            {featuredItems.map((item, i) => (
              <div key={i} className="w-full flex-shrink-0 relative aspect-[21/9] min-h-[260px] max-h-[400px]">
                <img src={item.image} alt={(t.portal as any)[item.labelKey]} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} p-6 md:p-10`}>
                  <span className="text-[11px] uppercase tracking-widest text-primary font-medium">{t.portal.featured}</span>
                  <h2 className="text-2xl md:text-3xl font-extralight text-foreground mt-1">{(t.portal as any)[item.labelKey]}</h2>
                  <button onClick={() => goToCanvas(item.prompt, item.template)} className="mt-4 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-80 transition-opacity">
                    {t.portal.tryThisStyle}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={`absolute bottom-4 ${isRTL ? 'left-6' : 'right-6'} flex gap-1.5`}>
            {featuredItems.map((_, i) => (
              <button key={i} onClick={() => setCarouselIndex(i)} className={`w-2 h-2 rounded-full transition-colors ${i === carouselIndex ? 'bg-primary' : 'bg-foreground/20'}`} />
            ))}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-5 md:px-8">

          {/* ── Section 2: Seasonal Banner ── */}
          <section className="my-8">
            <button onClick={() => goToCanvas(TEMPLATE_PROMPTS['Ramadan'], 'Ramadan')} className="group w-full relative h-36 md:h-44 rounded-xl overflow-hidden border border-border hover:border-primary transition-colors">
              <img src="https://picsum.photos/seed/banner-ramadan/1200/400" alt={t.portal.ramadanCampaign} className="w-full h-full object-cover" loading="lazy" />
              <div className={`absolute inset-0 bg-gradient-to-${isRTL ? 'l' : 'r'} from-background/90 via-background/50 to-transparent`} />
              <div className={`absolute inset-0 flex flex-col justify-center px-6 md:px-10`}>
                <span className="text-[11px] uppercase tracking-widest text-primary font-medium">{t.portal.seasonal}</span>
                <h3 className="text-xl md:text-2xl font-extralight text-foreground mt-1">{t.portal.ramadanCampaign}</h3>
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-primary font-medium group-hover:gap-2 transition-all">
                  {t.portal.tryThisStyle} <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
                </span>
              </div>
            </button>
          </section>

          {/* ── Section 3: Image Tools Strip ── */}
          <section className="my-8">
            <div className="rounded-2xl bg-card/40 border border-border overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="relative flex-shrink-0 lg:w-[300px] p-8 lg:p-10 flex flex-col justify-center">
                  <div className="absolute inset-0 opacity-[0.06]" style={{ background: 'radial-gradient(ellipse at 30% 50%, hsl(var(--primary)), transparent 70%)' }} />
                  <div className="relative">
                    <Sparkles size={18} className="text-primary mb-4 opacity-70" />
                    <h2 className="text-2xl md:text-3xl font-extralight text-foreground leading-tight">
                      {t.portal.whatWillYouCreate}<br />
                      <span className="text-primary font-light">{t.portal.createToday}</span>
                    </h2>
                    <p className="text-[13px] text-muted-foreground mt-4 leading-relaxed max-w-[240px]">{t.portal.toolsIntro}</p>
                    <button onClick={() => navigate('/tools')} className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition-all group">
                      {t.portal.exploreAllTools}
                      <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 p-4 lg:p-5 min-w-max">
                    {toolsData.map(tool => {
                      const img = toolImages[tool.id] || tool.image;
                      return (
                        <button key={tool.id} onClick={() => navigate(tool.route)} className="group relative flex-shrink-0 w-[180px] md:w-[200px] aspect-[3/4] rounded-2xl overflow-hidden hover:scale-[1.03] transition-all duration-500">
                          <img src={img} alt={tool.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" loading="lazy" width={200} height={267} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute inset-0 bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <span className="text-[14px] font-medium text-foreground block">{tool.name}</span>
                            <span className="text-[11px] text-foreground/50 mt-0.5 block">{tool.shortDesc}</span>
                            <ArrowRight size={13} className={`text-primary mt-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ${isRTL ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section: Inspiration Templates ── */}
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-light text-foreground">{t.portal.startFromPowerful}</h2>
                <p className="text-[13px] text-muted-foreground mt-1.5">{t.portal.readyMadePrompts}</p>
              </div>
              <button onClick={() => navigate('/templates')} className="hidden md:flex items-center gap-1.5 text-[12px] text-primary font-medium hover:underline group">
                {t.portal.exploreAllTemplates} <ArrowRight size={12} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {categoryKeys.map(cat => (
                <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`flex-shrink-0 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                  activeCategory === cat.key
                    ? 'bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.3)]'
                    : 'bg-card/60 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                }`}>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {filteredMasonry.map((item, i) => (
                <button key={i} onClick={() => goToCanvas(item.prompt, item.template)} className="group relative w-full rounded-2xl overflow-hidden break-inside-avoid block">
                  <img src={item.image} alt={item.prompt} className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <p className="text-[12px] text-foreground/90 line-clamp-1 mb-2">{item.prompt}</p>
                    <span className="inline-flex items-center gap-1 h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium">
                      {t.portal.use} <ArrowRight size={10} className={isRTL ? 'rotate-180' : ''} />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-[13px] text-muted-foreground mb-3">{t.portal.needMoreInspiration}</p>
              <button onClick={() => navigate('/templates')} className="h-10 px-6 rounded-lg border border-border text-foreground text-[13px] font-medium hover:border-primary hover:text-primary transition-all group inline-flex items-center gap-2">
                {t.portal.exploreTemplates}
                <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </section>

          {/* ── Community Works Teaser ── */}
          <section className="mt-6 mb-14">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-lg font-medium text-foreground">{t.portal.communityWorks}</h2>
                <p className="text-[13px] text-muted-foreground mt-1">{t.portal.seeWhatCreators}</p>
              </div>
              <button onClick={() => navigate('/community')} className="text-[12px] text-primary font-medium hover:underline flex items-center gap-1 group">
                {t.portal.exploreCommunity} <ArrowRight size={12} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {[
                { img: 'https://picsum.photos/seed/cw-fashion/400/550', prompt: 'High-end fashion editorial, modern modest style' },
                { img: 'https://picsum.photos/seed/cw-product/400/360', prompt: 'Luxury perfume bottle, dramatic studio lighting' },
                { img: 'https://picsum.photos/seed/cw-food/400/480', prompt: 'Artisan coffee flat lay, warm morning light' },
                { img: 'https://picsum.photos/seed/cw-cinema/400/420', prompt: 'Cinematic portrait, volumetric fog, moody tones' },
                { img: 'https://picsum.photos/seed/cw-logo/400/400', prompt: 'Premium 3D logo mockup, golden metallic finish' },
                { img: 'https://picsum.photos/seed/cw-arch/400/520', prompt: 'Modern villa exterior, blue sky, lush garden' },
              ].map((item, i) => (
                <button key={i} onClick={() => navigate('/community')} className="group relative w-full rounded-2xl overflow-hidden break-inside-avoid block">
                  <img src={item.img} alt={item.prompt} className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-[11px] text-foreground/80 line-clamp-1">{item.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-[13px] text-muted-foreground mb-4">{t.portal.exploreMoreCommunity}</p>
              <button onClick={() => navigate('/community')} className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition-all group inline-flex items-center gap-2">
                {t.portal.goToCommunity}
                <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </section>

        </div>
      </div>
      <AuthModal />
    </div>
  );
}
