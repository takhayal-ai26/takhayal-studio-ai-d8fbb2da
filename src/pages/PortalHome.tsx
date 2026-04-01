import { useNavigate, useSearchParams } from 'react-router-dom';
import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTools } from '@/hooks/useTools';
import { useMedia } from '@/hooks/useMedia';
import { DashboardHero } from '@/components/home/DashboardHero';

const featuredItems = [
  { image: 'https://picsum.photos/seed/feat-cinema/800/450', labelKey: 'cinematicAd', promptEn: 'Cinematic product advertisement, dramatic studio lighting, dark moody tones, volumetric fog, 4K commercial quality', promptAr: 'إعلان منتج سينمائي، إضاءة استوديو درامية، ألوان داكنة، ضباب حجمي، جودة تجارية 4K', template: 'Product Shot' },
  { image: 'https://picsum.photos/seed/feat-fashion/800/450', labelKey: 'fashionEditorial', promptEn: 'High-end fashion editorial, modern modest style, soft diffused lighting, clean background, editorial quality', promptAr: 'تصوير أزياء راقي، أسلوب محتشم عصري، إضاءة ناعمة، خلفية نظيفة، جودة تحريرية', template: 'Fashion' },
  { image: 'https://picsum.photos/seed/feat-ramadan/800/450', labelKey: 'ramadanCampaignLabel', promptEn: 'Warm cinematic Ramadan ad, golden lantern, crescent moon, deep purple and gold palette, soft volumetric lighting', promptAr: 'إعلان رمضاني سينمائي دافئ، فانوس ذهبي، هلال، لوحة ألوان بنفسجية وذهبية، إضاءة حجمية ناعمة', template: 'Ramadan' },
  { image: 'https://picsum.photos/seed/feat-realestate/800/450', labelKey: 'architectureLabel', promptEn: 'Luxury real estate ad, modern building, blue sky, professional architectural photography, premium feel', promptAr: 'إعلان عقاري فاخر، مبنى عصري، سماء زرقاء، تصوير معماري احترافي، طابع فاخر', template: 'Real Estate' },
];

const masonryImages = [
  { image: 'https://picsum.photos/seed/m1/400/600', promptEn: 'Luxury perfume ad, dramatic side lighting, dark background, elegant glass bottle', promptAr: 'إعلان عطر فاخر، إضاءة جانبية درامية، خلفية داكنة، زجاجة أنيقة', template: 'Product Shot', cat: 'Products' },
  { image: 'https://picsum.photos/seed/m2/400/400', promptEn: 'Trendy streetwear fashion shoot, urban backdrop, bold colors', promptAr: 'تصوير أزياء شارع عصرية، خلفية حضرية، ألوان جريئة', template: 'Fashion', cat: 'Fashion' },
  { image: 'https://picsum.photos/seed/m3/400/500', promptEn: 'Golden hour restaurant scene, appetizing table spread, warm ambiance', promptAr: 'مشهد مطعم في الساعة الذهبية، مائدة شهية، أجواء دافئة', template: 'Restaurant', cat: 'Food' },
  { image: 'https://picsum.photos/seed/m4/400/350', promptEn: 'Minimalist tech product floating, clean gradient background, 3D render', promptAr: 'منتج تقني عائم بسيط، خلفية متدرجة نظيفة، عرض ثلاثي الأبعاد', template: 'Product Shot', cat: 'Products' },
  { image: 'https://picsum.photos/seed/m5/400/550', promptEn: 'Cinematic Ramadan greeting, lanterns and stars, cinematic depth of field', promptAr: 'تهنئة رمضانية سينمائية، فوانيس ونجوم، عمق مجال سينمائي', template: 'Ramadan', cat: 'Ads' },
  { image: 'https://picsum.photos/seed/m6/400/450', promptEn: 'Instagram story design, bold typography, vibrant gradient, social media', promptAr: 'تصميم ستوري إنستغرام، خطوط عريضة، تدرج نابض، وسائل تواصل', template: 'Reels Cover', cat: 'Social' },
  { image: 'https://picsum.photos/seed/m7/400/380', promptEn: 'Modern villa exterior, blue sky, lush garden, architectural photography', promptAr: 'واجهة فيلا عصرية، سماء زرقاء، حديقة خضراء، تصوير معماري', template: 'Real Estate', cat: 'Architecture' },
  { image: 'https://picsum.photos/seed/m8/400/520', promptEn: 'Haute couture fashion editorial, flowing fabric, studio lighting', promptAr: 'تصوير أزياء راقية، قماش متدفق، إضاءة استوديو', template: 'Fashion', cat: 'Fashion' },
  { image: 'https://picsum.photos/seed/m9/400/440', promptEn: 'Eid celebration ad, festive colors, joyful atmosphere, commercial quality', promptAr: 'إعلان احتفال عيد، ألوان احتفالية، أجواء بهيجة، جودة تجارية', template: 'Eid', cat: 'Ads' },
  { image: 'https://picsum.photos/seed/m10/400/480', promptEn: 'Artisan coffee flat lay, latte art, warm morning light, overhead shot', promptAr: 'عرض قهوة حرفية، فن اللاتيه، ضوء صباحي دافئ، تصوير علوي', template: 'Restaurant', cat: 'Food' },
  { image: 'https://picsum.photos/seed/m11/400/360', promptEn: 'Clean skincare product on marble, soft shadows, premium aesthetic', promptAr: 'منتج عناية بالبشرة على رخام، ظلال ناعمة، جمالية فاخرة', template: 'Product Shot', cat: 'Products' },
  { image: 'https://picsum.photos/seed/m12/400/550', promptEn: 'National Day parade scene, flags and fireworks, patriotic celebration', promptAr: 'مشهد عرض اليوم الوطني، أعلام وألعاب نارية، احتفال وطني', template: 'National Day', cat: 'Ads' },
];

