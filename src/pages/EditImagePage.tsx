import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Maximize, Image as ImageIcon, Wand2, ChevronRight, Plus } from 'lucide-react';
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

import { BackToImageTools } from '@/components/tools/BackToImageTools';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';
import { toDateOnly } from '@/lib/seo-helpers';
import { GenerateButton, imageSizeError, isOversizedImage } from '@/lib/ux';

const MAX_SLOTS = 14;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const FALLBACK_COVER = '/placeholder.svg';

type OpenDropdown = 'size' | 'resolution' | null;

interface UploadedImage {
  preview: string;
  url: string | null;
}

interface ControlsPanelProps {
  tool?: ReturnType<typeof useToolsDB>['tools'][number];
  inSheet?: boolean;
  onAfterGenerate?: () => void;
  uploaded: UploadedImage[];
  setUploaded: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  resultUrl: string | null;
  setResultUrl: (u: string | null) => void;
}

function EditControlsPanel({ tool, inSheet = false, onAfterGenerate, uploaded, setUploaded, setResultUrl }: ControlsPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, isAuthenticated, openUpgradeModal, requireAuth } = useApp();
  const { submitJob } = useGenerationJobs();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const { activeModels } = useModels();
  const { allTiers, getCreditsForModelQuality } = usePricingTiers();
  const fallbackTitle = isAr ? 'تعديل الصورة' : 'Edit Image';
  const fallbackSubtitle = isAr ? 'حوّل صورك بدقة باستخدام Nano Banana 2' : 'Transform your images with Nano Banana 2';
  const fallbackPromptPlaceholder = isAr ? 'صِف التغييرات التي تريدها...' : 'Describe what you want to change...';
  const fallbackUploadHelper = isAr ? 'JPG / PNG / WEBP حتى 10 ميغابايت' : 'JPG / PNG / WEBP up to 10MB';
  const fallbackCtaLabel = isAr ? 'تعديل الصورة' : 'Edit Image';
  const pageTitle = tool?.name || fallbackTitle;
  const pageSubtitle = tool?.heroSubtitle || tool?.shortDesc || tool?.description || fallbackSubtitle;
  const uploadLabel = tool?.uploadLabel || fallbackTitle;
  const uploadHelper = tool?.uploadHelper || fallbackUploadHelper;
  const ctaLabel = tool?.ctaLabel || fallbackCtaLabel;

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

  const availableRatios = useMemo(
    () => currentModel?.supported_ratios?.length
      ? currentModel.supported_ratios.filter(r => r !== 'auto')
      : ['1:1', '16:9', '9:16', '4:5'],
    [currentModel]
  );

  const [prompt, setPrompt] = useState('');
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
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(isAr ? 'نوع الملف غير مدعوم' : 'Unsupported file type');
      return;
    }
    if (isOversizedImage(file)) {
      toast.error(imageSizeError(isAr));
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

    if (!user) {
      setUploaded(prev => prev.map(img => img.preview === preview ? { ...img, url: preview } : img));
      return;
    }

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
  }, [user, isAr, setUploaded]);

  const handleSlotPick = (index: number | null) => {
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
        <BackToImageTools className="mb-2" />

        {/* Title */}
        <div className="px-1 pb-1">
          <h1 className="typo-heading-card text-[20px] font-bold leading-tight">
            {pageTitle}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {pageSubtitle}
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
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, 500))}
            placeholder={fallbackPromptPlaceholder}
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
            {uploadHelper}
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
        <GenerateButton
          onClick={handleGenerate}
          disabled={!canGenerate}
          loading={submitting}
          loadingLabel={isAr ? 'جارٍ التعديل...' : 'Editing...'}
          credits={creditCost}
        >
          {ctaLabel}
        </GenerateButton>
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
  tool?: ReturnType<typeof useToolsDB>['tools'][number];
  coverUrl: string;
  uploaded: UploadedImage[];
  resultUrl: string | null;
  isAr: boolean;
}

