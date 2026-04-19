import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Upload, Coins, Loader2, X, Wand2, ArrowLeftRight, Download, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToolsDB } from '@/hooks/useToolsDB';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { BackToImageTools } from '@/components/tools/BackToImageTools';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'];
const QUALITIES: Array<'1K' | '2K' | '4K'> = ['1K', '2K', '4K'];

export default function EditImagePage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { t, isRTL, lang } = useLanguage();
  const isAr = lang === 'ar';
  const { tools } = useToolsDB();
  const { user } = useAuth();
  const { requireAuth, openUpgradeModal, credits } = useApp();
  const { submitJob } = useGenerationJobs();

  const tool = tools.find(tt => tt.slug === toolId || tt.id === toolId);
  const { tiers } = usePricingTiers(tool?.selectedModelId || null);

  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [ratio, setRatio] = useState('1:1');
  const [submitting, setSubmitting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve credit cost from pricing tier
  const creditCost = useMemo(() => {
    const match = tiers.find(tier => tier.quality_level === resolution && tier.is_active);
    return match?.credits_charged ?? tool?.creditCost ?? 10;
  }, [tiers, resolution, tool]);

  // Listen for the active job to complete
  useEffect(() => {
    if (!activeJobId || !user) return;

    const channel = supabase
      .channel(`edit-image-job-${activeJobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'generation_logs', filter: `id=eq.${activeJobId}` },
        (payload) => {
          const updated = payload.new as Record<string, any>;
          if (updated.status === 'completed' && updated.image_url) {
            setResultUrl(updated.image_url);
            setSubmitting(false);
            toast.success(isAr ? 'تم تعديل صورتك' : 'Your image is ready');
          } else if (updated.status === 'failed') {
            setSubmitting(false);
            setError(isAr ? 'فشل التعديل، لم يتم خصم رصيد' : 'Edit failed — no credits charged');
            toast.error(isAr ? 'فشل التعديل' : 'Edit failed');
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeJobId, user, isAr]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return isAr ? 'نوع الملف غير مدعوم. استخدم JPG, PNG أو WEBP' : 'Unsupported file type. Use JPG, PNG, or WEBP';
    }
    if (file.size > MAX_BYTES) {
      return isAr ? 'حجم الملف يتجاوز 10 ميغابايت' : 'File exceeds 10MB';
    }
    return null;
  };

  const acceptFile = (file: File) => {
    const err = validateFile(file);
    if (err) { setError(err); toast.error(err); return; }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setShowOriginal(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error(isAr ? 'يجب تسجيل الدخول' : 'You must be logged in');
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${authUser.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('tool-files').upload(path, file);
    if (uploadErr) throw new Error(uploadErr.message);
    const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(path);
    return urlData.publicUrl;
  }, [isAr]);

  const handleEdit = () => {
    requireAuth(async () => {
      if (submitting || !selectedFile || !tool) return;
      if (!prompt.trim()) {
        setError(isAr ? 'الرجاء وصف التعديل المطلوب' : 'Please describe what to edit');
        return;
      }
      if (credits < creditCost) {
        openUpgradeModal();
        return;
      }

      setSubmitting(true);
      setResultUrl(null);
      setError(null);

      try {
        const imageUrl = await uploadImage(selectedFile);
        const jobId = await submitJob({
          prompt: prompt.trim(),
          ratio,
          qualityTier: resolution,
          modelId: tool.selectedModelId,
          creditCost,
          sourceTag: `tool:${tool.slug}`,
          imageUrl,
        });
        if (!jobId) throw new Error('Failed to create job');
        setActiveJobId(jobId);
        toast.success(isAr ? 'جارٍ تعديل صورتك...' : 'Editing your image...');
      } catch (err) {
        const msg = err instanceof Error ? err.message : (isAr ? 'حدث خطأ' : 'Something went wrong');
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
      }
    });
  };

  const resetForReupload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setActiveJobId(null);
    setShowOriginal(false);
    setError(null);
  };

  const editAgain = () => {
    setResultUrl(null);
    setActiveJobId(null);
    setShowOriginal(false);
  };

  const downloadResult = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `takhayal-edit-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(resultUrl, '_blank');
    }
  };

  if (!tool) {
    return (
      <div className="pt-16 flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-light text-foreground mb-2">{t.toolPage.toolNotFound}</h1>
          <button onClick={() => navigate('/image')} className="text-primary text-sm hover:underline">
            {t.toolPage.backToImageTools}
          </button>
        </div>
      </div>
    );
  }

  const visiblePreview = resultUrl && !showOriginal ? resultUrl : previewUrl;

  return (
    <div className="flex-1 animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <BackToImageTools />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* LEFT — Controls */}
          <div className="w-full lg:w-[460px] xl:w-[500px] flex-shrink-0">
            <div className="rounded-2xl bg-card border border-border/50 p-5 sm:p-7 space-y-6">

              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Wand2 size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="typo-heading-card text-2xl font-bold leading-tight">{tool.name}</h1>
                  <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Model chip */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {isAr ? 'النموذج' : 'Model'}
                </span>
                <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-muted/30 border border-border/40 text-[11.5px] font-medium text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Nano Banana 2
                </div>
                <div className="ms-auto inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                  <Coins size={11} /> {creditCost}
                </div>
              </div>

              {/* Edit instruction */}
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-2 block">
                  {isAr ? 'تعليمات التعديل' : 'Edit instruction'}
                </label>
                <textarea
                  value={prompt}
                  onChange={e => { setPrompt(e.target.value); setError(null); }}
                  placeholder={isAr ? 'صِف التغييرات التي تريدها...' : 'Describe what you want to change...'}
                  className="w-full h-28 bg-muted/10 border border-border/40 rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 focus:bg-muted/15 transition-all"
                />
              </div>

              {/* Resolution */}
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-2 block">
                  {isAr ? 'الجودة' : 'Resolution'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {QUALITIES.map(q => {
                    const tier = tiers.find(tt => tt.quality_level === q);
                    const cost = tier?.credits_charged ?? '–';
                    return (
                      <button
                        key={q}
                        onClick={() => setResolution(q)}
                        className={cn(
                          'h-12 rounded-xl border text-center transition-all cursor-pointer',
                          resolution === q
                            ? 'border-primary/60 bg-primary/10 text-foreground'
                            : 'border-border/40 bg-muted/10 text-muted-foreground hover:border-border/60 hover:bg-muted/15'
                        )}
                      >
                        <div className="text-[12.5px] font-semibold">{q}</div>
                        <div className="text-[10px] opacity-70">{cost} {isAr ? 'رصيد' : 'cr'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aspect ratio */}
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-2 block">
                  {isAr ? 'النسبة' : 'Aspect ratio'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {RATIOS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRatio(r)}
                      className={cn(
                        'h-9 px-3.5 rounded-full border text-[12px] font-medium transition-all cursor-pointer',
                        ratio === r
                          ? 'border-primary/60 bg-primary/10 text-foreground'
                          : 'border-border/40 bg-muted/10 text-muted-foreground hover:border-border/60'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error inline */}
              {error && (
                <p className="text-[12px] text-destructive">{error}</p>
              )}

              {/* CTA */}
              <button
                onClick={handleEdit}
                disabled={submitting || !selectedFile || !prompt.trim()}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {isAr ? 'جارٍ تعديل صورتك...' : 'Editing your image...'}
                  </span>
                ) : (
                  <>
                    <Wand2 size={15} />
                    <span>{isAr ? 'تعديل الصورة' : 'Edit Image'}</span>
                    <span className="inline-flex items-center gap-1 text-primary-foreground/70 text-[12px]">
                      · <Coins size={11} /> {creditCost}
                    </span>
                  </>
                )}
              </button>

              {!selectedFile && (
                <p className="text-[11.5px] text-center text-muted-foreground/70">
                  {isAr ? 'ارفع صورة للبدء' : 'Upload an image to get started'}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — Canvas */}
          <div className="flex-1 min-w-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              {!previewUrl && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border/50 bg-muted/5 hover:border-primary/40 hover:bg-primary/[0.03] transition-all cursor-pointer group flex flex-col items-center justify-center text-center px-8"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 group-hover:scale-105 transition-all">
                    <Upload size={26} className="text-primary" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-1">
                    {isAr ? 'أسقط صورتك هنا أو انقر للرفع' : 'Drop your image here or click to upload'}
                  </h3>
                  <p className="text-[12px] text-muted-foreground">
                    {isAr ? 'JPG, PNG, WEBP حتى ١٠ ميغابايت' : 'JPG, PNG, WEBP up to 10MB'}
                  </p>
                </div>
              )}

              {previewUrl && (
                <div className="relative rounded-2xl overflow-hidden bg-muted/10 border border-border/40">
                  <div className="aspect-[4/3] flex items-center justify-center">
                    <img
                      src={visiblePreview || previewUrl}
                      alt="Preview"
                      className={cn(
                        'max-w-full max-h-full object-contain transition-opacity',
                        submitting && 'opacity-60'
                      )}
                    />
                  </div>

                  {submitting && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-[shimmer_2s_infinite]" />
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <div className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-background/90 backdrop-blur-md border border-border/50 text-[12.5px] font-medium text-foreground shadow-lg">
                          <Loader2 size={13} className="animate-spin text-primary" />
                          {isAr ? 'جارٍ تعديل صورتك...' : 'Editing your image...'}
                        </div>
                      </div>
                    </div>
                  )}

                  {!submitting && !resultUrl && (
                    <button
                      onClick={resetForReupload}
                      className="absolute top-3 end-3 w-9 h-9 rounded-full bg-background/85 backdrop-blur-sm text-foreground flex items-center justify-center hover:bg-background transition-colors cursor-pointer shadow-sm"
                      aria-label={isAr ? 'إزالة الصورة' : 'Remove image'}
                    >
                      <X size={15} />
                    </button>
                  )}

                  {resultUrl && (
                    <div className="absolute top-3 end-3 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-primary text-primary-foreground text-[10.5px] font-semibold uppercase tracking-wider shadow-lg">
                      <ImageIcon size={10} />
                      {showOriginal ? (isAr ? 'الأصلية' : 'Original') : (isAr ? 'المعدّلة' : 'Edited')}
                    </div>
                  )}
                </div>
              )}

              {/* Result actions */}
              {resultUrl && !submitting && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowOriginal(s => !s)}
                    className="flex-1 min-w-[140px] h-11 rounded-xl border border-border/50 bg-card hover:bg-muted/40 text-[13px] font-medium text-foreground inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight size={14} />
                    {showOriginal ? (isAr ? 'عرض المعدّلة' : 'Show Edited') : (isAr ? 'عرض الأصلية' : 'Show Original')}
                  </button>
                  <button
                    onClick={downloadResult}
                    className="flex-1 min-w-[140px] h-11 rounded-xl border border-border/50 bg-card hover:bg-muted/40 text-[13px] font-medium text-foreground inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    {isAr ? 'تنزيل' : 'Download'}
                  </button>
                  <button
                    onClick={() => navigate('/gallery')}
                    className="flex-1 min-w-[140px] h-11 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {isAr ? 'فتح المعرض' : 'Open in Gallery'}
                  </button>
                  <button
                    onClick={editAgain}
                    className="flex-1 min-w-[140px] h-11 rounded-xl bg-primary text-primary-foreground hover:brightness-110 text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Wand2 size={14} />
                    {isAr ? 'تعديل مرة أخرى' : 'Edit Again'}
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="h-24 lg:h-0" />
    </div>
  );
}
