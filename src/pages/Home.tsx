import { useNavigate } from 'react-router-dom';
import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { TopNavbar } from '@/components/layout/TopNavbar';

/* ── data ──────────────────────────────────────────── */

const floatingImages = [
  { url: 'https://picsum.photos/seed/tak-perfume/320/420', rotate: -1.5, height: 'h-[280px] md:h-[380px]' },
  { url: 'https://picsum.photos/seed/tak-fashion/320/400', rotate: 1, height: 'h-[240px] md:h-[340px]' },
  { url: 'https://picsum.photos/seed/tak-ramadan/320/440', rotate: -0.5, height: 'h-[300px] md:h-[400px]' },
  { url: 'https://picsum.photos/seed/tak-food/320/380', rotate: 1.5, height: 'h-[260px] md:h-[360px]' },
  { url: 'https://picsum.photos/seed/tak-realestate/320/420', rotate: -1, height: 'h-[280px] md:h-[380px]' },
];

const quickActions = [
  { name: 'Product Ad', label: 'Commerce', img: 'https://picsum.photos/seed/qa-product/600/400' },
  { name: 'Reels Cover', label: 'Social', img: 'https://picsum.photos/seed/qa-reels/600/400' },
  { name: 'Ramadan', label: 'Seasonal', img: 'https://picsum.photos/seed/qa-ramadan/600/400' },
  { name: 'Fashion', label: 'Lifestyle', img: 'https://picsum.photos/seed/qa-fashion/600/400' },
  { name: 'Real Estate', label: 'Property', img: 'https://picsum.photos/seed/qa-realestate/600/400' },
  { name: 'Restaurant', label: 'Food', img: 'https://picsum.photos/seed/qa-restaurant/600/400' },
];

const trendingImages = [
  { url: 'https://picsum.photos/seed/tr-1/400/400', prompt: 'Cinematic perfume bottle on dark velvet, dramatic side lighting' },
  { url: 'https://picsum.photos/seed/tr-2/400/400', prompt: 'Modern Ramadan greeting, gold calligraphy, deep purple background' },
  { url: 'https://picsum.photos/seed/tr-3/400/400', prompt: 'Luxury handbag editorial, clean studio, soft shadows' },
  { url: 'https://picsum.photos/seed/tr-4/400/400', prompt: 'Gourmet burger close-up, steam rising, moody lighting' },
  { url: 'https://picsum.photos/seed/tr-5/400/400', prompt: 'Modern villa exterior, blue sky, architectural photography' },
  { url: 'https://picsum.photos/seed/tr-6/400/400', prompt: 'Elegant Eid dessert spread, warm golden tones, festive' },
];

const templatePills = ['Ramadan', 'Eid', 'National Day', 'Product Shot', 'Fashion', 'Restaurant', 'Real Estate', 'Medical', 'Sale/Offers', 'Reels Cover'];

/* ── animation variants ────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardFade = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ── component ─────────────────────────────────────── */

export default function Home() {
  const navigate = useNavigate();
  const { setPrompt, setSelectedTemplate, setActivePage } = useApp();

  const handleTemplate = (name: string) => {
    if (TEMPLATE_PROMPTS[name]) {
      setPrompt(TEMPLATE_PROMPTS[name]);
      setSelectedTemplate(name);
    }
    setActivePage('canvas');
    navigate('/canvas');
  };

  const handleTrending = (prompt: string) => {
    setPrompt(prompt);
    setActivePage('canvas');
    navigate('/canvas');
  };

  const goCanvas = () => {
    setActivePage('canvas');
    navigate('/canvas');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavbar />

      {/* ── HERO ──────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-36 pb-20 md:pt-44 md:pb-28">
        <motion.span
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/[0.15] border border-primary text-primary text-[13px] font-medium mb-8"
        >
          Arabic-first Creative AI Studio
        </motion.span>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-[42px] md:text-[56px] lg:text-[64px] font-extralight text-foreground leading-[1.1] max-w-[760px] tracking-tight"
        >
          Turn your ideas into
          <br />
          professional visuals
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-base md:text-lg font-light text-muted-foreground mt-5 max-w-md"
        >
          Create ads, products, and content in seconds using AI
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex items-center gap-3 mt-10"
        >
          <button
            onClick={goCanvas}
            className="group h-12 px-7 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:bg-primary/80 active:scale-[0.98] transition-all duration-150 inline-flex items-center gap-2"
          >
            Start Creating
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href="#trending"
            className="h-12 px-7 rounded-lg border border-surface-border text-foreground text-[15px] font-medium hover:bg-card active:scale-[0.98] transition-all duration-150 inline-flex items-center"
          >
            Explore
          </a>
        </motion.div>
      </section>

      {/* ── FLOATING IMAGE STRIP ─────────────────── */}
      <section className="relative overflow-hidden py-10 md:py-16">
        {/* edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-background to-transparent z-10" />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="flex items-end gap-4 md:gap-6 justify-center px-6"
        >
          {floatingImages.map((img, i) => (
            <motion.div
              key={i}
              variants={cardFade}
              style={{ rotate: `${img.rotate}deg` }}
              className={`flex-shrink-0 w-[180px] md:w-[240px] ${img.height} rounded-xl overflow-hidden hover:scale-[1.03] hover:brightness-110 transition-all duration-300`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── QUICK ACTION CARDS ───────────────────── */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-xl md:text-2xl font-light text-foreground mb-10 text-center"
          >
            Start with a template
          </motion.h2>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
          >
            {quickActions.map((qa) => (
              <motion.button
                key={qa.name}
                variants={cardFade}
                onClick={() => handleTemplate(qa.name)}
                className="group relative aspect-[3/2] rounded-xl overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <img src={qa.img} alt={qa.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-200" />
                <span className="absolute top-3 left-3 text-[11px] font-medium text-primary/90 bg-primary/[0.15] px-2.5 py-1 rounded-full">
                  {qa.label}
                </span>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[15px] font-medium text-foreground group-hover:-translate-y-0.5 transition-transform duration-200 inline-block">
                    {qa.name}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TRENDING GRID ────────────────────────── */}
      <section id="trending" className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-xl md:text-2xl font-light text-foreground mb-10 text-center"
          >
            Trending creations
          </motion.h2>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
          >
            {trendingImages.map((img, i) => (
              <motion.button
                key={i}
                variants={cardFade}
                onClick={() => handleTrending(img.prompt)}
                className="group relative aspect-square rounded-xl overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <img src={img.url} alt={img.prompt} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-end p-4">
                  <span className="text-[13px] text-foreground opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 line-clamp-2 text-left">
                    {img.prompt}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TEMPLATES STRIP ──────────────────────── */}
      <section className="px-6 md:px-12 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-xl md:text-2xl font-light text-foreground mb-8"
          >
            Browse templates
          </motion.h2>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {templatePills.map((t) => (
              <motion.button
                key={t}
                variants={cardFade}
                onClick={() => handleTemplate(t)}
                className="px-5 py-2.5 rounded-full bg-card border border-surface-border text-[13px] font-medium text-foreground hover:border-primary hover:text-primary active:scale-[0.97] transition-all duration-150"
              >
                {t}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 md:py-32 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
        >
          <h2 className="text-2xl md:text-3xl font-extralight text-foreground mb-8">
            Start creating your first image
          </h2>
          <button
            onClick={goCanvas}
            className="group h-12 px-8 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:bg-primary/80 active:scale-[0.98] transition-all duration-150 inline-flex items-center gap-2"
          >
            Go to Canvas
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>
      </section>

      <AuthModal />
    </div>
  );
}
