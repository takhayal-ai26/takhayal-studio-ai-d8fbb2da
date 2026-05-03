import { Clapperboard, CloudUpload, Expand, Lightbulb, Play, RotateCcw, Sparkles, Video, WandSparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function VideoHowItWorks() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const steps = [
    {
      title: isAr ? 'أضف صورة' : 'Add an image',
      desc: isAr ? 'ارفع صورة بداية لتحريكها أو ابدأ من وصف نصي' : 'Upload a starting frame to animate, or begin with a text prompt',
      preview: 'image',
    },
    {
      title: isAr ? 'صف الحركة' : 'Describe the motion',
      desc: isAr ? 'اكتب وصفاً لحركة الكاميرا والمشهد الذي تريده' : 'Write a prompt describing the camera movement and scene you want',
      preview: 'prompt',
    },
    {
      title: isAr ? 'ولّد الفيديو' : 'Generate your video',
      desc: isAr ? 'اضغط توليد وشاهد الذكاء الاصطناعي يحول وصفك إلى فيديو سينمائي' : 'Click generate and watch AI turn your description into a cinematic video',
      preview: 'video',
    },
  ];

  const tips = [
    {
      icon: <Video size={17} />,
      text: isAr ? 'كن محدداً في حركة الكاميرا والزوايا' : 'Be specific about camera movements and angles',
    },
    {
      icon: <Sparkles size={17} />,
      text: isAr ? 'أضف تفاصيل الإضاءة والمزاج والجو العام' : 'Add details about lighting, mood and atmosphere',
    },
    {
      icon: <Clapperboard size={17} />,
      text: isAr ? 'اذكر النمط أو الإحساس السينمائي المطلوب' : 'Mention the style or cinematic look you want',
    },
    {
      icon: <RotateCcw size={17} />,
      text: isAr ? 'الوصف الأقصر غالباً يعطي نتائج أفضل' : 'Shorter prompts often produce better results',
    },
  ];

  const renderPreview = (type: string) => {
    if (type === 'image') {
      return (
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-3">
          <div className="relative min-h-[138px] overflow-hidden rounded-xl border border-primary/30 bg-[radial-gradient(circle_at_68%_24%,hsl(var(--primary)/0.24),transparent_34%),linear-gradient(135deg,hsl(var(--foreground)/0.14),hsl(var(--muted)/0.44))] shadow-inner">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/70 to-transparent" />
            <div className="absolute bottom-5 start-5 h-10 w-24 rounded-full bg-primary/55 blur-2xl" />
            <div className="absolute bottom-7 start-8 h-8 w-24 rounded-[999px_999px_10px_10px] bg-foreground/75 shadow-[0_12px_34px_hsl(var(--primary)/0.18)]" />
            <div className="absolute bottom-4 start-12 h-6 w-6 rounded-full border-4 border-background bg-foreground/80" />
            <div className="absolute bottom-4 start-[7.5rem] h-6 w-6 rounded-full border-4 border-background bg-foreground/80" />
            <div className="absolute end-3 top-3 h-6 w-10 rounded-full border border-primary/40 bg-primary/15" />
          </div>
          <div className="flex min-h-[138px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-background/35 px-3 text-center">
            <CloudUpload size={26} className="text-muted-foreground/70" />
            <span className="text-[12px] font-semibold text-foreground">
              {isAr ? 'ارفع صورة' : 'Upload image'}
            </span>
            <span className="text-[11px] leading-snug text-muted-foreground">
              {isAr ? 'أو اسحبها هنا' : 'or drag and drop'}
            </span>
          </div>
        </div>
      );
    }

    if (type === 'prompt') {
      return (
        <div className="rounded-xl border border-border/70 bg-background/35 p-4 shadow-inner">
          <p className="min-h-[92px] text-[13px] leading-relaxed text-foreground/80">
            {isAr
              ? 'لقطة سينمائية بطائرة درون، الكاميرا تقترب ببطء، إضاءة ذهبية منخفضة، وغبار يتحرك في الهواء...'
              : 'Cinematic drone shot, camera pushes in from wide to close, low angle, golden hour lighting, dust particles in the air...'}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{isAr ? '98 / 1000' : '98 / 1000'}</span>
            <WandSparkles size={16} className="text-primary/80" />
          </div>
        </div>
      );
    }

    return (
      <div className="relative min-h-[148px] overflow-hidden rounded-xl border border-border/70 bg-[radial-gradient(circle_at_76%_20%,hsl(var(--primary)/0.24),transparent_34%),linear-gradient(135deg,hsl(var(--foreground)/0.12),hsl(var(--muted)/0.48))] shadow-inner">
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-9 start-14 h-8 w-28 rounded-[999px_999px_10px_10px] bg-foreground/75" />
        <div className="absolute bottom-6 start-[4.5rem] h-6 w-6 rounded-full border-4 border-background bg-foreground/80" />
        <div className="absolute bottom-6 start-[9.4rem] h-6 w-6 rounded-full border-4 border-background bg-foreground/80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-foreground shadow-lg backdrop-blur">
            <Play size={18} fill="currentColor" />
          </span>
        </div>
        <div className="absolute bottom-4 start-4 end-4">
          <div className="h-1 rounded-full bg-foreground/15">
            <div className="h-full w-3/5 rounded-full bg-primary" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-foreground/80">
            <span>00:04 / 00:05</span>
            <Expand size={13} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-1 py-8 space-y-7">
      <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-3 xl:gap-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/75 p-5 shadow-[0_18px_44px_hsl(var(--shadow-color))] transition-all hover:-translate-y-0.5 hover:border-primary/20 dark:bg-card/30"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/18 to-transparent" />
            <div className="mb-5 flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-base font-black text-primary shadow-[0_0_24px_hsl(var(--primary)/0.14)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h4 className="text-[15px] font-bold text-foreground">{step.title}</h4>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </div>
            {renderPreview(step.preview)}
            {i < steps.length - 1 && (
              <div className="pointer-events-none absolute top-1/2 hidden h-px w-10 bg-gradient-to-r from-primary/10 via-primary to-primary/10 shadow-[0_0_18px_hsl(var(--primary)/0.55)] ltr:-right-8 rtl:-left-8 lg:block">
                <span className="absolute -top-1 start-1/2 h-2 w-2 -translate-x-1/2 rounded-full border border-primary bg-background shadow-[0_0_18px_hsl(var(--primary)/0.7)]" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/45 dark:bg-card/25 shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
        <div className="absolute inset-y-0 start-0 w-44 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.22),transparent_66%)]" />
        <div className="relative grid items-center gap-5 px-5 py-5 lg:grid-cols-[116px_minmax(0,1fr)] xl:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_38px_hsl(var(--primary)/0.22)]">
              <Lightbulb size={30} strokeWidth={1.8} />
            </div>
            <h4 className="text-sm font-bold text-foreground lg:hidden">
              {isAr ? 'نصائح لنتائج أفضل' : 'Pro tips for better results'}
            </h4>
          </div>

          <div className="min-w-0">
            <h4 className="mb-4 hidden text-sm font-bold text-foreground lg:block">
              {isAr ? 'نصائح لنتائج أفضل' : 'Pro tips for better results'}
            </h4>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex min-w-0 items-center gap-3 rounded-xl border-border/50 px-0 py-1 xl:border-s xl:px-5 xl:first:border-s-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {tip.icon}
                  </span>
                  <span className="text-[13px] font-medium leading-snug text-muted-foreground">
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
