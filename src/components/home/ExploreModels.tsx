import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { ArrowRight, Cpu } from 'lucide-react';

export function ExploreModels() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { featuredGuides, loading } = useModelGuides();

  if (loading || featuredGuides.length === 0) return null;

  return (
    <section className="my-8">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="typo-heading-section font-extrabold text-4xl">
            {isAr ? 'استكشف النماذج' : 'Explore our models'}
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            {isAr ? 'محركات الذكاء الاصطناعي التي تشغّل إبداعاتك' : 'Powerful AI engines behind your creations'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-5 px-5 md:-mx-8 md:px-8">
        <div className="flex gap-4 min-w-max pb-2">
          {featuredGuides.map(guide => (
            <button
              key={guide.id}
              onClick={() => navigate(`/models/${guide.slug}`)}
              className="group relative flex-shrink-0 w-[200px] md:w-[240px] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-400 hover:scale-[1.02]"
            >
              {/* 1:1 square image */}
              <div className="aspect-square relative">
                {guide.main_image_url ? (
                  <img
                    src={guide.main_image_url}
                    alt={isAr ? guide.name_ar : guide.name_en}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Cpu size={48} className="text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {((isAr ? guide.tags_ar : guide.tags_en) || []).slice(0, 1).map((tag, i) => (
                    <span key={i} className="inline-block text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5 mb-2">
                      {tag}
                    </span>
                  ))}
                  <h3 className="text-white font-bold text-base leading-tight">
                    {isAr ? guide.name_ar : guide.name_en}
                  </h3>
                  <p className="text-white/60 text-[12px] mt-1 line-clamp-1">
                    {isAr ? guide.title_ar : guide.title_en}
                  </p>
                  <ArrowRight
                    size={14}
                    className={`text-primary mt-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ${isRTL ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
