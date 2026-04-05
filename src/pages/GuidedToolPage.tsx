import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Upload, Coins, Loader2, X, ArrowLeft } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function GuidedToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { t, isRTL, lang } = useLanguage();
  const { tools } = useToolsDB();
  const { user } = useAuth();
  const { requireAuth, openUpgradeModal, credits } = useApp();
  const { submitJob } = useGenerationJobs();
  const isMobile = useIsMobile();

  const tool = tools.find(t => t.slug === toolId || t.id === toolId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleGenerate = () => {
    requireAuth(async () => {
      if (submitting || !selectedFile || !tool) return;

      const creditCost = tool.creditCost;
      if (credits < creditCost) {
        openUpgradeModal();
        return;
      }

      setSubmitting(true);
      try {
        // Upload image
        const imageUrl = await uploadImage(selectedFile);

        // Use hidden prompt
        const prompt = lang === 'ar' && tool.defaultPromptAr
          ? tool.defaultPromptAr
          : tool.defaultPromptEn;

        // Submit via existing generation pipeline
        const jobId = await submitJob({
          prompt: prompt || tool.name,
          ratio: '1:1',
          qualityTier: '1K',
          modelId: tool.selectedModelId,
          creditCost,
          sourceTag: `tool:${tool.slug}`,
          imageUrl,
        });

        if (!jobId) throw new Error('Failed to create job');

        toast.success(isRTL ? 'تم إرسال المهمة' : 'Processing — check Gallery');
        navigate('/gallery');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    });
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

  const canRun = !!selectedFile && !submitting;

  return (
    <div className="flex-1 animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Back link */}
        <button
          onClick={() => navigate('/tools')}
          className={`flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          {t.toolPage.allTools}
        </button>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* LEFT: Form Panel */}
          <div className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0">
            <div className="rounded-2xl bg-card border border-border/50 p-5 sm:p-7 space-y-5">
              {/* Header */}
              <div>
                <h1 className="typo-heading-card text-2xl font-bold">{tool.name}</h1>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{tool.shortDesc || tool.description}</p>
              </div>

              {tool.description && tool.description !== tool.shortDesc && (
                <p className="text-[13px] text-foreground/70 leading-relaxed">{tool.description}</p>
              )}

              {/* Upload */}
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
                      <span className="text-[14px] font-medium text-foreground mb-1">{tool.uploadLabel}</span>
                      <span className="text-[12px] text-muted-foreground">{tool.uploadHelper}</span>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>

              {/* CTA Button */}
              <button
                onClick={handleGenerate}
                disabled={!canRun}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {t.toolPage.submitting}
                  </span>
                ) : (
                  <>
                    <span>{tool.ctaLabel}</span>
                    <span className="flex items-center gap-1 text-primary-foreground/70 text-[12px]">
                      <Coins size={12} /> {tool.creditCost} {t.toolPage.credits}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Preview Panel */}
          <div className="flex-1 min-w-0">
            <div className="lg:sticky lg:top-24">
              {tool.image ? (
                <div className="rounded-2xl overflow-hidden bg-muted/5">
                  <img src={tool.image} alt={tool.name} className="w-full rounded-2xl object-cover aspect-[4/3]" />
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-foreground/80 mb-1">{tool.heroTitle || tool.name}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{tool.heroSubtitle || tool.shortDesc}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-muted/10 to-card aspect-[4/3] flex items-center justify-center">
                  <div className="text-center px-8">
                    <h3 className="text-lg font-medium text-foreground/60 mb-2">{tool.heroTitle || tool.name}</h3>
                    <p className="text-[13px] text-muted-foreground">{tool.heroSubtitle || tool.shortDesc}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="h-24 lg:h-0" />
    </div>
  );
}
