import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Download, RefreshCw } from 'lucide-react';

export function ContinueWhereLeftOff() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === 'ar';

  const { data: recentImages = [] } = useQuery({
    queryKey: ['recent-generations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('generation_logs')
        .select('id, prompt, image_url, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  if (recentImages.length === 0) return null;

  return (
    <section className="my-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground font-extrabold text-xl">
          {isAr ? 'أكمل من حيث توقفت' : 'Continue where you left off'}
        </h2>
        <button
          onClick={() => navigate('/gallery')}
          className="text-[12px] text-primary font-medium hover:underline flex items-center gap-1 group"
        >
          {isAr ? 'عرض الكل' : 'View all'}
          <ArrowRight size={12} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {recentImages.map((img) => (
          <button
            key={img.id}
            onClick={() => navigate('/gallery')}
            className="group relative aspect-square rounded-xl overflow-hidden bg-muted/30"
          >
            <img
              src={img.image_url!}
              alt={img.prompt || ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white/80 line-clamp-2">
                {img.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
