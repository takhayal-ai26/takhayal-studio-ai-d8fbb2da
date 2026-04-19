import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Coins, Maximize, Image as ImageIcon, Wand2, ChevronRight, Plus, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { useModels } from '@/hooks/useModels';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

import { SizeDropdown } from '@/components/layout/dropdowns/SizeDropdown';
import { ResolutionDropdown } from '@/components/layout/dropdowns/ResolutionDropdown';
import { MobileBottomSheet } from '@/components/layout/dropdowns/MobileBottomSheet';
import { BackToImageTools } from '@/components/tools/BackToImageTools';

const MAX_SLOTS = 14;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const FALLBACK_COVER = '/placeholder.svg';

type OpenDropdown = 'size' | 'resolution' | null;

interface UploadedImage {
  preview: string;
  url: string | null;
}

interface ControlsPanelProps {
  inSheet?: boolean;
  onAfterGenerate?: () => void;
  uploaded: UploadedImage[];
  setUploaded: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  resultUrl: string | null;
  setResultUrl: (u: string | null) => void;
}

function EditControlsPanel({ inSheet = false, onAfterGenerate, uploaded, setUploaded, setResultUrl }: ControlsPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, isAuthenticated, openAuthModal, openUpgradeModal, requireAuth } = useApp();
  const { submitJob } = useGenerationJobs();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const { activeModels } = useModels();
  const { allTiers, getCreditsForModelQuality } = usePricingTiers();

  // Fixed model: Nano Banana 2
  const currentModel = useMemo(
    () => activeModels.find(m => m.endpoint_id === 'fal-ai/nano-banana-2'),
    [activeModels],
  );

  const maxImages = Math.min(currentModel?.max_image_inputs ?? 14, MAX_SLOTS);

  const modelQualityTiers = useMemo(() => {
    if (!currentModel) return ['1K'];
    const fromPricing = (allTiers[currentModel.id] || [])
      .filter(t => t.is_active && t.is_available !== false && t.quality_level)
      .map(t => t.quality_level as string);
    return fromPricing.length > 0 ? fromPricing : currentModel.supported_quality_tiers || ['1K'];
  }, [currentModel, allTiers]);

  const availableRatios = currentModel?.supported_ratios?.length
    ? currentModel.supported_ratios.filter(r => r !== 'auto')
    : ['1:1', '16:9', '9:16', '4:5'];

  const [prompt, setPrompt] = useState('');
  const [enhance, setEnhance] = useState(false);
  const [resolution, setResolution] = useState<string>('1K');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slotInputRef = useRef<HTMLInputElement>(null);
  const slotTargetIndex = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sizeRowRef = useRef<HTMLButtonElement>(null);
  const resRowRef = useRef<HTMLButtonElement>(null);

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

  const creditCost = useMemo(() => {
    if (!currentModel) return 0;
    const v = getCreditsForModelQuality(currentModel.id, resolution);
    return v ?? currentModel.credits_per_generation ?? 0;
  }, [currentModel, resolution, getCreditsForModelQuality]);

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
  }, [user, openAuthModal, isAr, setUploaded]);

  const handleSlotPick = (index: number | null) => {
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

  const containerCls = inSheet
    ? 'flex flex-col w-full bg-background'
    : 'w-full md:w-[380px] xl:w-[420px] flex flex-col bg-background flex-shrink-0 overflow-visible relative z-30';

  return (
    <aside ref={panelRef} className={containerCls}>
      <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-3 scrollbar-thin">
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

        {/* Reference images — compact horizontal row */}
        <input
          ref={slotInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleSlotInputChange}
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
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
            {uploaded.map((img, i) => (
              <div
                key={i}
                className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/30 bg-card/50 group"
              >
                <img src={img.preview} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                {!img.url && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => removeSlot(i)}
                  className="absolute top-0.5 end-0.5 w-4 h-4 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                  aria-label={isAr ? 'إزالة' : 'Remove'}
                >
                  <X size={9} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            {uploaded.length < maxImages && (
              <button
                onClick={() => handleSlotPick(null)}
                className="flex-shrink-0 w-16 h-16 rounded-lg border border-dashed border-foreground/25 bg-foreground/[0.02] hover:border-primary/40 hover:bg-primary/[0.04] flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                aria-label={isAr ? 'إضافة صورة' : 'Add image'}
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2 px-1">
            {isAr ? 'JPG / PNG / WEBP حتى 10 ميغابايت' : 'JPG / PNG / WEBP up to 10MB'}
          </p>
        </div>

        {/* Size / Resolution rows */}
        {[
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

// ───────────────────────────────────────────── Right panel — cover / preview ─────────────────────────────────────────────

interface CoverPanelProps {
  coverUrl: string;
  uploaded: UploadedImage[];
  resultUrl: string | null;
  isAr: boolean;
}

function CoverPanel({ coverUrl, uploaded, resultUrl, isAr }: CoverPanelProps) {
  // Priority: result > first uploaded preview > tool cover image
  const displayUrl = resultUrl || uploaded[0]?.preview || coverUrl || FALLBACK_COVER;
  const isCover = !resultUrl && !uploaded[0];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-black/40 relative">
      <img
        src={displayUrl}
        alt={isAr ? 'تعديل الصورة' : 'Edit Image'}
        className="w-full h-full object-cover"
      />
      {isCover && (
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none">
          <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-primary/15 backdrop-blur-md text-primary text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary/20">
            <Wand2 size={10} />
            {isAr ? 'تعديل الصورة' : 'Edit Image'}
          </div>
          <p className="text-white text-xl font-bold drop-shadow-lg">
            {isAr ? 'مدعوم بـ Nano Banana 2' : 'Powered by Nano Banana 2'}
          </p>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────── Page ─────────────────────────────────────────────

export default function EditImagePage() {
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const isMobile = useIsMobile();
  const { tools } = useToolsDB();

  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const tool = tools.find(t => t.slug === 'edit-image');
  const coverUrl = tool?.image || FALLBACK_COVER;

  // Mobile: render the creation panel directly, no cover/preview intro
  if (isMobile) {
    return (
      <div
        className="flex flex-1 min-h-0 overflow-visible"
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <EditControlsPanel
          inSheet
          uploaded={uploaded}
          setUploaded={setUploaded}
          resultUrl={resultUrl}
          setResultUrl={setResultUrl}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 min-h-0 overflow-visible"
      style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-1 min-h-0 relative overflow-visible">
        <EditControlsPanel
          uploaded={uploaded}
          setUploaded={setUploaded}
          resultUrl={resultUrl}
          setResultUrl={setResultUrl}
        />
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6">
          <div className="flex-1 min-h-0">
            <CoverPanel
              coverUrl={coverUrl}
              uploaded={uploaded}
              resultUrl={resultUrl}
              isAr={isAr}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
