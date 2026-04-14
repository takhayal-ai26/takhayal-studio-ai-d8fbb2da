import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { Cpu, Film, Sparkles } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

type FilterType = 'all' | 'image' | 'video';

function ModelCard({ guide, isAr }: { guide: any; isAr: boolean }) {
  const navigate = useNavigate();
  const name = isAr ? guide.name_ar || guide.name_en : guide.name_en;
  const title = isAr ? guide.title_ar || guide.title_en : guide.title_en;
  const isVideo = guide.type === 'video';

  return (
    <button
      onClick={() => navigate(`/models/${guide.slug}`)}
      className="group relative rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] text-start w-full"
    >
      <div className="aspect-video relative bg-zinc-900">
        {guide.main_image_url ? (
          <img
            src={guide.main_image_url}
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
        </div>
      </div>
    </button>
  );
}

export default function ModelsDirectory() {
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { imageGuides, videoGuides, loading } = useModelGuides();
  const [filter, setFilter] = useState<FilterType>('all');

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: isAr ? 'الكل' : 'All' },
    { key: 'image', label: isAr ? 'صور' : 'Image' },
    { key: 'video', label: isAr ? 'فيديو' : 'Video' },
  ];

  const showImage = filter === 'all' || filter === 'image';
  const showVideo = filter === 'all' || filter === 'video';

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
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
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
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
                    {imageGuides.map(g => <ModelCard key={g.id} guide={g} isAr={isAr} />)}
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
                {videoGuides.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {videoGuides.map(g => <ModelCard key={g.id} guide={g} isAr={isAr} />)}
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
