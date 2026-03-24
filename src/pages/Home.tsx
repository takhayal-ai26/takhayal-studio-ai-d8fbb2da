import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Sparkles, Wand2, ArrowRight, Zap, Globe, Layers, ImageIcon, Maximize, Eraser, PenTool, Star } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { Logo } from '@/components/Logo';
import { useState, useEffect, useRef } from 'react';

import categoryProduct from '@/assets/landing/category-product.jpg';
import categorySocial from '@/assets/landing/category-social.jpg';
import categoryLogos from '@/assets/landing/category-logos.jpg';
import categoryPosters from '@/assets/landing/category-posters.jpg';
import categoryFashion from '@/assets/landing/category-fashion.jpg';
import categoryFood from '@/assets/landing/category-food.jpg';
import beforeAfter from '@/assets/landing/before-after.jpg';

const categories = [
  { title: 'Product Ads', image: categoryProduct },
  { title: 'Social Media', image: categorySocial },
  { title: 'Logos', image: categoryLogos },
  { title: 'Posters', image: categoryPosters },
  { title: 'Fashion', image: categoryFashion },
  { title: 'Food & Restaurant', image: categoryFood },
];

const steps = [
  { icon: PenTool, title: 'Describe your idea', desc: 'Write a simple prompt or pick a template' },
  { icon: Wand2, title: 'Choose a style', desc: 'Select from cinematic, minimal, editorial & more' },
  { icon: Zap, title: 'Generate instantly', desc: 'Get 4 premium variations in seconds' },
];

const tools = [
  { icon: ImageIcon, title: 'Generate Image', desc: 'Create unique images from text', route: '/tools/generate' },
  { icon: Maximize, title: 'Upscale Image', desc: 'Increase resolution instantly', route: '/tools/upscale' },
  { icon: Eraser, title: 'Remove Background', desc: 'Remove background in one click', route: '/tools/remove-bg' },
  { icon: PenTool, title: 'Create Logo', desc: 'Design clean, modern logos', route: '/tools/logo' },
  { icon: Star, title: 'Enhance Image', desc: 'Improve quality and sharpness', route: '/tools/enhance' },
];

