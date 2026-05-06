import { Clapperboard, CloudUpload, Expand, Lightbulb, Play, RotateCcw, Sparkles, Video, WandSparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

type StepPreview = 'image' | 'prompt' | 'video';
type VideoGuideVariant = 'generic' | 'motion-control' | 'video-upscale';
type VideoGuideProps = {
  toolSlug?: string | null;
};

const getGuideVariant = (toolSlug?: string | null): VideoGuideVariant =>
  toolSlug === 'motion-control' || toolSlug === 'video-upscale' ? toolSlug : 'generic';

export function VideoHowToUse({ toolSlug }: VideoGuideProps = {}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const variant = getGuideVariant(toolSlug);

  const steps: { title: string; desc: string; preview: StepPreview }[] = [
    {
      title: variant === 'motion-control'
        ? (isAr ? 'ارفع الصورة الأساسية' : 'Upload the source image')
        : variant === 'video-upscale'
          ? (isAr ? 'ارفع الفيديو' : 'Upload the video')
        : (isAr ? 'أضف صورة' : 'Add an image'),
      desc: variant === 'motion-control'
        ? (isAr ? 'اختر الصورة أو الموضوع الذي تريد تحريكه بحركة دقيقة.' : 'Choose the frame or subject you want to animate with controlled motion.')
        : variant === 'video-upscale'
          ? (isAr ? 'ابدأ بفيديو واضح تريد تحسين دقته وتفاصيله.' : 'Start with the clearest video you want to sharpen and enhance.')
        : (isAr ? 'ارفع صورة بداية لتحريكها أو ابدأ من وصف نصي' : 'Upload a starting frame to animate, or begin with a text prompt'),
      preview: 'image',
    },
    {
      title: variant === 'motion-control'
        ? (isAr ? 'حدّد حركة الكاميرا' : 'Direct the camera move')
        : variant === 'video-upscale'
          ? (isAr ? 'صف التحسين المطلوب' : 'Describe the enhancement')
        : (isAr ? 'صف الحركة' : 'Describe the motion'),
      desc: variant === 'motion-control'
        ? (isAr ? 'اكتب حركة واضحة مثل اقتراب، دوران، بان، تلت، أو حركة بسيطة للموضوع.' : 'Describe one clear move: push in, orbit, pan, tilt, zoom, or subtle subject motion.')
        : variant === 'video-upscale'
          ? (isAr ? 'ركّز على الوضوح، الحدة، الملمس، وتقليل التشويش بدل تغيير المشهد.' : 'Focus on clarity, sharpness, texture, and noise cleanup rather than changing the scene.')
        : (isAr ? 'اكتب وصفاً لحركة الكاميرا والمشهد الذي تريده' : 'Write a prompt describing the camera movement and scene you want'),
      preview: 'prompt',
    },
    {
      title: variant === 'motion-control'
        ? (isAr ? 'ولّد حركة متحكم بها' : 'Generate controlled motion')
        : variant === 'video-upscale'
          ? (isAr ? 'ولّد النسخة المحسّنة' : 'Generate the upscale')
        : (isAr ? 'ولّد الفيديو' : 'Generate your video'),
      desc: variant === 'motion-control'
        ? (isAr ? 'حوّل الصورة إلى فيديو قصير بحركة طبيعية واتجاه كاميرا واضح.' : 'Turn the image into a short video with natural motion and a clear camera direction.')
        : variant === 'video-upscale'
          ? (isAr ? 'احصل على فيديو أوضح بتفاصيل أنظف ومظهر عالي الدقة.' : 'Create a cleaner, sharper video with a more polished high-resolution look.')
        : (isAr ? 'اضغط توليد وشاهد الذكاء الاصطناعي يحول وصفك إلى فيديو سينمائي' : 'Click generate and watch AI turn your description into a cinematic video'),
      preview: 'video',
    },
  ];

  const promptExample = variant === 'motion-control'
    ? {
      ar: 'حركة كاميرا بطيئة نحو الوجه، التفاتة خفيفة، إضاءة استوديو هادئة، بدون اهتزاز...',
      en: 'Slow camera push-in toward the face, subtle head turn, steady studio lighting, no shake...',
    }
    : variant === 'video-upscale'
      ? {
        ar: 'حسّن هذا الفيديو بتفاصيل أوضح، ملمس أنظف، تقليل التشويش، ومظهر عالي الدقة...',
        en: 'Enhance this video with sharper details, cleaner texture, reduced noise, and a high-resolution look...',
      }
    : {
      ar: 'لقطة سينمائية بطائرة درون، الكاميرا تقترب ببطء، إضاءة ذهبية منخفضة، وغبار يتحرك في الهواء...',
      en: 'Cinematic drone shot, camera pushes in from wide to close, low angle, golden hour lighting, dust particles in the air...',
    };

  const uploadLabel = variant === 'video-upscale'
    ? (isAr ? 'ارفع فيديو' : 'Upload video')
    : (isAr ? 'ارفع صورة' : 'Upload image');
  const uploadHint = variant === 'video-upscale'
    ? (isAr ? 'MP4 أو MOV' : 'MP4 or MOV')
    : (isAr ? 'أو اسحبها هنا' : 'or drag and drop');

  const renderPreview = (type: StepPreview) => {
    if (type === 'image') {
      return (
        <div className="grid grid-cols-[1.15fr_0.85fr] gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-primary/35 bg-muted shadow-[0_18px_34px_hsl(var(--primary)/0.12)]">
            <img src="/video-cover.jpg" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-primary/10" />
            <div className="absolute inset-2 rounded-lg border border-primary/40" />
          </div>
          <div className="flex aspect-[4/3] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/30 bg-background/35 px-3 text-center">
            <CloudUpload size={25} className="text-muted-foreground/75" />
            <span className="text-[12px] font-semibold text-foreground">
              {uploadLabel}
            </span>
            <span className="text-[11px] leading-snug text-muted-foreground">
              {uploadHint}
            </span>
          </div>
        </div>
      );
    }

    if (type === 'prompt') {
      return (
        <div className="rounded-xl border border-foreground/25 bg-background/35 p-4 shadow-inner">
          <p className="min-h-[76px] text-[13px] leading-relaxed text-foreground/80">
            {isAr ? promptExample.ar : promptExample.en}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>98 / 1000</span>
            <WandSparkles size={16} className="text-primary/80" />
          </div>
        </div>
      );
    }

    return (
      <div className="relative aspect-video overflow-hidden rounded-xl border border-foreground/25 bg-muted shadow-[0_18px_34px_hsl(var(--primary)/0.12)]">
        <img src="/video-cover.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-background/5 to-primary/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-foreground shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur">
            <Play size={18} fill="currentColor" className="ms-0.5" />
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
    <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-3 xl:gap-6">
      {steps.map((step, i) => (
        <div
          key={step.title}
          className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-[0_18px_44px_hsl(var(--shadow-color))] transition-all hover:-translate-y-0.5 hover:border-primary/25 dark:bg-card/30"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/18 to-transparent" />
          <div className="mb-4 flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-base font-black text-primary shadow-[0_0_28px_hsl(var(--primary)/0.18)]">
              {i + 1}
            </span>
            <div className="min-w-0">
              <h4 className="text-[16px] font-bold leading-tight text-foreground">{step.title}</h4>
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
  );
}

export function VideoProTips({ toolSlug }: VideoGuideProps = {}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const variant = getGuideVariant(toolSlug);

  const tips = variant === 'motion-control'
    ? [
      {
        icon: <Video size={17} />,
        text: isAr ? 'استخدم حركة كاميرا واحدة في كل نتيجة' : 'Use one camera move per result',
      },
      {
        icon: <Sparkles size={17} />,
        text: isAr ? 'حدّد السرعة والاتجاه بوضوح' : 'Name the speed and direction clearly',
      },
      {
        icon: <Clapperboard size={17} />,
        text: isAr ? 'اجعل حركة الشخص أو المنتج بسيطة وطبيعية' : 'Keep subject motion subtle and natural',
      },
      {
        icon: <RotateCcw size={17} />,
        text: isAr ? 'تجنّب الخلفيات المزدحمة لنتيجة أنظف' : 'Avoid crowded backgrounds for cleaner motion',
      },
    ]
    : variant === 'video-upscale'
      ? [
        {
          icon: <Video size={17} />,
          text: isAr ? 'ابدأ بأعلى جودة متاحة لديك' : 'Start with the highest-quality source you have',
        },
        {
          icon: <Sparkles size={17} />,
          text: isAr ? 'اطلب وضوحاً وحدّة وتقليل تشويش' : 'Ask for clarity, sharpness, and noise cleanup',
        },
        {
          icon: <Clapperboard size={17} />,
          text: isAr ? 'لا تطلب تغيير المشهد أو الحركة' : 'Do not ask to change the scene or motion',
        },
        {
          icon: <RotateCcw size={17} />,
          text: isAr ? 'راجع الوجوه والحواف والنصوص بعد التحسين' : 'Review faces, edges, and text after upscaling',
        },
      ]
    : [
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-[0_16px_48px_hsl(var(--shadow-color))] dark:bg-card/25">
      <div className="absolute inset-y-0 start-0 w-40 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.24),transparent_66%)]" />
      <div className="relative grid items-center gap-5 px-6 py-5 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_42px_hsl(var(--primary)/0.24)]">
            <Lightbulb size={30} strokeWidth={1.8} />
          </div>
          <h4 className="text-sm font-bold text-foreground">
            {isAr ? 'نصائح لنتائج أفضل' : 'Pro tips for better results'}
          </h4>
        </div>

        <div className="grid min-w-0 gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="flex min-w-0 items-center gap-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-[0_0_22px_hsl(var(--primary)/0.12)]">
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
  );
}

export default function VideoHowItWorks({ toolSlug }: VideoGuideProps = {}) {
  return (
    <div className="px-1 py-8 space-y-6">
      <VideoHowToUse toolSlug={toolSlug} />
      <VideoProTips toolSlug={toolSlug} />
    </div>
  );
}
