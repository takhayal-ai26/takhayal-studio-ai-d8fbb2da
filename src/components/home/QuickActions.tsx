import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Image, ArrowUpCircle, Eraser, Wand2, Pencil } from 'lucide-react';

const actions = [
  { icon: Image, en: 'Generate Image', ar: 'إنشاء صورة', route: '/studio' },
  { icon: Pencil, en: 'Edit Image', ar: 'تعديل الصورة', route: '/tools/edit-image' },
  { icon: ArrowUpCircle, en: 'Upscale', ar: 'تكبير', route: '/tools/upscale' },
  { icon: Wand2, en: 'Enhance', ar: 'تحسين', route: '/tools/enhance' },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="my-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="typo-heading-section mb-4">
        {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => navigate(a.route)}
            className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-card/60 border border-border/10 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 group"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
              <a.icon size={22} />
            </div>
            <span className="text-[13px] font-medium text-foreground/80">{isAr ? a.ar : a.en}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
