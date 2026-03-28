import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight, Upload, Coins, Sparkles, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToolsDB, ToolView } from '@/hooks/useToolsDB';
import { useToolRunner, ToolRunStatus } from '@/hooks/useToolRunner';
import { Progress } from '@/components/ui/progress';

function StatusBadge({ status }: { status: ToolRunStatus }) {
  if (status === 'uploading') return <div className="flex items-center gap-2 text-primary"><Loader2 size={14} className="animate-spin" /><span className="text-[13px]">Uploading...</span></div>;
  if (status === 'processing') return <div className="flex items-center gap-2 text-primary"><Loader2 size={14} className="animate-spin" /><span className="text-[13px]">Processing...</span></div>;
  if (status === 'completed') return <div className="flex items-center gap-2 text-green-500"><CheckCircle size={14} /><span className="text-[13px]">Complete</span></div>;
  if (status === 'failed') return <div className="flex items-center gap-2 text-destructive"><AlertCircle size={14} /><span className="text-[13px]">Failed</span></div>;
  return null;
}

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !dragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('touchmove', handleTouchMove); window.removeEventListener('mouseup', handleUp); window.removeEventListener('touchend', handleUp); };
  }, [handleMove]);

  return (
    <div ref={containerRef} className="relative w-full aspect-square rounded-xl overflow-hidden cursor-col-resize select-none" onMouseDown={() => { dragging.current = true; }} onTouchStart={() => { dragging.current = true; }}>
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }} />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
        <div className="w-1 h-full bg-white shadow-lg" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">↔</span>
        </div>
      </div>
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/50 text-white text-[10px]">Before</div>
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/50 text-white text-[10px]">After</div>
    </div>
  );
}