function CoverPanel({ tool, coverUrl, uploaded, resultUrl, isAr }: CoverPanelProps) {
  // Keep references in the upload strip; the preview side shows the tool cover until a result exists.
  const displayUrl = resultUrl || coverUrl || FALLBACK_COVER;
  const isCover = !resultUrl;
  const fallbackTitle = isAr ? 'تعديل الصورة' : 'Edit Image';
  const fallbackSubtitle = isAr ? 'مدعوم بـ Nano Banana 2' : 'Powered by Nano Banana 2';
  const overlayTitle = tool?.heroTitle || tool?.name || fallbackTitle;
  const overlaySubtitle = tool?.heroSubtitle || tool?.shortDesc || fallbackSubtitle;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-black/40 relative">
      <img
        src={displayUrl}
        alt={tool?.name || fallbackTitle}
        className="w-full h-full object-cover"
      />
      {isCover && (
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none">
          <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-primary/15 backdrop-blur-md text-primary text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary/20">
            <Wand2 size={10} />
            {tool?.name || fallbackTitle}
          </div>
          <p className="text-white text-xl font-bold drop-shadow-lg">
            {overlayTitle}
          </p>
          <p className="text-white/80 text-sm mt-1 drop-shadow-md">
            {overlaySubtitle}
          </p>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────── Page ─────────────────────────────────────────────

export default function EditImagePage() {
  const { lang, isRTL } = useLanguage();
  const [searchParams] = useSearchParams();
  const isAr = lang === 'ar';
  const isMobile = useIsMobile();
  const { tools } = useToolsDB();

  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl');
    if (!imageUrl || uploaded.some(img => img.url === imageUrl)) return;
    setUploaded([{ preview: imageUrl, url: imageUrl }]);
  }, [searchParams, uploaded]);
  

  const tool = tools.find(t => t.slug === 'edit-image');
  const coverUrl = tool?.image || FALLBACK_COVER;
  const seoDescription = tool?.description || tool?.shortDesc || (isAr ? 'أداة تعديل صور بالذكاء الاصطناعي داخل تخيّل.' : 'AI image editing tool inside Takhayal.');
  const dateModified = toDateOnly(tool?.updatedAt);
  const faqSchema = tool ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: isAr ? `ما الذي تفعله أداة ${tool.name}؟` : `What does the ${tool.name} tool do?`,
        acceptedAnswer: { '@type': 'Answer', text: seoDescription },
      },
      {
        '@type': 'Question',
        name: isAr ? 'هل يمكنني رفع أكثر من صورة؟' : 'Can I upload more than one image?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isAr ? 'نعم. الأداة تدعم عدة صور مرجعية حسب قدرات النموذج.' : 'Yes. The tool supports multiple reference images depending on the model capability.',
        },
      },
    ],
  } : null;
  const breadcrumbSchema = tool ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الأدوات' : 'Tools', item: absoluteUrl('/tools') },
      { '@type': 'ListItem', position: 2, name: tool.name, item: absoluteUrl(`/tools/${tool.slug}`) },
    ],
  } : null;

  // Mobile: render the creation panel directly, no cover/preview intro
  if (isMobile) {
    return (
      <div
        className="flex flex-1 min-h-0 overflow-visible"
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {tool && (
          <PageSeo
            title={`${tool.name} | Takhayal.ai`}
            description={seoDescription}
            canonicalPath={`/tools/${tool.slug}`}
            image={tool.image}
            pageType="WebPage"
            dateModified={dateModified}
            schemas={[breadcrumbSchema, faqSchema].filter(Boolean) as Record<string, unknown>[]}
          />
        )}
        <EditControlsPanel
          tool={tool}
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
      {tool && (
        <PageSeo
          title={`${tool.name} | Takhayal.ai`}
          description={seoDescription}
          canonicalPath={`/tools/${tool.slug}`}
          image={tool.image}
          pageType="WebPage"
          dateModified={dateModified}
          schemas={[breadcrumbSchema, faqSchema].filter(Boolean) as Record<string, unknown>[]}
        />
      )}
      <div className="flex flex-1 min-h-0 relative overflow-visible">
        <EditControlsPanel
          tool={tool}
          uploaded={uploaded}
          setUploaded={setUploaded}
          resultUrl={resultUrl}
          setResultUrl={setResultUrl}
        />
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6">
          <div className="flex-1 min-h-0">
            <CoverPanel
              tool={tool}
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