export default function PortalHome() {
  const navigate = useNavigate();
  const { setPrompt, setSelectedTemplate, setActivePage } = useApp();
  const { t, isRTL, lang } = useLanguage();
  const isAr = lang === 'ar';
  const { tools: toolsData } = useTools();
  const { getUrlByName } = useMedia();
  const [activeCategory, setActiveCategory] = useState('All');

  const toolImages: Record<string, string> = {
    'generate': getUrlByName('tool-generate.jpg'),
    'upscale': getUrlByName('tool-upscale.jpg'),
    'logo': getUrlByName('tool-logo.jpg'),
    'remove-bg': getUrlByName('tool-removebg.jpg'),
    'enhance': getUrlByName('tool-enhance.jpg'),
  };

  const categoryKeys = [
    { key: 'All', label: t.portal.all },
    { key: 'Ads', label: t.portal.ads },
    { key: 'Social', label: t.portal.social },
    { key: 'Fashion', label: t.portal.fashion },
    { key: 'Products', label: t.portal.products },
    { key: 'Food', label: t.portal.food },
    { key: 'Architecture', label: t.portal.architecture },
  ];


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
    <div className="flex-1 pt-14 overflow-y-auto animate-page-enter">

        {/* ── Dashboard Hero with Prompt Bar ── */}
        <DashboardHero />

        <div className="max-w-7xl mx-auto px-5 md:px-8">

          {/* ── Section 2: Seasonal Banner ── */}
          <section className="my-8">
            <button onClick={() => goToCanvas(TEMPLATE_PROMPTS['Ramadan'], 'Ramadan')} className="group w-full relative h-36 md:h-44 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <img src="https://picsum.photos/seed/banner-ramadan/1200/400" alt={t.portal.ramadanCampaign} className="w-full h-full object-cover" loading="lazy" />
              <div className={`absolute inset-0 bg-gradient-to-${isRTL ? 'l' : 'r'} from-black/90 via-black/50 to-transparent`} />
              <div className={`absolute inset-0 flex flex-col justify-center px-6 md:px-10`}>
                <span className="text-[11px] uppercase tracking-widest text-primary font-medium">{t.portal.seasonal}</span>
                <h3 className="text-xl md:text-2xl font-extralight text-white mt-1">{t.portal.ramadanCampaign}</h3>
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] text-primary font-medium group-hover:gap-2 transition-all">
                  {t.portal.tryThisStyle} <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
                </span>
              </div>
            </button>
          </section>

          {/* ── Section 3: Image Tools Strip ── */}
          <section className="my-8">
            <div className="rounded-2xl bg-card/40 border border-border/20 overflow-hidden">
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
                        <button key={tool.id} onClick={() => navigate(tool.route)} className="group relative flex-shrink-0 w-[220px] md:w-[260px] aspect-[3/4] rounded-2xl overflow-hidden hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 transition-all duration-400">
                          <img src={img} alt={tool.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" loading="lazy" width={260} height={347} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute inset-0 bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <span className="text-[14px] font-medium text-white block">{tool.name}</span>
                            <span className="text-[11px] text-white/50 mt-0.5 block">{tool.shortDesc}</span>
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
                <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`filter-pill flex-shrink-0 transition-all duration-300 ${
                  activeCategory === cat.key ? 'active' : ''
                }`}>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="columns-2 md:columns-3 lg:columns-4 gap-1.5 [column-fill:_balance]">
              {filteredMasonry.map((item, i) => (
                <button key={i} onClick={() => goToCanvas(isAr ? item.promptAr : item.promptEn, item.template)} className="group w-full rounded-2xl overflow-hidden break-inside-avoid mb-2 block text-left hover:shadow-lg hover:shadow-black/10 transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img src={item.image} alt={item.template} className="w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <h3 className="absolute bottom-2.5 left-3 right-3 text-sm font-semibold text-white leading-tight drop-shadow-md">
                      {item.template}
                    </h3>
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 shadow-lg">
                        {t.portal.use}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-[13px] text-muted-foreground mb-3">{t.portal.needMoreInspiration}</p>
              <button onClick={() => navigate('/templates')} className="h-10 px-6 rounded-full border border-border/30 text-foreground text-[13px] font-medium hover:border-primary/40 hover:text-primary transition-all group inline-flex items-center gap-2">
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
                { img: 'https://picsum.photos/seed/cw-fashion/400/550', promptEn: 'High-end fashion editorial, modern modest style', promptAr: 'تصوير أزياء راقي، أسلوب محتشم عصري' },
                { img: 'https://picsum.photos/seed/cw-product/400/360', promptEn: 'Luxury perfume bottle, dramatic studio lighting', promptAr: 'زجاجة عطر فاخرة، إضاءة استوديو درامية' },
                { img: 'https://picsum.photos/seed/cw-food/400/480', promptEn: 'Artisan coffee flat lay, warm morning light', promptAr: 'عرض قهوة حرفية، ضوء صباحي دافئ' },
                { img: 'https://picsum.photos/seed/cw-cinema/400/420', promptEn: 'Cinematic portrait, volumetric fog, moody tones', promptAr: 'بورتريه سينمائي، ضباب حجمي، ألوان درامية' },
                { img: 'https://picsum.photos/seed/cw-logo/400/400', promptEn: 'Premium 3D logo mockup, golden metallic finish', promptAr: 'نموذج شعار ثلاثي الأبعاد، لمسة معدنية ذهبية' },
                { img: 'https://picsum.photos/seed/cw-arch/400/520', promptEn: 'Modern villa exterior, blue sky, lush garden', promptAr: 'واجهة فيلا عصرية، سماء زرقاء، حديقة خضراء' },
              ].map((item, i) => (
                <button key={i} onClick={() => navigate('/community')} className="group relative w-full rounded-2xl overflow-hidden break-inside-avoid block hover:shadow-lg hover:shadow-black/10 transition-all duration-300">
                  <img src={item.img} alt={isAr ? item.promptAr : item.promptEn} className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-[11px] text-white/80 line-clamp-1">{isAr ? item.promptAr : item.promptEn}</p>
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
  );
}
