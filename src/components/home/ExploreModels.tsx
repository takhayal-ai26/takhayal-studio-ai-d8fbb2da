import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const ALL_MODELS = [
  { name: 'Nano Banana Pro', slug: 'nano-banana-pro' },
  { name: 'Seedream 4.5', slug: 'seedream-4-5' },
  { name: 'Nano Banana 2', slug: 'nano-banana-2' },
  { name: 'Ideogram V3', slug: 'ideogram-v3' },
  { name: 'FLUX 1.1 Pro', slug: 'flux-1-1-pro' },
  { name: 'GPT Image 1.5', slug: 'gpt-image-1-5' },
  { name: 'Imagen 4', slug: 'imagen-4' },
  { name: 'Qwen Image', slug: 'qwen-image' },
  { name: 'Kling v2.6 Pro', slug: 'kling-v2-6-pro' },
  { name: 'Seedance 1.5 Pro', slug: 'seedance-1-5-pro' },
  { name: 'Wan 2.6', slug: 'wan-2-6' },
  { name: 'Hailuo 2.3', slug: 'hailuo-2-3' },
  { name: 'Veo 3.1', slug: 'veo-3-1' },
  { name: 'Grok Imagine', slug: 'grok-imagine' },
  { name: 'Seedream 5.0 Lite', slug: 'seedream-5-0-lite' },
  { name: 'Kling v3.0 Pro', slug: 'kling-v3-pro' },
];

export function ExploreModels() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  // 3× duplication for seamless -33.333% loop
  const tripled = [...ALL_MODELS, ...ALL_MODELS, ...ALL_MODELS];

  return (
    <section
      className="relative w-full py-20 explore-section-bg"
      style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}
    >
      {/* Subtle ember gradient at bottom */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(240,62,27,0.04) 100%)' }} />

      {/* Heading */}
      <div className="relative text-center px-5 md:px-8 mb-12" style={{ marginBottom: 48 }}>
        <h2
          className="font-bold text-foreground"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
        >
          {isAr ? 'استكشف نماذجنا' : 'Explore Our Models'}
        </h2>
        <div className="mx-auto mt-2 rounded-full" style={{ width: 60, height: 2, background: '#F03E1B' }} />
        <p className="mt-3 text-base text-muted-foreground">
          {isAr ? 'محركات الذكاء الاصطناعي التي تشغّل إبداعاتك' : 'Powerful AI engines behind your creations'}
        </p>
      </div>

      {/* Single ticker row */}
      <div
        className="marquee-row relative overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      >
        <div
          className={`flex w-max ${isRTL ? 'animate-marquee-right' : 'animate-marquee-left'}`}
          style={{ gap: 16 }}
        >
          {tripled.map((m, i) => (
            <button
              key={`${m.slug}-${i}`}
              onClick={() => navigate(`/models/${m.slug}`)}
              className="explore-badge flex-shrink-0 whitespace-nowrap cursor-pointer rounded-full text-base font-semibold transition-all duration-200"
              style={{ height: 52, padding: '0 28px', lineHeight: '52px' }}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative text-center px-5 md:px-8" style={{ marginTop: 48 }}>
        <button
          onClick={() => navigate('/models')}
          className="inline-flex items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{
            height: 52,
            padding: '0 32px',
            background: 'linear-gradient(135deg, #F03E1B 0%, #d4341a 50%, #c42d15 100%)',
            boxShadow: '0 4px 16px rgba(240,62,27,0.2)',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(240,62,27,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(240,62,27,0.2)')}
        >
          {isAr ? 'تصفح جميع النماذج' : 'Browse All Models'}
          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border" />
    </section>
  );
}
