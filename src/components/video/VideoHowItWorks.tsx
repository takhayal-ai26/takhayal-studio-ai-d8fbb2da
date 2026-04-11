import { Image, Type, Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function VideoHowItWorks() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const steps = [
    {
      icon: <Image size={22} className="text-primary" />,
      title: isAr ? 'أضف صورة' : 'Add an image',
      desc: isAr ? 'ارفع صورة بداية لتحريكها أو ابدأ من وصف نصي' : 'Upload a starting frame to animate, or begin with a text prompt',
    },
    {
      icon: <Type size={22} className="text-primary" />,
      title: isAr ? 'صف الحركة' : 'Describe the motion',
      desc: isAr ? 'اكتب وصفاً لحركة الكاميرا والمشهد الذي تريده' : 'Write a prompt describing the camera movement and scene you want',
    },
    {
      icon: <Sparkles size={22} className="text-primary" />,
      title: isAr ? 'ولّد الفيديو' : 'Generate your video',
      desc: isAr ? 'اضغط توليد وشاهد الذكاء الاصطناعي يحول وصفك إلى فيديو سينمائي' : 'Click generate and watch AI turn your description into a cinematic video',
    },
  ];

  return (
    <div className="py-8 px-1">
      <div className="grid grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="relative rounded-2xl p-6 bg-card/50 dark:bg-card/30 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="absolute top-4 right-5 text-[64px] font-black text-muted-foreground/[0.04] leading-none select-none">
              {i + 1}
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              {step.icon}
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1.5">{step.title}</h4>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
