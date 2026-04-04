import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Upload, Coins, Download, RotateCcw, Loader2, CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useToolRunner, ToolRunStatus } from '@/hooks/useToolRunner';
import { useToolProviders } from '@/hooks/useToolProviders';
import { Progress } from '@/components/ui/progress';
import { ToolProviderSelector } from '@/components/tools/ToolProviderSelector';
import { useIsMobile } from '@/hooks/use-mobile';

/* ── Status indicator ── */
function StatusBadge({ status }: { status: ToolRunStatus }) {
  if (status === 'uploading') return <div className="flex items-center gap-2 text-primary"><Loader2 size={14} className="animate-spin" /><span className="text-[13px]">Uploading…</span></div>;
  if (status === 'processing') return <div className="flex items-center gap-2 text-primary"><Loader2 size={14} className="animate-spin" /><span className="text-[13px]">Processing…</span></div>;
  if (status === 'completed') return <div className="flex items-center gap-2 text-green-500"><CheckCircle size={14} /><span className="text-[13px]">Complete</span></div>;
  if (status === 'failed') return <div className="flex items-center gap-2 text-destructive"><AlertCircle size={14} /><span className="text-[13px]">Failed</span></div>;
  return null;
}

/* ── Before / After slider ── */
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
    const mm = (e: MouseEvent) => handleMove(e.clientX);
    const tm = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const up = () => { dragging.current = false; };
    window.addEventListener('mousemove', mm);
    window.addEventListener('touchmove', tm);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('touchmove', tm); window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up); };
  }, [handleMove]);

  return (
    <div ref={containerRef} className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-col-resize select-none bg-muted/10" onMouseDown={() => { dragging.current = true; }} onTouchStart={() => { dragging.current = true; }}>
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }} />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
        <div className="w-0.5 h-full bg-white/90 shadow-lg" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground select-none">↔</span>
        </div>
      </div>
      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">Before</div>
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">After</div>
    </div>
  );
}

