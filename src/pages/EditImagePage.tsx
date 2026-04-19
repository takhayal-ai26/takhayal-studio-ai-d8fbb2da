import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Coins, Cpu, Maximize, Image as ImageIcon, Wand2, ChevronRight, Plus, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useApp, AspectRatio } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { useModels } from '@/hooks/useModels';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

import { ModelDropdown } from '@/components/layout/dropdowns/ModelDropdown';
import { SizeDropdown } from '@/components/layout/dropdowns/SizeDropdown';
import { ResolutionDropdown } from '@/components/layout/dropdowns/ResolutionDropdown';
import { MobileBottomSheet } from '@/components/layout/dropdowns/MobileBottomSheet';
import { BackToImageTools } from '@/components/tools/BackToImageTools';

const MAX_SLOTS = 14;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const FALLBACK_COVER = '/placeholder.svg';

type OpenDropdown = 'model' | 'size' | 'resolution' | null;

interface UploadedImage {
  preview: string;
  url: string | null;
}

// ───────────────────────────────────────────── Controls panel ─────────────────────────────────────────────

interface ControlsPanelProps {
  inSheet?: boolean;
  onAfterGenerate?: () => void;
}

function EditControlsPanel({ inSheet = false, onAfterGenerate }: ControlsPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, isAuthenticated, openAuthModal, openUpgradeModal, requireAuth } = useApp();
  const { submitJob } = useGenerationJobs();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const { activeModels } = useModels();
  const { allTiers, getCreditsForModelQuality } = usePricingTiers();

  // Edit-capable models only
  const editableModels = useMemo(
    () => activeModels.filter(m => m.supports_image_input && m.media_type === 'image'),
    [activeModels],
  );

  // Default to Nano Banana 2 if available, else first editable model
  const nanoBanana2 = useMemo(
    () => editableModels.find(m => m.endpoint_id === 'fal-ai/nano-banana-2') || editableModels[0],
    [editableModels],
  );

  const [selectedModelId, setSelectedModelId] = useState<string>('');
  useEffect(() => {
    if (!selectedModelId && nanoBanana2) setSelectedModelId(nanoBanana2.id);
  }, [nanoBanana2, selectedModelId]);

  const currentModel = editableModels.find(m => m.id === selectedModelId) || nanoBanana2;
  const maxImages = Math.min(currentModel?.max_image_inputs ?? 1, MAX_SLOTS);

  // Available quality tiers from pricing
  const modelQualityTiers = useMemo(() => {
    if (!currentModel) return ['1K'];
    const fromPricing = (allTiers[currentModel.id] || [])
      .filter(t => t.is_active && t.is_available !== false && t.quality_level)
      .map(t => t.quality_level as string);
    return fromPricing.length > 0 ? fromPricing : currentModel.supported_quality_tiers || ['1K'];
  }, [currentModel, allTiers]);

  // Available aspect ratios
  const availableRatios = currentModel?.supported_ratios?.length
    ? currentModel.supported_ratios.filter(r => r !== 'auto')
    : ['1:1', '16:9', '9:16', '4:5'];

  const [prompt, setPrompt] = useState('');
  const [enhance, setEnhance] = useState(false);
  const [resolution, setResolution] = useState<string>('1K');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const slotInputRef = useRef<HTMLInputElement>(null);
  const slotTargetIndex = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const modelRowRef = useRef<HTMLButtonElement>(null);
  const sizeRowRef = useRef<HTMLButtonElement>(null);
  const resRowRef = useRef<HTMLButtonElement>(null);

  // Keep resolution / ratio in sync with model capabilities
  useEffect(() => {
    if (currentModel && !modelQualityTiers.includes(resolution)) {
      setResolution(modelQualityTiers[0] || '1K');
    }
  }, [currentModel, modelQualityTiers, resolution]);

  useEffect(() => {
    if (!availableRatios.includes(aspectRatio)) {
      setAspectRatio((currentModel?.default_ratio as string) || availableRatios[0] || '1:1');
    }
  }, [availableRatios, aspectRatio, currentModel]);

  // Reset uploads when switching to a model that no longer supports input
  useEffect(() => {
    if (currentModel && !currentModel.supports_image_input && uploaded.length > 0) {
      setUploaded([]);
    }
  }, [currentModel, uploaded.length]);

  // Pricing
  const creditCost = useMemo(() => {
    if (!currentModel) return 0;
    const v = getCreditsForModelQuality(currentModel.id, resolution);
    return v ?? currentModel.credits_per_generation ?? 0;
  }, [currentModel, resolution, getCreditsForModelQuality]);

  // Click outside to close dropdown (ignore portal)
  useEffect(() => {
    if (inSheet) return;
    const handler = (e: MouseEvent) => {
      if (!openDropdown || !panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      const t = e.target as HTMLElement;
      if (t.closest('[data-dropdown-portal]')) return;
      setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown, inSheet]);

  // ───── Upload helpers ─────
  const uploadOne = useCallback(async (file: File, targetIndex?: number) => {
    if (!user) { openAuthModal('signup'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(isAr ? 'نوع الملف غير مدعوم' : 'Unsupported file type');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(isAr ? 'حجم الملف يتجاوز 10 ميغابايت' : 'File exceeds 10MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    const placeholder: UploadedImage = { preview, url: null };

    setUploaded(prev => {
      if (typeof targetIndex === 'number') {
        const next = [...prev];
        next[targetIndex] = placeholder;
        return next;
      }
      return [...prev, placeholder];
    });
    setIsUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/edit-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('tool-files')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(path);

      setUploaded(prev => prev.map(img => img.preview === preview ? { ...img, url: urlData.publicUrl } : img));
    } catch (err) {
      console.error('Upload failed:', err);
      setUploaded(prev => prev.filter(img => img.preview !== preview));
      toast.error(isAr ? 'فشل الرفع' : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [user, openAuthModal, isAr]);

  const handleAddFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    const remaining = maxImages - uploaded.length;
    list.slice(0, Math.max(remaining, 0)).forEach(f => uploadOne(f));
  }, [maxImages, uploaded.length, uploadOne]);

  const handleSlotPick = (index: number) => {
    if (!user) { openAuthModal('signup'); return; }
    slotTargetIndex.current = index;
    slotInputRef.current?.click();
  };

  const handleSlotInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = slotTargetIndex.current;
    if (file) {
      if (typeof idx === 'number' && idx < uploaded.length) uploadOne(file, idx);
      else uploadOne(file);
    }
    e.target.value = '';
    slotTargetIndex.current = null;
  };

  const removeSlot = (index: number) => {
    setUploaded(prev => prev.filter((_, i) => i !== index));
  };

  const onSlotDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { openAuthModal('signup'); return; }
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (index < uploaded.length) uploadOne(file, index);
    else if (uploaded.length < maxImages) uploadOne(file);
  };

  // ───── Generate ─────
  const readyImages = uploaded.filter(u => u.url).map(u => u.url!);
  const canGenerate =
    !!currentModel &&
    readyImages.length > 0 &&
    prompt.trim().length > 0 &&
    !submitting &&
    !isUploading;

  const handleGenerate = () => {
    requireAuth(async () => {
      if (!canGenerate || !currentModel) return;
      if (credits < creditCost) { openUpgradeModal(); return; }

      setSubmitting(true);
      try {
        const jobId = await submitJob({
          prompt: prompt.trim(),
          ratio: aspectRatio,
          qualityTier: resolution,
          modelId: currentModel.id,
          creditCost,
          sourceTag: 'tool:edit-image',
          imageUrl: readyImages.length === 1 ? readyImages[0] : undefined,
          imageUrls: readyImages.length > 1 ? readyImages : undefined,
        });
        if (!jobId) throw new Error('Failed to submit job');
        toast.success(isAr ? 'بدأ تعديل صورتك' : 'Editing started');
        onAfterGenerate?.();
        navigate(`/gallery?highlight=${jobId}`);
      } catch (err) {
        console.error(err);
        toast.error(isAr ? 'فشل بدء التعديل' : 'Failed to start edit');
      } finally {
        setSubmitting(false);
      }
    });
  };

  const getRect = (ref: React.RefObject<HTMLElement>): DOMRect | null =>
    ref.current?.getBoundingClientRect() ?? null;

  // ───── Render ─────
  // Compute visible slot count: filled slots + 1 empty (capped at maxImages)
  const visibleSlots = Math.min(uploaded.length + 1, maxImages);
  const slotIndices = Array.from({ length: visibleSlots }, (_, i) => i);

  const containerCls = inSheet
    ? 'flex flex-col w-full bg-background'
    : 'w-full md:w-[380px] xl:w-[420px] flex flex-col bg-background flex-shrink-0 overflow-visible relative z-30';

  return (
    <aside ref={panelRef} className={containerCls}>
      <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-2 scrollbar-thin">
        {!inSheet && <BackToImageTools className="mb-2" />}

        {/* Title */}
        <div className="px-1 pb-1">
          <h1 className="typo-heading-card text-[20px] font-bold leading-tight">
            {isAr ? 'تعديل الصورة' : 'Edit Image'}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {isAr ? 'حوّل صورك بدقة باستخدام Nano Banana 2' : 'Transform your images with Nano Banana 2'}
          </p>
        </div>

        {/* Prompt */}
        <div className="rounded-2xl bg-card/50 p-4 border border-border/30 hover:border-border/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 size={12} className="text-primary" />
              </div>
              <label className="typo-label-strong text-[14px]">
                {isAr ? 'تعليمات التعديل' : 'Edit Instruction'}
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              {prompt.length > 0 && (
                <button
                  onClick={() => setPrompt('')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-all"
                >
                  <X size={13} />
                </button>
              )}
              <button
                onClick={() => setEnhance(!enhance)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                  enhance
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]'
                }`}
              >
                <Sparkles size={11} />{t.studio.enhance}
              </button>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, 500))}
            placeholder={isAr ? 'صِف التغييرات التي تريدها...' : 'Describe what you want to change...'}
            dir={isAr ? 'rtl' : 'ltr'}
            className="w-full min-h-[100px] bg-foreground/[0.03] border border-border/20 rounded-xl p-3.5 text-[15px] font-medium text-foreground placeholder:text-foreground/40 focus:border-primary/30 focus:bg-foreground/[0.04] focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none leading-relaxed transition-all"
          />
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[12px] font-medium text-foreground/50 tabular-nums">{prompt.length}/500</span>
          </div>
        </div>

        {/* Upload slots */}
        <input
          ref={slotInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleSlotInputChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={maxImages > 1}
          className="hidden"
          onChange={e => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] uppercase tracking-[0.5px] font-semibold text-foreground/60">
              {isAr ? 'الصور المرجعية' : 'Reference images'}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {uploaded.length}/{maxImages}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {slotIndices.map(i => {
              const img = uploaded[i];
              const isEmpty = !img;
              return (
                <div
                  key={i}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => onSlotDrop(e, i)}
                  className={cn(
                    'relative aspect-square rounded-xl overflow-hidden transition-all',
                    isEmpty
                      ? 'border border-dashed border-foreground/20 bg-foreground/[0.02] hover:border-primary/40 hover:bg-primary/[0.03] cursor-pointer'
                      : 'border border-primary/20 bg-card/50',
                  )}
                  onClick={() => isEmpty && handleSlotPick(i)}
                >
                  {isEmpty ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/60">
                      <Plus size={18} />
                    </div>
                  ) : (
                    <>
                      <img src={img.preview} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                      {!img.url && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                        className="absolute top-1 end-1 w-6 h-6 rounded-md bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={isAr ? 'إزالة' : 'Remove'}
                      >
                        <X size={12} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2 px-1">
            {isAr ? 'JPG / PNG / WEBP حتى 10 ميغابايت' : 'JPG / PNG / WEBP up to 10MB'}
          </p>
        </div>

        {/* Model / Size / Resolution rows */}
        {[
          { ref: modelRowRef, key: 'model' as OpenDropdown, icon: <Cpu size={14} />, label: t.studio.model, value: currentModel?.model_name || 'Select' },
          { ref: sizeRowRef, key: 'size' as OpenDropdown, icon: <Maximize size={14} />, label: t.studio.size, value: aspectRatio },
          { ref: resRowRef, key: 'resolution' as OpenDropdown, icon: <ImageIcon size={14} />, label: t.studio.resolution, value: resolution },
        ].map(item => (
          <button
            key={item.key}
            ref={item.ref}
            onClick={() => setOpenDropdown(prev => prev === item.key ? null : item.key)}
            className={`w-full flex items-center justify-between h-[46px] px-3.5 rounded-xl bg-card/40 border transition-all duration-200 ${
              openDropdown === item.key ? 'border-primary/30 bg-card/60' : 'border-border/20 hover:border-border/30'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-foreground/60">{item.icon}</span>
              <span className="text-[12px] text-foreground/60 uppercase tracking-[0.5px] font-semibold">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-foreground">{item.value}</span>
              <ChevronRight size={13} className={`text-muted-foreground transition-transform duration-200 ${openDropdown === item.key ? 'rotate-90' : ''}`} />
            </div>
          </button>
        ))}
      </div>

      {/* Generate button */}
      <div className="flex-shrink-0 p-4">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full h-[44px] rounded-xl text-[14px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            canGenerate
              ? 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-[0_4px_20px_-4px] shadow-primary/25'
              : 'bg-foreground/[0.04] border border-border/10 text-muted-foreground cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              {isAr ? 'جارٍ التعديل...' : 'Editing...'}
            </span>
          ) : (
            <>
              {isAr ? 'تعديل الصورة' : 'Edit Image'}
              <span className="flex items-center gap-1 text-[12px] opacity-70">
                <Coins size={11} />{creditCost}
              </span>
            </>
          )}
        </button>
        {!isAuthenticated && (
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            {isAr ? 'يجب تسجيل الدخول للتعديل' : 'Sign in to start editing'}
          </p>
        )}
      </div>

      {/* Dropdowns (portal) */}
      {openDropdown === 'model' && (
        <ModelDropdown
          models={editableModels}
          selectedModelId={selectedModelId}
          allTiers={allTiers}
          language={lang}
          anchorRect={getRect(modelRowRef)}
          onSelect={(id) => { setSelectedModelId(id); setOpenDropdown(null); }}
          onClose={() => setOpenDropdown(null)}
        />
      )}
      {openDropdown === 'size' && (
        <SizeDropdown
          availableRatios={availableRatios}
          selectedRatio={aspectRatio}
          modelName={currentModel?.model_name}
          anchorRect={getRect(sizeRowRef)}
          onSelect={(r) => { setAspectRatio(r); setOpenDropdown(null); }}
          onClose={() => setOpenDropdown(null)}
        />
      )}
      {openDropdown === 'resolution' && (
        <ResolutionDropdown
          tiers={modelQualityTiers}
          allTiers={allTiers}
          currentModelId={currentModel?.id || ''}
          currentModelName={currentModel?.model_name || ''}
          selectedResolution={resolution}
          anchorRect={getRect(resRowRef)}
          onSelect={(r) => { setResolution(r); setOpenDropdown(null); }}
          onClose={() => setOpenDropdown(null)}
          getCreditsForModelQuality={getCreditsForModelQuality}
        />
      )}
    </aside>
  );
}

