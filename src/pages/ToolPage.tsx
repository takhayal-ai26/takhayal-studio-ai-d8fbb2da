import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Upload, Coins, Loader2, X, ArrowLeft } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useToolProviders } from '@/hooks/useToolProviders';
import { ToolProviderSelector } from '@/components/tools/ToolProviderSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useApp();
  const { t, isRTL } = useLanguage();
  const { tools } = useToolsDB();
  const { user } = useAuth();
  const { createJob } = useGenerationJobs();
  const isMobile = useIsMobile();

  const tool = tools.find(t => t.slug === toolId || t.id === toolId);
  const { activeProviders, defaultProvider } = useToolProviders(tool?.id);

  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('You must be logged in');
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${authUser.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('tool-files').upload(path, file);
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
    const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(path);
    return urlData.publicUrl;
  }, []);

  const handleRun = () => {
    requireAuth(async () => {
      if (submitting) return;
      setSubmitting(true);

      try {
        // 1. Upload image if needed
        let imageUrl: string | null = null;
        if (selectedFile) {
          imageUrl = await uploadImage(selectedFile);
        }

        // 2. Create generation_logs record (queued)
        const creditCost = selectedProvider?.credit_cost ?? tool!.creditCost;
        const promptText = inputValue || tool!.name || tool!.slug;

        const jobId = await createJob({
          prompt: promptText.slice(0, 500),
          ratio: selectedOptions['Ratio'] || '1:1',
          qualityTier: '1K',
          modelId: null,
          creditCost,
          sourceTag: `tool:${tool!.slug}`,
        });

        if (!jobId) {
          throw new Error('Failed to create job');
        }

        // 3. Fire-and-forget: invoke run-tool with job_id
        supabase.functions.invoke('run-tool', {
          body: {
            tool_slug: tool!.slug,
            prompt: inputValue || null,
            image_url: imageUrl,
            options: {
              ...selectedOptions,
              provider_endpoint: selectedProvider?.provider_endpoint,
              ratio: selectedOptions['Ratio'],
            },
            job_id: jobId,
          },
        }).catch(err => {
          console.error('run-tool invoke error:', err);
        });

        // 4. Redirect to gallery immediately
        toast.success(isRTL ? 'تم إرسال المهمة' : 'Job submitted — check Gallery');
        navigate('/gallery');

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    });
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
  const canRun = isUpload ? !!selectedFile && !submitting : inputValue.trim().length > 0 && !submitting;
  const creditCost = selectedProvider?.credit_cost ?? tool.creditCost;

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <h1 className="typo-heading-card">{tool.name}</h1>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{tool.shortDesc || tool.description}</p>
                </div>
              </div>

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

              {/* CTA Button */}
              <button
                onClick={handleRun}
                disabled={!canRun}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {isRTL ? 'جاري الإرسال…' : 'Submitting…'}
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
            </div>
          </div>

          {/* ── RIGHT: Preview Panel (desktop only) ── */}
          <div className="flex-1 min-w-0">
            <div className="lg:sticky lg:top-24">
              {tool.image ? (
                <div className="rounded-2xl overflow-hidden bg-muted/5">
                  <img src={tool.image} alt={tool.name} className="w-full rounded-2xl object-cover aspect-[4/3]" />
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-foreground/80 mb-1">{tool.heroTitle}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{tool.heroSubtitle}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-muted/10 to-card aspect-[4/3] flex items-center justify-center">
                  <div className="text-center px-8">
                    <h3 className="text-lg font-medium text-foreground/60 mb-2">{tool.heroTitle}</h3>
                    <p className="text-[13px] text-muted-foreground">{tool.heroSubtitle}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom safe spacing for mobile nav */}
      <div className="h-24 lg:h-0" />
    </div>
  );
}
