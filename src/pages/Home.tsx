import { useNavigate } from 'react-router-dom';
import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';
import { Sparkles, LayoutTemplate, Globe } from 'lucide-react';
import { TopNavbar } from '@/components/layout/TopNavbar';

const exampleImages = [
  { url: 'https://picsum.photos/seed/perfume/400/400', prompt: 'Luxury perfume ad, dramatic lighting, dark background' },
  { url: 'https://picsum.photos/seed/ramadan-ad/400/400', prompt: 'Cinematic Ramadan ad, golden lantern, warm glow' },
  { url: 'https://picsum.photos/seed/fashion-kw/400/400', prompt: 'High-end fashion ad, modern modest style, editorial' },
];

const featureStrip = [
  { icon: Globe, title: 'Arabic-first', desc: 'Built for the MENA market' },
  { icon: Sparkles, title: 'Best AI models', desc: 'State-of-the-art generation' },
  { icon: LayoutTemplate, title: 'Templates ready', desc: '10+ industry-specific prompts' },
];

const templatePills = ['Ramadan', 'Eid', 'Product Shot', 'Fashion', 'Restaurant', 'Real Estate'];

export default function Home() {
  const navigate = useNavigate();
  const { setPrompt, setSelectedTemplate } = useApp();

  const handleTemplate = (name: string) => {
    setPrompt(TEMPLATE_PROMPTS[name]);
    setSelectedTemplate(name);
    navigate('/canvas');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavbar />

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-32 pb-20 md:pt-36 md:pb-28">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/[0.15] border border-primary text-primary text-[13px] font-medium mb-6">
          Arabic-first Creative AI Studio
        </span>
        <h1 className="text-4xl md:text-5xl font-extralight text-foreground leading-tight max-w-2xl">
          Turn your ideas into{' '}
          <br className="hidden md:block" />
          professional visuals
        </h1>
        <p className="text-base font-light text-muted-foreground mt-4 max-w-md">
          Create ads, content, and visuals in seconds using AI
        </p>
        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={() => navigate('/canvas')}
            className="h-12 px-7 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:bg-ember-hover transition-colors"
          >
            Start Creating
          </button>
          <a
            href="#examples"
            className="h-12 px-7 rounded-lg border border-surface-border text-foreground text-[15px] font-medium hover:bg-card transition-colors inline-flex items-center"
          >
            Explore Examples
          </a>
        </div>
      </section>

      {/* Live Demo */}
      <section id="examples" className="px-6 md:px-12 pb-20 md:pb-28">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {exampleImages.map((img, i) => (
              <div
                key={i}
                className="group bg-card border border-surface-border rounded-xl overflow-hidden hover:border-primary transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="aspect-square overflow-hidden">
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <span className="text-[11px] font-medium text-primary/80 uppercase tracking-wider">Example</span>
                  <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">{img.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Templates */}
      <section className="px-6 md:px-12 pb-20 md:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-medium text-foreground mb-6">Quick Start Templates</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {templatePills.map(t => (
              <button
                key={t}
                onClick={() => handleTemplate(t)}
                className="px-5 py-2 rounded-full bg-card border border-surface-border text-[13px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="px-6 md:px-12 pb-20 md:pb-28">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {featureStrip.map(f => (
            <div key={f.title} className="bg-card border border-surface-border rounded-xl p-6 text-center">
              <f.icon size={24} className="text-primary mx-auto mb-3" />
              <h3 className="text-[15px] font-medium text-foreground">{f.title}</h3>
              <p className="text-[13px] text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 pb-24 md:pb-32 text-center">
        <h2 className="text-2xl font-light text-foreground mb-6">Start creating your first image</h2>
        <button
          onClick={() => navigate('/canvas')}
          className="h-12 px-8 rounded-lg bg-primary text-primary-foreground text-[15px] font-medium hover:bg-ember-hover transition-colors"
        >
          Go to Canvas
        </button>
      </section>
    </div>
  );
}