const whyCards = [
  { icon: Globe, title: 'Arabic-first AI', desc: 'Built natively for Arabic prompts and MENA aesthetics' },
  { icon: Layers, title: 'Built for MENA businesses', desc: 'Templates and styles tailored for the region' },
  { icon: Sparkles, title: 'Commercial-ready visuals', desc: 'Output quality ready for ads and campaigns' },
  { icon: Zap, title: 'No design skills needed', desc: 'From idea to professional visual in seconds' },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useApp();
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleStartCreating = () => {
    navigate('/home');
  };

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current || !dragging.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Floating top bar */}
      <header className="absolute top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-6 md:px-10">
        <Logo size="small" />
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button onClick={() => navigate('/home')} className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-90 transition-all">
              Go to Studio
            </button>
          ) : (
            <>
              <button onClick={() => openAuthModal('login')} className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Log in</button>
              <button onClick={() => openAuthModal('signup')} className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-90 transition-all">Sign up</button>
            </>
          )}
        </div>
      </header>

      {/* ━━━ HERO ━━━ */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-44 pb-28 md:pt-52 md:pb-36">
        {/* Multi-layer glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/[0.07] rounded-full blur-[150px]" />
          <div className="absolute top-2/3 left-1/3 w-[300px] h-[300px] bg-primary/[0.04] rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] bg-primary/[0.03] rounded-full blur-[80px]" />
        </div>

        {/* Decorative grid lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
        </div>

        <span className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.12] border border-primary/30 text-primary text-[13px] font-medium mb-8 animate-fade-in">
          <Sparkles size={14} />
          Arabic-first Creative AI Studio
        </span>
        <h1 className="relative text-5xl md:text-7xl font-extralight text-foreground leading-[1.1] max-w-[800px] animate-fade-in" style={{ animationDelay: '100ms' }}>
          Turn your ideas into{' '}
          <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">professional visuals</span>
        </h1>
        <p className="relative text-base md:text-lg font-light text-muted-foreground mt-6 max-w-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
          Create ads, content, and visuals in seconds using AI — designed for Arabic-first creators
        </p>
        <div className="relative flex items-center gap-4 mt-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <button
            onClick={handleStartCreating}
            className="group h-13 px-8 rounded-xl bg-primary text-primary-foreground text-[15px] font-medium hover:brightness-110 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,81,48,0.35)] hover:scale-[1.02]"
          >
            Start Creating
            <ArrowRight size={16} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => document.getElementById('create-anything')?.scrollIntoView({ behavior: 'smooth' })}
            className="h-13 px-8 rounded-xl border border-muted/60 text-foreground text-[15px] font-medium hover:bg-card hover:border-muted transition-all duration-300 inline-flex items-center gap-2"
          >
            Explore
          </button>
        </div>

        {/* Trusted by line */}
        <div className="relative mt-16 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <p className="text-[12px] text-muted-foreground/50 uppercase tracking-[0.2em]">Trusted by 10,000+ creators across MENA</p>
        </div>
      </section>

      {/* ━━━ CREATE ANYTHING ━━━ */}
      <section id="create-anything" className="px-6 md:px-12 pb-32 md:pb-40">
        <Section>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">What you can create</span>
              <h2 className="text-3xl md:text-5xl font-light text-foreground">Create anything in seconds</h2>
              <p className="text-muted-foreground mt-4 text-base max-w-md mx-auto">From ads to social content, everything starts with an idea</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {categories.map((cat, i) => (
                <button
                  key={cat.title}
                  onClick={() => navigate('/studio')}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <img src={cat.image} alt={cat.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/[0.1]" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <span className="text-sm md:text-lg font-medium text-foreground">{cat.title}</span>
                    <ArrowRight size={14} className="text-foreground/0 group-hover:text-foreground/60 transition-all duration-300 mt-2 group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="px-6 md:px-12 pb-28 md:pb-36">
        <Section>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-foreground">From idea to image in seconds</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((step, i) => (
                <div key={step.title} className="relative text-center group">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-muted-foreground/20 to-transparent" />
                  )}
                  <div className="relative mx-auto w-20 h-20 rounded-2xl bg-card border border-muted flex items-center justify-center mb-5 group-hover:border-primary/40 transition-colors">
                    <div className="absolute inset-0 rounded-2xl bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <step.icon size={28} className="text-primary relative" />
                  </div>
                  <span className="text-[11px] font-medium text-primary/60 uppercase tracking-widest mb-2 block">Step {i + 1}</span>
                  <h3 className="text-lg font-medium text-foreground mb-2">{step.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[240px] mx-auto">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ BEFORE / AFTER ━━━ */}
      <section className="px-6 md:px-12 pb-28 md:pb-36">
        <Section>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-light text-foreground">See the transformation</h2>
              <p className="text-muted-foreground mt-3 text-base">Drag to compare before and after</p>
            </div>
            <div
              ref={sliderRef}
              className="relative aspect-[2/1] rounded-2xl overflow-hidden cursor-col-resize select-none border border-muted"
              onMouseDown={() => { dragging.current = true; }}
              onMouseUp={() => { dragging.current = false; }}
              onMouseLeave={() => { dragging.current = false; }}
              onMouseMove={(e) => handleSliderMove(e.clientX)}
              onTouchStart={() => { dragging.current = true; }}
              onTouchEnd={() => { dragging.current = false; }}
              onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
            >
              {/* After (full) */}
              <img src={beforeAfter} alt="After enhancement" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              {/* Before (clipped) */}
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                <img src={beforeAfter} alt="Before enhancement" className="absolute inset-0 w-full h-full object-cover blur-sm brightness-75" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} loading="lazy" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              {/* Slider handle */}
              <div className="absolute top-0 bottom-0" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
                <div className="w-px h-full bg-foreground/80" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-foreground/90 flex items-center justify-center shadow-lg">
                  <ArrowRight size={14} className="text-background rotate-180 -ml-0.5" />
                  <ArrowRight size={14} className="text-background -ml-1" />
                </div>
              </div>
              {/* Labels */}
              <span className="absolute top-4 left-4 text-[11px] font-medium text-foreground/70 uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full">Before</span>
              <span className="absolute top-4 right-4 text-[11px] font-medium text-foreground/70 uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full">After</span>
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ TOOLS ━━━ */}
      <section className="px-6 md:px-12 pb-28 md:pb-36">
        <Section>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-light text-foreground">Everything you need to create</h2>
                <p className="text-muted-foreground mt-3 text-base">Powerful AI tools, one platform</p>
              </div>
              <button onClick={() => navigate('/tools')} className="hidden md:flex items-center gap-2 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
                See all tools <ArrowRight size={14} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-6 px-6 md:-mx-0 md:px-0">
              {tools.map((tool) => (
                <button
                  key={tool.title}
                  onClick={() => navigate(tool.route)}
                  className="group relative flex-shrink-0 w-[280px] md:w-[320px] bg-card border border-muted rounded-2xl p-6 text-left hover:border-primary/30 transition-all duration-300 snap-start"
                >
                  <div className="absolute inset-0 rounded-2xl bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-primary/[0.12] border border-primary/20 flex items-center justify-center mb-16 group-hover:bg-primary/[0.18] transition-colors">
                      <tool.icon size={20} className="text-primary" />
                    </div>
                    <h3 className="text-[15px] font-medium text-foreground mb-1.5">{tool.title}</h3>
                    <p className="text-[13px] text-muted-foreground mb-4">{tool.desc}</p>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ WHY TAKHAYAL ━━━ */}
      <section className="px-6 md:px-12 pb-28 md:pb-36">
        <Section>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-light text-foreground">Built for creators in the region</h2>
              <p className="text-muted-foreground mt-3 text-base">Designed for Arabic-first businesses and creators</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {whyCards.map((card) => (
                <div
                  key={card.title}
                  className="group bg-card/60 border border-muted rounded-2xl p-7 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/[0.1] flex items-center justify-center mb-4 group-hover:bg-primary/[0.15] transition-colors">
                    <card.icon size={20} className="text-primary" />
                  </div>
                  <h3 className="text-[15px] font-medium text-foreground mb-2">{card.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="relative px-6 md:px-12 pb-28 md:pb-36">
        <Section>
          <div className="relative max-w-3xl mx-auto text-center py-16">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-primary/[0.06] rounded-full blur-[100px]" />
            </div>
            <h2 className="relative text-3xl md:text-4xl font-light text-foreground mb-4">Start creating your first image</h2>
            <p className="relative text-muted-foreground mb-9 text-base">No design skills required. Just describe and generate.</p>
            <div className="relative flex items-center justify-center gap-3">
              <button
                onClick={handleStartCreating}
                className="h-13 px-8 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:brightness-90 transition-all hover:shadow-[0_0_30px_rgba(245,81,48,0.3)]"
              >
                Start Creating
              </button>
              <button
                onClick={() => navigate('/studio')}
                className="h-13 px-8 rounded-lg border border-muted text-foreground text-[15px] font-medium hover:bg-card transition-colors"
              >
                Explore Templates
              </button>
            </div>
          </div>
        </Section>
      </section>

      {/* Footer line */}
      <footer className="border-t border-muted px-6 py-8 text-center">
        <p className="text-[12px] text-muted-foreground">© 2024 Takhayal.ai — All rights reserved</p>
      </footer>

      <AuthModal />
    </div>
  );
}
