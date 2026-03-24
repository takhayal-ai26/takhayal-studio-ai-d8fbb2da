import { useParams, useNavigate } from 'react-router-dom';
import { TOOLS } from '@/data/tools';
import { TOOLS } from '@/data/tools';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight, Upload, Coins, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useApp();
  const { t, isRTL } = useLanguage();
  const tool = TOOLS.find(t => t.id === toolId);

  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (!tool) return {};
    const defaults: Record<string, string> = {};
    tool.options.forEach(o => { defaults[o.label] = o.defaultValue; });
    return defaults;
  });

  if (!tool) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <div className="pt-16 flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-light text-foreground mb-2">{t.toolPage.toolNotFound}</h1>
            <button onClick={() => navigate('/home')} className="text-primary text-sm hover:underline">{t.toolPage.backToHome}</button>
          </div>
        </div>
        <AuthModal />
      </div>
    );
  }

  const handleUseExample = (prompt: string) => {
    setInputValue(prompt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAction = () => {
    requireAuth(() => {
      console.log('Tool action:', tool.id, inputValue, selectedOptions);
    });
  };

  const Icon = tool.icon;

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="pt-16">
        <section className="relative w-full overflow-hidden" style={{ minHeight: '480px' }}>
          <img src={tool.image} alt={tool.name} className="absolute inset-0 w-full h-full object-cover" width={800} height={600} />
          <div className={`absolute inset-0 bg-gradient-to-${isRTL ? 'l' : 'r'} from-background via-background/80 to-transparent`} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
          <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 flex items-center min-h-[480px]">
            <div className="max-w-lg w-full">
              <div className="backdrop-blur-xl bg-card/60 border border-border rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/[0.15] flex items-center justify-center">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <h1 className="text-xl font-medium text-foreground">{tool.name}</h1>
                </div>
                <p className="text-[13px] text-muted-foreground mb-5">{tool.description}</p>
                {tool.inputType === 'prompt' ? (
                  <textarea value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={t.toolPage.describePrompt} className="w-full h-28 bg-background/80 border border-border rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary transition-colors" />
                ) : (
                  <div className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer bg-background/40">
                    <Upload size={20} className="text-muted-foreground" />
                    <span className="text-[13px] text-muted-foreground">{t.toolPage.dropImage}</span>
                    <span className="text-[11px] text-muted-foreground/50">{t.toolPage.fileTypes}</span>
                  </div>
                )}
                {tool.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {tool.options.map(opt => (
                      <div key={opt.label} className="flex-1 min-w-[120px]">
                        <label className="text-[11px] text-muted-foreground mb-1 block">{opt.label}</label>
                        <select value={selectedOptions[opt.label] || opt.defaultValue} onChange={e => setSelectedOptions(prev => ({ ...prev, [opt.label]: e.target.value }))} className="w-full h-9 bg-background/80 border border-border rounded-lg px-3 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer">
                          {opt.values.map(v => (<option key={v} value={v}>{v}</option>))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleAction} disabled={tool.inputType === 'prompt' && !inputValue.trim()} className="w-full mt-5 h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                  <span>{tool.inputType === 'prompt' ? t.toolPage.generate : t.toolPage.uploadProcess}</span>
                  <span className="flex items-center gap-1 text-primary-foreground/70 text-[12px]">
                    <Coins size={12} />
                    {tool.creditCost} {t.toolPage.credits}
                  </span>
                </button>
              </div>
            </div>
            <div className="hidden lg:flex flex-1 items-center justify-center pl-12">
              <div className={`${isRTL ? 'text-left' : 'text-right'} max-w-xs`}>
                <h2 className="text-3xl font-extralight text-foreground/90 leading-tight">{tool.heroTagline}</h2>
                <p className="text-[13px] text-muted-foreground mt-3">{t.toolPage.poweredByAI}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 md:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-medium text-foreground">{t.toolPage.examples}</h2>
            <span className="text-[12px] text-muted-foreground">{tool.examples.length} {t.toolPage.examplesCount}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tool.examples.map((ex, i) => (
              <button key={i} onClick={() => handleUseExample(ex.prompt)} className="group relative rounded-xl overflow-hidden border border-border hover:border-primary transition-all hover:scale-[1.02]">
                <div className="aspect-square">
                  <img src={ex.image} alt={ex.prompt} className="w-full h-full object-cover" loading="lazy" width={400} height={400} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between gap-2">
                  <p className="text-[11px] text-foreground/80 line-clamp-2 flex-1">{ex.prompt}</p>
                  <span className="flex-shrink-0 h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-medium flex items-center gap-1">
                    {t.portal.use} <ArrowRight size={10} className={isRTL ? 'rotate-180' : ''} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16 text-center">
          <div className="py-12 rounded-2xl border border-border bg-card/30">
            <Sparkles size={20} className="text-primary mx-auto mb-3" />
            <h2 className="text-xl font-light text-foreground mb-2">{t.toolPage.startCreatingNow}</h2>
            <p className="text-[13px] text-muted-foreground mb-6">{t.toolPage.noSetupRequired}</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
              {t.toolPage.tryTool} {tool.name}
            </button>
          </div>
        </section>
      </div>
      <AuthModal />
    </div>
  );
}
