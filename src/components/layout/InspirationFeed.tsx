import { useState } from 'react';
import { useApp, TEMPLATE_PROMPTS } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTemplates, FrontendTemplate } from '@/hooks/useTemplates';
import { GenerationGrid } from './GenerationGrid';
import { StudioTemplates } from './StudioTemplates';
import { useStudioTemplates } from '@/hooks/useStudioTemplates';

const FALLBACK_ITEMS = [
  { image: 'https://picsum.photos/seed/cine1/400/500', promptEn: 'Cinematic perfume ad, dramatic lighting, dark background, luxury feel', promptAr: 'إعلان عطر سينمائي، إضاءة درامية، خلفية داكنة، طابع فاخر', category: 'Ads', height: 'h-[280px]' },
  { image: 'https://picsum.photos/seed/fashion2/400/600', promptEn: 'High-end modest fashion editorial, soft studio lighting, clean background', promptAr: 'تصوير أزياء محتشمة راقية، إضاءة استوديو ناعمة، خلفية نظيفة', category: 'Fashion', height: 'h-[340px]' },
  { image: 'https://picsum.photos/seed/food3/400/400', promptEn: 'Gourmet restaurant dish, professional food photography, warm tones, steam rising', promptAr: 'طبق مطعم فاخر، تصوير طعام احترافي، ألوان دافئة، بخار متصاعد', category: 'Food', height: 'h-[240px]' },
  { image: 'https://picsum.photos/seed/arch4/400/550', promptEn: 'Modern luxury villa, blue sky, architectural photography, wide angle', promptAr: 'فيلا فاخرة عصرية، سماء زرقاء، تصوير معماري، زاوية واسعة', category: 'Architecture', height: 'h-[300px]' },
  { image: 'https://picsum.photos/seed/prod5/400/450', promptEn: 'Premium watch on marble surface, studio lighting, commercial quality', promptAr: 'ساعة فاخرة على سطح رخامي، إضاءة استوديو، جودة تجارية', category: 'Products', height: 'h-[260px]' },
  { image: 'https://picsum.photos/seed/social6/400/500', promptEn: 'Trendy Instagram post, bold modern aesthetic, vibrant colors, social media ready', promptAr: 'منشور إنستغرام عصري، جماليات جريئة، ألوان نابضة، جاهز للنشر', category: 'Social', height: 'h-[290px]' },
  { image: 'https://picsum.photos/seed/ram7/400/520', promptEn: TEMPLATE_PROMPTS['Ramadan'], promptAr: 'فوانيس رمضان ذهبية، إضاءة دافئة، أضواء بوكيه، أجواء روحانية', category: 'Ads', height: 'h-[310px]' },
  { image: 'https://picsum.photos/seed/fash8/400/480', promptEn: 'Streetwear lookbook, urban backdrop, moody lighting, editorial quality', promptAr: 'كتالوج أزياء شارع، خلفية حضرية، إضاءة درامية، جودة تحريرية', category: 'Fashion', height: 'h-[270px]' },
  { image: 'https://picsum.photos/seed/prod9/400/420', promptEn: 'Skincare product flatlay, minimal white background, soft shadows, clean aesthetic', promptAr: 'عرض منتجات عناية بالبشرة، خلفية بيضاء بسيطة، ظلال ناعمة، جمالية نظيفة', category: 'Products', height: 'h-[250px]' },
  { image: 'https://picsum.photos/seed/food10/400/560', promptEn: 'Arabic coffee setup, dates, traditional, warm golden hour lighting', promptAr: 'طقم قهوة عربية، تمور، تقليدي، إضاءة ساعة ذهبية دافئة', category: 'Food', height: 'h-[320px]' },
  { image: 'https://picsum.photos/seed/arch11/400/440', promptEn: 'Futuristic office interior, glass and steel, professional real estate photography', promptAr: 'مكتب داخلي مستقبلي، زجاج وفولاذ، تصوير عقاري احترافي', category: 'Architecture', height: 'h-[260px]' },
  { image: 'https://picsum.photos/seed/social12/400/500', promptEn: 'YouTube thumbnail, energetic, bold text space, eye-catching composition', promptAr: 'صورة مصغرة يوتيوب، حيوية، مساحة نص جريئة، تكوين لافت', category: 'Social', height: 'h-[280px]' },
];

export function InspirationFeed() {
  const { setPrompt, setSelectedTemplate, generatedImages, isGenerating, gallery } = useApp();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const { templates: studioTemplates } = useStudioTemplates();

  const CATEGORIES_LOCALIZED = [
    { key: 'All', label: t.portal.all }, { key: 'Ads', label: t.portal.ads },
    { key: 'Social', label: t.portal.social }, { key: 'Fashion', label: t.portal.fashion },
    { key: 'Products', label: t.portal.products }, { key: 'Food', label: t.portal.food },
    { key: 'Architecture', label: t.portal.architecture },
  ];

  const feedItems = FALLBACK_ITEMS.map(item => ({
    ...item,
    prompt: isAr ? item.promptAr : item.promptEn,
  }));

  const filtered = activeCategory === 'All' ? feedItems : feedItems.filter(item => item.category === activeCategory);
  const handleUse = (item: typeof feedItems[0]) => { setPrompt(item.prompt); setSelectedTemplate(null); };

  const hasActivity = gallery.length > 0 || isGenerating;

  if (hasActivity) {
    return <GenerationGrid />;
  }

  const hasStudioTemplates = studioTemplates.length > 0;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main inspiration feed */}
      <div className={`flex-1 flex flex-col overflow-hidden ${hasStudioTemplates ? 'border-r border-border/5' : ''}`}>
        <div className="flex-shrink-0 px-5 pt-5 pb-3">
          <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.15em] mb-3">{t.studio.exploreIdeas}</p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES_LOCALIZED.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.key
                    ? 'bg-primary text-primary-foreground shadow-[0_2px_12px_-2px] shadow-primary/30'
                    : 'bg-card/40 text-muted-foreground/60 hover:text-foreground/80 hover:bg-card/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="columns-2 lg:columns-3 gap-2.5 space-y-2.5">
            {filtered.map((item, i) => (
              <button
                key={`${item.image}-${i}`}
                onClick={() => handleUse(item)}
                className="group relative break-inside-avoid w-full rounded-xl overflow-hidden block"
              >
                <img src={item.image} alt="" className={`w-full ${item.height} object-cover transition-all duration-500 group-hover:scale-[1.04] group-hover:brightness-110`} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                  <p className="text-[11px] text-foreground/90 line-clamp-2 leading-relaxed mb-2">{item.prompt}</p>
                  <span className="self-start px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shadow-lg shadow-primary/20">{t.studio.useThis}</span>
                </div>
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.04] group-hover:ring-primary/15 transition-all duration-300 pointer-events-none" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right-side featured templates */}
      {hasStudioTemplates && (
        <aside className="hidden xl:flex flex-col w-[280px] 2xl:w-[320px] flex-shrink-0 bg-background">
          <StudioTemplates />
        </aside>
      )}
    </div>
  );
}