export default function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useApp();
  const { t, isRTL } = useLanguage();
  const { tools } = useToolsDB();
  const { status, result, error, runTool, reset } = useToolRunner();

  const tool = tools.find(t => t.slug === toolId || t.id === toolId);

  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [outputLoaded, setOutputLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tool-specific option definitions
  const toolOptions: Record<string, Array<{ label: string; values: string[]; defaultValue: string }>> = {
    'generate': [
      { label: 'Ratio', values: ['1:1', '9:16', '16:9', '4:5'], defaultValue: '1:1' },
    ],
    'upscale': [
      { label: 'Scale', values: ['2x', '4x'], defaultValue: '2x' },
    ],
    'logo': [
      { label: 'Style', values: ['Minimal', 'Modern', 'Geometric', 'Playful'], defaultValue: 'Minimal' },
      { label: 'Type', values: ['Icon', 'Wordmark', 'Combination'], defaultValue: 'Icon' },
    ],
    'remove-bg': [],
    'enhance': [
      { label: 'Mode', values: ['General', 'Portrait', 'Landscape', 'Product'], defaultValue: 'General' },
    ],
  };

  const currentOptions = toolOptions[tool?.slug || ''] || [];

  useEffect(() => {
    if (currentOptions.length > 0) {
      const defaults: Record<string, string> = {};
      currentOptions.forEach(o => { defaults[o.label] = o.defaultValue; });
      setSelectedOptions(defaults);
    }
  }, [tool?.slug]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setOutputLoaded(false);
    reset();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setOutputLoaded(false);
    reset();
  };

  const handleRun = () => {
    requireAuth(async () => {
      setOutputLoaded(false);
      await runTool({
        toolSlug: tool!.slug,
        prompt: inputValue || undefined,
        imageFile: selectedFile || undefined,
        options: { ...selectedOptions, ratio: selectedOptions['Ratio'] },
      });
    });
  };

  const handleDownload = async () => {
    if (!result?.output_url) return;
    try {
      const res = await fetch(result.output_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `takhayal-${tool?.slug}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleReset = () => {
    reset();
    setInputValue('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    setOutputLoaded(false);
  };

  if (!tool) {
    return (
      <div className="pt-16 flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-light text-foreground mb-2">{t.toolPage.toolNotFound}</h1>
          <button onClick={() => navigate('/tools')} className="text-primary text-sm hover:underline">{t.toolPage.backToHome}</button>
        </div>
      </div>
    );
  }

  const Icon = tool.icon;
  const isUpload = tool.inputType === 'upload';
  const canRun = isUpload ? !!selectedFile && status !== 'processing' && status !== 'uploading' : inputValue.trim().length > 0 && status !== 'processing';
  const showBeforeAfter = (tool.slug === 'upscale' || tool.slug === 'enhance' || tool.slug === 'remove-bg') && status === 'completed' && result?.output_url && previewUrl;

  return (
    <div className="flex-1 pt-16">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '520px' }}>
        {tool.image ? (
          <img src={tool.image} alt={tool.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-muted/20 to-background" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-${isRTL ? 'l' : 'r'} from-background via-background/85 to-background/40`} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 flex items-center min-h-[520px]">
          <div className="max-w-lg w-full">
            <div className="backdrop-blur-xl bg-card/60 border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/[0.15] flex items-center justify-center"><Icon size={16} className="text-primary" /></div>
                  <h1 className="text-xl font-medium text-foreground">{tool.name}</h1>
                </div>
                <StatusBadge status={status} />
              </div>

              <p className="text-[13px] text-muted-foreground mb-5">{tool.description}</p>

              {/* Input Area */}
              {status === 'completed' && result?.output_url ? (
                /* Result View */
                <div className="space-y-4">
                  {showBeforeAfter ? (
                    <BeforeAfterSlider before={previewUrl!} after={result.output_url} />
                  ) : (
                    <div className="relative rounded-xl overflow-hidden">
                      {!outputLoaded && (
                        <div className="aspect-square bg-muted/20 rounded-xl flex items-center justify-center">
                          <Loader2 size={24} className="animate-spin text-primary" />
                        </div>
                      )}
                      <img
                        src={result.output_url}
                        alt="Result"
                        className={`w-full rounded-xl transition-opacity duration-500 ${outputLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
                        onLoad={() => setOutputLoaded(true)}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Coins size={11} />
                    <span>{result.credits_charged} credits used</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleDownload} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <Download size={14} /> Download
                    </button>
                    <button onClick={handleReset} className="h-11 px-4 rounded-xl bg-card border border-border text-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-muted/20 transition-colors">
                      <RotateCcw size={14} /> New
                    </button>
                  </div>
                </div>
              ) : status === 'failed' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-[13px] text-destructive">{error || 'Something went wrong'}</p>
                  </div>
                  <button onClick={handleReset} className="w-full h-11 rounded-xl bg-card border border-border text-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-muted/20">
                    <RotateCcw size={14} /> Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Prompt or Upload */}
                  {isUpload ? (
                    <div>
                      {previewUrl ? (
                        <div className="relative">
                          <img src={previewUrl} alt="Preview" className="w-full rounded-xl border border-border" />
                          <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={e => e.preventDefault()}
                          className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer bg-background/40"
                        >
                          <Upload size={24} className="text-muted-foreground" />
                          <span className="text-[13px] text-muted-foreground">{t.toolPage.dropImage}</span>
                          <span className="text-[11px] text-muted-foreground/50">{t.toolPage.fileTypes}</span>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </div>
                  ) : (
                    <textarea
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder={t.toolPage.describePrompt}
                      className="w-full h-28 bg-background/80 border border-border rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary transition-colors"
                    />
                  )}

                  {/* Options */}
                  {currentOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {currentOptions.map(opt => (
                        <div key={opt.label} className="flex-1 min-w-[120px]">
                          <label className="text-[11px] text-muted-foreground mb-1 block">{opt.label}</label>
                          <select
                            value={selectedOptions[opt.label] || opt.defaultValue}
                            onChange={e => setSelectedOptions(prev => ({ ...prev, [opt.label]: e.target.value }))}
                            className="w-full h-9 bg-background/80 border border-border rounded-lg px-3 text-[12px] text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                          >
                            {opt.values.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Progress / Status */}
                  {(status === 'uploading' || status === 'processing') && (
                    <div className="mt-4 space-y-2">
                      <Progress value={status === 'uploading' ? 30 : 70} className="h-1.5" />
                      <p className="text-[11px] text-muted-foreground text-center">
                        {status === 'uploading' ? 'Uploading image...' : 'Processing with AI...'}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={handleRun}
                    disabled={!canRun}
                    className="w-full mt-5 h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {(status === 'uploading' || status === 'processing') ? (
                      <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Processing...</span>
                    ) : (
                      <>
                        <span>{isUpload ? t.toolPage.uploadProcess : t.toolPage.generate}</span>
                        <span className="flex items-center gap-1 text-primary-foreground/70 text-[12px]">
                          <Coins size={12} /> {tool.creditCost} {t.toolPage.credits}
                        </span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Hero text (desktop) */}
          <div className="hidden lg:flex flex-1 items-center justify-center pl-12">
            <div className={`${isRTL ? 'text-left' : 'text-right'} max-w-xs`}>
              <h2 className="text-3xl font-extralight text-foreground/90 leading-tight">{tool.heroTitle}</h2>
              <p className="text-[13px] text-muted-foreground mt-3">{tool.heroSubtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16 pt-12 text-center">
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
  );
}