/* ── Preview panel (right side on desktop, bottom on mobile) ── */
function PreviewPanel({ tool, previewUrl, result, outputLoaded, setOutputLoaded, showBeforeAfter }: {
  tool: { slug: string; image: string; name: string; heroTitle: string; heroSubtitle: string };
  previewUrl: string | null;
  result: any;
  outputLoaded: boolean;
  setOutputLoaded: (v: boolean) => void;
  showBeforeAfter: boolean;
}) {
  // Show result before/after
  if (showBeforeAfter && result?.output_url && previewUrl) {
    return <BeforeAfterSlider before={previewUrl} after={result.output_url} />;
  }

  // Show result image
  if (result?.output_url) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-muted/10">
        {!outputLoaded && (
          <div className="aspect-[4/3] flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        )}
        <img
          src={result.output_url}
          alt="Result"
          className={`w-full rounded-2xl transition-opacity duration-500 ${outputLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          onLoad={() => setOutputLoaded(true)}
        />
      </div>
    );
  }

  // Show uploaded preview
  if (previewUrl) {
    return (
      <div className="rounded-2xl overflow-hidden bg-muted/10">
        <img src={previewUrl} alt="Preview" className="w-full rounded-2xl object-contain max-h-[60vh]" />
      </div>
    );
  }

  // Default: show tool cover image or hero visual
  if (tool.image) {
    return (
      <div className="rounded-2xl overflow-hidden bg-muted/5">
        <img src={tool.image} alt={tool.name} className="w-full rounded-2xl object-cover aspect-[4/3]" />
        <div className="p-5">
          <h3 className="text-lg font-medium text-foreground/80 mb-1">{tool.heroTitle}</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{tool.heroSubtitle}</p>
        </div>
      </div>
    );
  }

  // Fallback gradient placeholder
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-muted/10 to-card aspect-[4/3] flex items-center justify-center">
      <div className="text-center px-8">
        <h3 className="text-lg font-medium text-foreground/60 mb-2">{tool.heroTitle}</h3>
        <p className="text-[13px] text-muted-foreground">{tool.heroSubtitle}</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useApp();
  const { t, isRTL } = useLanguage();
  const { tools } = useToolsDB();
  const { status, result, error, runTool, reset } = useToolRunner();
  const isMobile = useIsMobile();

  const tool = tools.find(t => t.slug === toolId || t.id === toolId);
  const { activeProviders, defaultProvider } = useToolProviders(tool?.id);

  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [outputLoaded, setOutputLoaded] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultProvider && !selectedProviderId) setSelectedProviderId(defaultProvider.id);
  }, [defaultProvider, selectedProviderId]);

  const selectedProvider = activeProviders.find(p => p.id === selectedProviderId) || defaultProvider;

  const toolOptions: Record<string, Array<{ label: string; values: string[]; defaultValue: string }>> = {
    generate: [{ label: 'Ratio', values: ['1:1', '9:16', '16:9', '4:5'], defaultValue: '1:1' }],
    logo: [
      { label: 'Style', values: ['Minimal', 'Modern', 'Geometric', 'Playful'], defaultValue: 'Minimal' },
      { label: 'Type', values: ['Icon', 'Wordmark', 'Combination'], defaultValue: 'Icon' },
    ],
    enhance: [{ label: 'Mode', values: ['General', 'Portrait', 'Landscape', 'Product'], defaultValue: 'General' }],
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
      const isAdvanced = selectedProvider?.tier === 'advanced' || selectedProvider?.tier === 'premium';
      if (isAdvanced) {
        setProcessingMessage('Analyzing your image…');
        const timers = [
          setTimeout(() => setProcessingMessage('Enhancing details…'), 10000),
          setTimeout(() => setProcessingMessage('Refining textures…'), 25000),
          setTimeout(() => setProcessingMessage('Almost done…'), 40000),
        ];
        await runTool({ toolSlug: tool!.slug, prompt: inputValue || undefined, imageFile: selectedFile || undefined, options: { ...selectedOptions, provider_endpoint: selectedProvider?.provider_endpoint, ratio: selectedOptions['Ratio'] } });
        timers.forEach(clearTimeout);
        setProcessingMessage('');
      } else {
        if (selectedProvider && (tool?.slug === 'upscale' || tool?.slug === 'enhance' || tool?.slug === 'remove-bg')) setProcessingMessage('Processing…');
        await runTool({ toolSlug: tool!.slug, prompt: inputValue || undefined, imageFile: selectedFile || undefined, options: { ...selectedOptions, provider_endpoint: selectedProvider?.provider_endpoint, ratio: selectedOptions['Ratio'] } });
        setProcessingMessage('');
      }
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
    setOutputLoaded(false);
    setSelectedProviderId(defaultProvider?.id || '');
  };

  /* ── Not found ── */
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
  const showBeforeAfter = (tool.slug === 'upscale' || tool.slug === 'enhance' || tool.slug === 'remove-bg') && status === 'completed' && !!result?.output_url && !!previewUrl;
  const creditCost = selectedProvider?.credit_cost ?? tool.creditCost;
  const isCompleted = status === 'completed' && !!result?.output_url;
  const isFailed = status === 'failed';
  const isProcessing = status === 'uploading' || status === 'processing';

  return (
    <div className="flex-1 animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* Back link */}
        <button
          onClick={() => navigate('/tools')}
          className={`flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          {t.toolPage.backToHome || 'All Tools'}
        </button>

        {/* ══════ 2-Column Desktop / Stacked Mobile ══════ */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* ── LEFT: Form Panel ── */}
          <div className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0">
            <div className="rounded-2xl bg-card border border-border/50 p-5 sm:p-7 space-y-5">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">{tool.name}</h1>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{tool.shortDesc || tool.description}</p>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Completed state */}
              {isCompleted ? (
                <div className="space-y-4">
                  {/* Mobile: show result inline */}
                  {isMobile && (
                    <div className="mb-2">
                      <PreviewPanel
                        tool={tool}
                        previewUrl={previewUrl}
                        result={result}
                        outputLoaded={outputLoaded}
                        setOutputLoaded={setOutputLoaded}
                        showBeforeAfter={showBeforeAfter}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Coins size={11} /><span>{result.credits_charged} credits used</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDownload} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
                      <Download size={15} /> Download
                    </button>
                    <button onClick={handleReset} className="h-11 px-5 rounded-xl bg-muted/50 text-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-muted/70 transition-colors cursor-pointer">
                      <RotateCcw size={14} /> New
                    </button>
                  </div>
                </div>

              ) : isFailed ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-[13px] text-destructive">{error || 'Something went wrong'}</p>
                  </div>
                  <button onClick={handleReset} className="w-full h-11 rounded-xl bg-muted/50 text-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-muted/70 transition-colors cursor-pointer">
                    <RotateCcw size={14} /> Try Again
                  </button>
                </div>

              ) : (
                <>
                  {/* Upload or Prompt */}
                  {isUpload ? (
                    <div>
                      {previewUrl ? (
                        <div className="relative rounded-xl overflow-hidden bg-muted/10">
                          <img src={previewUrl} alt="Preview" className="w-full rounded-xl object-contain max-h-[280px]" />
                          <button
                            onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm text-foreground flex items-center justify-center hover:bg-background transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={e => e.preventDefault()}
                          className="w-full rounded-xl border border-dashed border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/15 transition-all cursor-pointer group"
                        >
                          <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                              <Upload size={20} className="text-primary" />
                            </div>
                            <span className="text-[14px] font-medium text-foreground mb-1">{t.toolPage.dropImage}</span>
                            <span className="text-[12px] text-muted-foreground">{t.toolPage.fileTypes}</span>
                          </div>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </div>
                  ) : (
                    <textarea
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder={t.toolPage.describePrompt}
                      className="w-full h-28 bg-muted/10 border border-border/40 rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 focus:bg-muted/15 transition-all"
                    />
                  )}

                  {/* Provider selector */}
                  {activeProviders.length > 1 && tool.slug !== 'generate' && (
                    <ToolProviderSelector
                      providers={activeProviders}
                      selected={selectedProviderId}
                      onSelect={setSelectedProviderId}
                    />
                  )}

                  {/* Options */}
                  {currentOptions.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {currentOptions.map(opt => (
                        <div key={opt.label} className="flex-1 min-w-[120px]">
                          <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">{opt.label}</label>
                          <select
                            value={selectedOptions[opt.label] || opt.defaultValue}
                            onChange={e => setSelectedOptions(prev => ({ ...prev, [opt.label]: e.target.value }))}
                            className="w-full h-10 bg-muted/10 border border-border/40 rounded-xl px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                          >
                            {opt.values.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Processing progress */}
                  {isProcessing && (
                    <div className="space-y-2.5">
                      <Progress value={status === 'uploading' ? 30 : 70} className="h-1.5" />
                      <p className="text-[12px] text-muted-foreground text-center">
                        {status === 'uploading' ? 'Uploading image…' : (processingMessage || 'Processing with AI…')}
                      </p>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={handleRun}
                    disabled={!canRun}
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        {processingMessage || 'Processing…'}
                      </span>
                    ) : (
                      <>
                        <span>{isUpload ? (tool.slug === 'upscale' ? 'Enhance' : t.toolPage.uploadProcess) : t.toolPage.generate}</span>
                        <span className="flex items-center gap-1 text-primary-foreground/70 text-[12px]">
                          <Coins size={12} /> {creditCost} {t.toolPage.credits}
                        </span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: Preview Panel (desktop only, mobile shows inline) ── */}
          <div className={`flex-1 min-w-0 ${isMobile && isCompleted ? 'hidden' : ''}`}>
            <div className="lg:sticky lg:top-24">
              <PreviewPanel
                tool={tool}
                previewUrl={previewUrl}
                result={result}
                outputLoaded={outputLoaded}
                setOutputLoaded={setOutputLoaded}
                showBeforeAfter={showBeforeAfter}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom safe spacing for mobile nav */}
      <div className="h-24 lg:h-0" />
    </div>
  );
}