// ───────────────────────────────────────────── Right panel — cover + results ─────────────────────────────────────────────

function CoverHero({ coverUrl, name, subtitle, isAr }: { coverUrl: string; name: string; subtitle: string; isAr: boolean }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-card/40">
      <div className="aspect-[21/9] sm:aspect-[16/6]">
        <img
          src={coverUrl || FALLBACK_COVER}
          alt={name}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-primary/15 backdrop-blur-md text-primary text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary/20">
            <Wand2 size={10} />
            {isAr ? 'تعديل الصورة' : 'Edit Image'}
          </div>
          <h2 className="text-white text-xl sm:text-2xl font-bold leading-tight drop-shadow-lg">
            {name}
          </h2>
          <p className="text-white/85 text-[12.5px] sm:text-[13.5px] mt-1 max-w-2xl drop-shadow">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecentEdits({ isAr }: { isAr: boolean }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Array<{ id: string; image_url: string | null; prompt: string | null; status: string }>>([]);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    const { data } = await supabase
      .from('generation_logs')
      .select('id, image_url, prompt, status')
      .eq('user_id', user.id)
      .eq('tool_id', 'tool:edit-image')
      .order('created_at', { ascending: false })
      .limit(8);
    setItems(data || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('edit-image-feed')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'generation_logs', filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <Wand2 size={22} className="text-primary" />
        </div>
        <p className="text-[14px] font-semibold text-foreground">
          {isAr ? 'ستظهر صورك المعدّلة هنا' : 'Your edited images will appear here'}
        </p>
        <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
          {isAr ? 'ارفع صورة وصِف التعديل لبدء الإبداع' : 'Upload an image and describe the edit to get started'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-3 px-1">
        {isAr ? 'تعديلاتك الأخيرة' : 'Your recent edits'}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted/20 border border-border/30 group">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.prompt || 'Edited'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {item.status === 'failed' ? (
                  <span className="text-[11px] text-destructive">{isAr ? 'فشل' : 'Failed'}</span>
                ) : (
                  <Loader2 size={16} className="animate-spin text-primary" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────── Page ─────────────────────────────────────────────

export default function EditImagePage() {
  const { toolId } = useParams();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const isMobile = useIsMobile();
  const { tools } = useToolsDB();
  const tool = tools.find(t => t.slug === (toolId || 'edit-image') || t.id === toolId);

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const coverUrl = tool?.image || FALLBACK_COVER;
  const heroTitle = tool?.heroTitle || (isAr ? 'عدّل صورك بدقة احترافية' : 'Edit your images with precision');
  const heroSubtitle = tool?.heroSubtitle || (isAr ? 'حوّل صورك بقوة الذكاء الاصطناعي' : 'Transform your images with AI');

  return (
    <>
      <div
        className="flex flex-1 min-h-0 overflow-visible"
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-1 min-h-0 relative overflow-visible">
          {/* Desktop left panel */}
          {!isMobile && <EditControlsPanel />}

          {/* Right side: cover + results */}
          <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
            <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-[1400px] w-full mx-auto">
              {isMobile && <BackToImageTools />}
              <CoverHero coverUrl={coverUrl} name={heroTitle} subtitle={heroSubtitle} isAr={isAr} />
              <RecentEdits isAr={isAr} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating CTA */}
      {isMobile && (
        <button
          onClick={() => setMobileSheetOpen(true)}
          className="fixed bottom-20 inset-x-4 z-40 h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_12px_32px_-8px] shadow-primary/40 active:scale-[0.98] transition-transform"
        >
          <Wand2 size={16} />
          {isAr ? 'ابدأ التعديل' : 'Start Editing'}
        </button>
      )}

      {/* Mobile bottom sheet with full controls */}
      {isMobile && mobileSheetOpen && (
        <MobileBottomSheet
          title={isAr ? 'تعديل الصورة' : 'Edit Image'}
          open={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
          maxHeight="92vh"
        >
          <EditControlsPanel inSheet onAfterGenerate={() => setMobileSheetOpen(false)} />
        </MobileBottomSheet>
      )}
    </>
  );
}
