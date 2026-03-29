import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Logo } from '@/components/Logo';
import { ArrowLeft, CheckCircle, PlusSquare, Star, Clock } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();

  const isAr = lang === 'ar';

  const stats = [
    { value: '14+', label: isAr ? 'نموذج ذكاء اصطناعي متاح' : 'AI models available' },
    { value: '2', label: isAr ? 'لغات مدعومة' : 'Languages supported' },
    { value: 'GCC', label: isAr ? 'صُمم لهذه المنطقة' : 'Built for this region' },
  ];

  const values = [
    {
      icon: CheckCircle,
      title: isAr ? 'عربي أولاً بالتصميم' : 'Arabic-first by design',
      desc: isAr
        ? 'ليست فكرة لاحقة. كل أمر، قالب، وسير عمل مبني مع المبدعين العرب في الاعتبار منذ اليوم الأول.'
        : 'Not an afterthought. Every prompt, template, and workflow is built with Arabic creators in mind from day one.',
    },
    {
      icon: PlusSquare,
      title: isAr ? 'واعٍ ثقافياً' : 'Culturally aware',
      desc: isAr
        ? 'من حملات رمضان إلى محتوى اليوم الوطني، أدواتنا تفهم ثقافة الخليج، وليس فقط لغة الخليج.'
        : 'From Ramadan campaigns to national day content, our tools understand Gulf culture, not just Gulf language.',
    },
    {
      icon: Star,
      title: isAr ? 'جودة بلا تنازل' : 'Quality without compromise',
      desc: isAr
        ? 'نوجّه كل عملية توليد عبر أفضل نموذج ذكاء اصطناعي متاح للمهمة — لتكون مخرجاتك دائماً الأفضل.'
        : 'We route every generation through the best available AI model for the task — so your output is always the best it can be.',
    },
    {
      icon: Clock,
      title: isAr ? 'سريع وصادق' : 'Fast and honest',
      desc: isAr
        ? 'لا تكاليف مخفية. ترى بالضبط تكلفة التوليد قبل الإنشاء — والنتائج تصل في ثوانٍ.'
        : 'No hidden costs. You see exactly what a generation costs before you create it — results arrive in seconds.',
    },
  ];

  const storyParagraphs = isAr
    ? [
        'وُلد تخيّل من إحباط بسيط: أقوى أدوات الذكاء الاصطناعي الإبداعية في العالم لم تُبنَ لنا. كانت تفتقر إلى دعم الأوامر العربية، وتتجاهل جماليات الخليج، وتعامل منطقتنا كفكرة لاحقة.',
        'بنينا تخيّل لإصلاح ذلك. استوديو يتحدث لغتك، يفهم مناسباتك، ويقدم نفس الجودة التي يعتبرها المبدعون العالميون أمراً مسلّماً به — دون الحاجة إلى شهادة في التصميم أو أمر بالإنجليزية للوصول إلى هناك.',
        'نحن فريق صغير ومركّز مقره الكويت، وقد بدأنا للتو.',
      ]
    : [
        'Takhayal was born from a simple frustration: the most powerful AI creative tools in the world were not built for us. They lacked Arabic prompt support, ignored Gulf aesthetics, and treated our region as an afterthought.',
        'We built Takhayal to fix that. A studio that speaks your language, understands your occasions, and delivers the same quality that global creators take for granted — without requiring a design degree or an English prompt to get there.',
        'We are a small, focused team based in Kuwait, and we are just getting started.',
      ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-[860px] mx-auto px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border/50 text-[13px] text-muted-foreground hover:text-foreground hover:border-border transition-colors mb-12"
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          {isAr ? 'رجوع' : 'Back'}
        </button>

        {/* Logo */}
        <div className="mb-16">
          <Logo size="small" />
        </div>

        {/* Hero */}
        <section className="mb-16">
          <span className="text-[11px] font-medium uppercase tracking-[2px] text-primary mb-5 block">
            {isAr ? 'من نحن' : 'ABOUT US'}
          </span>
          <h1 className="text-[42px] font-medium leading-[1.2] text-foreground mb-5">
            {isAr ? 'صُمم لمبدعي الخليج.' : 'Built for the Gulf creator.'}
          </h1>
          <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[680px]">
            {isAr
              ? 'تخيّل هو استوديو الذكاء الاصطناعي العربي أولاً الذي يحوّل رؤيتك الإبداعية إلى مرئيات جاهزة للإنتاج — في ثوانٍ، بلغتك، لثقافتك.'
              : 'Takhayal is the Arabic-first AI image studio that turns your creative vision into production-ready visuals — in seconds, in your language, for your culture.'}
          </p>
        </section>

        {/* Divider */}
        <div className="border-t border-border mb-16" />

        {/* Mission */}
        <section className="mb-16">
          <span className="text-[11px] font-medium uppercase tracking-[2px] text-muted-foreground mb-5 block">
            {isAr ? 'مهمتنا' : 'OUR MISSION'}
          </span>
          <blockquote className={`border-primary ${isRTL ? 'border-r-[3px] pr-5' : 'border-l-[3px] pl-5'}`}>
            <p className="text-[22px] font-medium leading-[1.5] text-foreground">
              {isAr
                ? 'وضع الذكاء الاصطناعي الإبداعي العالمي في أيدي كل مبدع ومصمم وعلامة تجارية ناطقة بالعربية في الخليج.'
                : 'To put world-class creative AI in the hands of every Arabic-speaking creator, designer, and brand in the Gulf.'}
            </p>
          </blockquote>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.value} className="bg-card rounded-xl p-6 border border-border/50">
                <div className="text-[32px] font-bold text-primary mb-1">{s.value}</div>
                <div className="text-[13px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <span className="text-[11px] font-medium uppercase tracking-[2px] text-muted-foreground mb-5 block">
            {isAr ? 'ما نؤمن به' : 'WHAT WE STAND FOR'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {values.map((v) => (
              <div key={v.title} className="bg-card/50 border border-border/50 rounded-xl p-6">
                <div className="w-9 h-9 rounded-lg bg-primary/[0.08] flex items-center justify-center mb-4">
                  <v.icon size={18} className="text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-medium text-foreground mb-1.5">{v.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Story */}
        <section className="mb-16">
          <span className="text-[11px] font-medium uppercase tracking-[2px] text-muted-foreground mb-5 block">
            {isAr ? 'قصتنا' : 'OUR STORY'}
          </span>
          <div className="space-y-5">
            {storyParagraphs.map((p, i) => (
              <p key={i} className="text-[15px] leading-[1.8] text-muted-foreground">{p}</p>
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="mb-16">
          <span className="text-[11px] font-medium uppercase tracking-[2px] text-muted-foreground mb-5 block">
            {isAr ? 'أين نحن' : 'WHERE WE ARE'}
          </span>
          <div className="bg-card rounded-xl p-5 border border-border/50 flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {isAr
                ? 'الكويت — المقر الرئيسي وفريق التأسيس. نخدم المبدعين في الكويت والسعودية ودول الخليج.'
                : 'Kuwait — Headquarters and founding team. Serving creators across Kuwait, Saudi Arabia, and the wider GCC.'}
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-8">
          <div className="bg-card rounded-xl border border-border/50 py-12 px-6 text-center">
            <h2 className="text-[26px] font-medium text-foreground mb-3">
              {isAr ? 'مستعد لإنشاء شيء؟' : 'Ready to create something?'}
            </h2>
            <p className="text-[15px] text-muted-foreground mb-8">
              {isAr
                ? 'انضم إلى المبدعين في الخليج الذين يستخدمون تخيّل كل يوم.'
                : 'Join creators across the Gulf using Takhayal every day.'}
            </p>
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground text-[15px] font-medium hover:brightness-110 transition-all"
            >
              {isAr ? 'ابدأ الإنشاء مجاناً ←' : 'Start creating free →'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
