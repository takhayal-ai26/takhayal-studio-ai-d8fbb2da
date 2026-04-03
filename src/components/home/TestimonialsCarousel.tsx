import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Quote } from 'lucide-react';

export function TestimonialsCarousel() {
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const [activeIdx, setActiveIdx] = useState(0);

  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials-home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (testimonials.length < 2) return;
    const interval = setInterval(() => {
      setActiveIdx((c) => (c + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const t = testimonials[activeIdx];
  const name = isAr ? t.name_ar : t.name_en;
  const role = isAr ? t.role_ar : t.role_en;
  const quote = isAr ? t.testimonial_ar : t.testimonial_en;
  const initials = name?.charAt(0) || '?';

  return (
    <section className="my-12 md:my-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-2">
        {isAr ? 'موثوق من قبل المبدعين في الخليج' : 'Trusted by creators across the GCC'}
      </h2>
      <p className="text-[13px] text-muted-foreground text-center mb-8">
        {isAr ? 'اكتشف ما يقوله مستخدمونا' : 'See what our users are saying'}
      </p>

      <div className="flex justify-center">
        <article
          key={`${t.id}-${activeIdx}`}
          className="animate-page-enter relative w-full max-w-[680px] rounded-[20px] bg-card/70 backdrop-blur-xl border border-border/10 p-6 md:p-8"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          <Quote size={28} className="text-primary/20 absolute top-5 right-5" style={{ transform: isAr ? 'scaleX(-1)' : undefined }} />
          <p className="text-base md:text-lg leading-7 md:leading-8 text-foreground/90 mb-6" style={{ minHeight: 56 }}>
            "{quote}"
          </p>
          <div className="flex items-center gap-3">
            {t.avatar_url ? (
              <img src={t.avatar_url} alt={name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-[12px] text-muted-foreground">{role}</p>
            </div>
          </div>
        </article>
      </div>

      {/* Dots */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-5">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeIdx ? 'bg-primary w-5' : 'bg-foreground/15 hover:bg-foreground/25'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
