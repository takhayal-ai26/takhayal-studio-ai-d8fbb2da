import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { useVideoModels } from '@/hooks/useVideoModels';
import { Cpu, Film, Sparkles } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';
import { localizePath } from '@/lib/localized-routes';

type FilterType = 'all' | 'image' | 'video';

function ModelCard({ guide, isAr, lang }: { guide: any; isAr: boolean; lang: 'ar' | 'en' }) {
  const navigate = useNavigate();
  const name = isAr ? guide.name_ar || guide.name_en : guide.name_en;
  const title = isAr ? guide.title_ar || guide.title_en : guide.title_en;
  const bestFor = isAr ? guide.best_for_line_ar || guide.short_description_ar : guide.best_for_line_en || guide.short_description_en;
  const isVideo = guide.type === 'video';
  const imageUrl = guide.display_image_url || guide.main_image_url;
  const openDetails = () => navigate(localizePath(`/models/${guide.slug}`, lang));
  const startCreating = () => {
    const target = isVideo
      ? `/video?modelId=${encodeURIComponent(guide.linked_model_id || guide.slug)}`
      : `/studio${guide.linked_model_id ? `?modelId=${encodeURIComponent(guide.linked_model_id)}` : ''}`;
    navigate(localizePath(target, lang));
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-card/60 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] text-start w-full">
      <button
        onClick={openDetails}
        className="block w-full text-start"
        aria-label={isAr ? `تفاصيل ${name}` : `${name} details`}
      >
        <div className="aspect-video relative bg-zinc-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            {isVideo ? <Film size={40} className="text-primary/30" /> : <Cpu size={40} className="text-primary/30" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-primary/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-white font-bold text-lg md:text-xl leading-tight">{name}</h3>
          {title && <p className="text-white/50 text-[13px] mt-1 line-clamp-1">{title}</p>}
          {bestFor && <p className="text-white/65 text-[12px] mt-2 line-clamp-2">{bestFor}</p>}
        </div>
        </div>
      </button>
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={startCreating}
          className="h-9 flex-1 rounded-lg bg-primary px-3 text-[12px] font-bold text-primary-foreground hover:brightness-110 transition-all"
        >
          {isAr ? 'ابدأ الآن' : 'Create Now'}
        </button>
        <button
          onClick={openDetails}
          className="h-9 rounded-lg bg-muted/40 px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          {isAr ? 'التفاصيل' : 'Details'}
        </button>
      </div>
    </div>
  );
}

export default function ModelsDirectory() {
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { imageGuides, videoGuides, loading } = useModelGuides();
  const { models: videoModels, loading: videoModelsLoading } = useVideoModels(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const videoPreviewByKey = new Map<string, string>();
  videoModels.forEach(model => {
    if (!model.preview_image_url) return;
    videoPreviewByKey.set(model.id, model.preview_image_url);
    if (model.name) videoPreviewByKey.set(slugify(model.name), model.preview_image_url);
    if (model.display_name) videoPreviewByKey.set(slugify(model.display_name), model.preview_image_url);
  });

  const displayVideoGuides = videoGuides.map(guide => ({
    ...guide,
    display_image_url:
      guide.main_image_url ||
      (guide.linked_model_id ? videoPreviewByKey.get(guide.linked_model_id) : '') ||
      videoPreviewByKey.get(guide.slug) ||
      videoPreviewByKey.get(slugify(guide.name_en || '')) ||
      '',
  }));

  const allGuides = [...imageGuides, ...displayVideoGuides];

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: isAr ? 'الكل' : 'All' },
    { key: 'image', label: isAr ? 'صور' : 'Image' },
    { key: 'video', label: isAr ? 'فيديو' : 'Video' },
  ];

  const showImage = filter === 'all' || filter === 'image';
  const showVideo = filter === 'all' || filter === 'video';
  const seoTitle = isAr ? 'جميع النماذج' : 'All Models';
  const seoDescription = isAr
    ? 'اكتشف نماذج الصور والفيديو المتاحة داخل تخيّل، واختر المحرك المناسب لأسلوبك الإبداعي.'
    : 'Discover the image and video models available in Takhayal and choose the right engine for your creative workflow.';
  const modelSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: seoTitle,
    itemListElement: allGuides.slice(0, 20).map((guide, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(localizePath(`/models/${guide.slug}`, lang)),
      name: isAr ? guide.name_ar || guide.name_en : guide.name_en,
      description: isAr ? guide.short_description_ar || guide.short_description_en : guide.short_description_en,
    })),
  };

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <PageSeo
        title={`${seoTitle} | Takhayal.ai`}
        description={seoDescription}
        canonicalPath="/models"
        pageType="CollectionPage"
        schemas={loading ? [] : [modelSchema]}
      />
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8 pb-4">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {isAr ? 'جميع النماذج' : 'All Models'}
          </h1>
          <p className="text-muted-foreground text-[15px] mt-3 max-w-lg mx-auto">
            {isAr ? 'اختر محرك الذكاء الاصطناعي المناسب لرؤيتك الإبداعية' : 'Choose the right AI engine for your creative vision'}
          </p>
        </div>

        {/* Filters — desktop sticky */}
        <div className="hidden md:flex justify-center gap-2 mb-10 sticky top-14 z-20 py-3">
          <div className="flex gap-1 p-1 rounded-full bg-muted/50 backdrop-blur-sm">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile filters */}
        <div className="flex md:hidden gap-2 mb-8 overflow-x-auto scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex min-h-11 flex-shrink-0 items-center px-4 py-2.5 rounded-full text-[13px] font-medium transition-all ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading || videoModelsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Image Models */}
            {showImage && (
              <section className="mb-12">
                <p className="text-[12px] uppercase tracking-widest font-semibold text-primary mb-5">
                  {isAr ? 'توليد الصور' : 'IMAGE GENERATION'}
                </p>
                {imageGuides.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {imageGuides.map(g => <ModelCard key={g.id} guide={g} isAr={isAr} lang={lang} />)}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-8 text-center">{isAr ? 'قريبًا' : 'Coming soon'}</p>
                )}
              </section>
            )}

            {/* Video Models */}
            {showVideo && (
              <section className="mb-12">
                <p className="text-[12px] uppercase tracking-widest font-semibold text-primary mb-5">
                  {isAr ? 'توليد الفيديو' : 'VIDEO GENERATION'}
                </p>
                {displayVideoGuides.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayVideoGuides.map(g => <ModelCard key={g.id} guide={g} isAr={isAr} lang={lang} />)}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-8 text-center">{isAr ? 'قريبًا' : 'Coming soon'}</p>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
