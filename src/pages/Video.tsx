import { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X, Film, Clock, ChevronRight, ChevronDown, Image, Check, Diamond, Play, Volume2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import VideoHistoryPanel from '@/components/video/VideoHistoryPanel';
import VideoHowItWorks from '@/components/video/VideoHowItWorks';
import { useVideoModels, type VideoModel } from '@/hooks/useVideoModels';
import { GenerateButton, imageSizeError, isOversizedImage } from '@/lib/ux';
import { localizePath } from '@/lib/localized-routes';
import { useToolsDB } from '@/hooks/useToolsDB';

/* ─── Drop-up Selector ─── */
function SettingSelector({ label, options, value, onSelect, icon, forceUpward = false, creditInfo }: {
  label: string; options: { label: string; credits?: number }[]; value: string; onSelect: (v: string) => void; icon?: React.ReactNode; forceUpward?: boolean; creditInfo?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [open]);

  if (options.length === 0) return null;

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl bg-card/60 dark:bg-card/40 active:scale-[0.97] transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="text-start min-w-0">
            <p className="text-[10px] text-muted-foreground/60 font-medium leading-none mb-0.5">{label}</p>
            <p className="text-[13px] font-bold text-foreground truncate">{value}</p>
          </div>
        </div>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn(
          "absolute left-0 right-0 z-50 rounded-2xl bg-popover/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in duration-150",
          forceUpward
            ? "bottom-full mb-2 slide-in-from-bottom-2"
            : "bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-2 slide-in-from-bottom-2 md:slide-in-from-top-2"
        )}>
          <div id={listboxId} role="listbox" className="p-1.5 space-y-0.5">
            {options.map(opt => (
              <button
                key={opt.label}
                onClick={() => { onSelect(opt.label); setOpen(false); }}
                role="option"
                aria-selected={opt.label === value}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors",
                  opt.label === value
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent/40"
                )}
              >
                <span>{opt.label}{creditInfo ? ` — ${creditInfo(opt.label)}` : ''}</span>
                {opt.label === value && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Desktop Model Side Panel ─── */
function DesktopModelPanel({ videoModels, selectedModelId, onSelect, onClose, isAr }: {
  videoModels: VideoModel[]; selectedModelId: string; onSelect: (id: string) => void; onClose: () => void; isAr: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={panelRef} className={cn("absolute top-0 z-50 w-[min(320px,calc(100vw-2rem))] animate-in fade-in duration-200", isAr ? "right-full mr-3 slide-in-from-right-2" : "left-full ml-3 slide-in-from-left-2")}>
      <div className="rounded-[20px] overflow-hidden bg-popover/95 backdrop-blur-md shadow-[0_8px_40px_-4px_rgba(0,0,0,0.15),0_2px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_-4px_rgba(0,0,0,0.5),0_2px_12px_-2px_rgba(0,0,0,0.3)]" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
        <div className="px-4 pt-3.5 pb-2">
          <p className="text-[10px] uppercase tracking-[1.5px] font-semibold text-muted-foreground/40">{isAr ? 'نماذج الفيديو' : 'Video models'}</p>
        </div>
        <div role="listbox" aria-label={isAr ? 'نماذج الفيديو' : 'Video models'} className="overflow-y-auto px-1.5 pb-2" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
          {videoModels.map(model => {
            const isSelected = model.id === selectedModelId;
            return (
              <button key={model.id} onClick={() => onSelect(model.id)} className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-[14px] transition-all duration-150 text-start group",
                isSelected ? "bg-primary/[0.08] dark:bg-primary/[0.12]" : "hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.06]"
              )} role="option" aria-selected={isSelected}>
                <div className={cn("w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden", isSelected ? "ring-[1.5px] ring-primary/30" : "bg-muted/15 dark:bg-muted/10")}>
                  {model.preview_image_url ? <img src={model.preview_image_url} alt={model.display_name} className="w-full h-full object-cover" /> : <Film size={15} className={isSelected ? "text-primary" : "text-muted-foreground/30"} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[13px] font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>{model.display_name}</span>
                    {model.badge && <span className={cn("text-[8px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0", model.badge === 'NEW' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400')}>{model.badge}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {model.resolutions.map(q => <span key={q} className="text-[9px] px-1.5 py-px rounded-md bg-foreground/[0.04] dark:bg-foreground/[0.06] text-muted-foreground/60 font-medium">{q}</span>)}
                    {model.durations.length > 0 && (
                      <span className="text-[9px] px-1.5 py-px rounded-md bg-foreground/[0.04] dark:bg-foreground/[0.06] text-muted-foreground/60 font-medium">
                        {model.durations[0]}–{model.durations[model.durations.length - 1]}s
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><Check size={11} className="text-primary-foreground" /></div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Component ─── */
export default function Video() {
  const navigate = useNavigate();
  const { toolId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { credits, isAuthenticated, openAuthModal, openUpgradeModal } = useApp();
  const { lang } = useLanguage();
  const { models: videoModels, loading: modelsLoading } = useVideoModels(true);
  const { tools } = useToolsDB();
  const { submitVideoJob } = useGenerationJobs();
  const isAr = lang === 'ar';
  const isMobile = useIsMobile();

  const [selectedModelId, setSelectedModelId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [appliedInitialModelKey, setAppliedInitialModelKey] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ preview: string; url: string | null } | null>(null);
  const [endFrameImage, setEndFrameImage] = useState<{ preview: string; url: string | null } | null>(null);
  const [refImages, setRefImages] = useState<{ preview: string; url: string | null }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const startFrameRef = useRef<HTMLInputElement>(null);
  const endFrameRef = useRef<HTMLInputElement>(null);
  const refImageInputRef = useRef<HTMLInputElement>(null);
  const maxReferenceImages = 10;
  const selectedTool = useMemo(
    () => tools.find(tool => tool.mediaType === 'video' && (tool.slug === toolId || tool.id === toolId)),
    [toolId, tools]
  );
  const toolPrompt = selectedTool
    ? (lang === 'ar' && selectedTool.defaultPromptAr ? selectedTool.defaultPromptAr : selectedTool.defaultPromptEn)
    : '';
  const promptHidden = selectedTool?.promptHidden ?? false;
  const toolRequiresStartImage = selectedTool?.requiresUpload ?? false;
  const generateLabel = selectedTool?.ctaLabel || (isAr ? 'توليد الفيديو' : 'Generate Video');

  useEffect(() => {
    if (videoModels.length > 0) {
      const requested = searchParams.get('modelId') || searchParams.get('model') || selectedTool?.selectedVideoModelId || '';
      const requestedKey = `${toolId || 'default'}:${requested || 'first'}`;
      if (selectedModelId && appliedInitialModelKey === requestedKey) return;
      const matched = requested
        ? videoModels.find(model =>
            model.id === requested ||
            model.name === requested ||
            model.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === requested
          )
        : null;
      if (!selectedModelId || requested) {
        setSelectedModelId((matched || videoModels[0]).id);
        setAppliedInitialModelKey(requestedKey);
      }
    }
  }, [appliedInitialModelKey, selectedModelId, searchParams, selectedTool?.selectedVideoModelId, toolId, videoModels]);

  useEffect(() => {
    if (!selectedTool || !toolPrompt || prompt) return;
    setPrompt(toolPrompt);
  }, [prompt, selectedTool, toolPrompt]);

  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl');
    if (!imageUrl || uploadedImage?.url === imageUrl) return;
    setUploadedImage({ preview: imageUrl, url: imageUrl });
  }, [searchParams, uploadedImage?.url]);

  const currentModel = videoModels.find(m => m.id === selectedModelId) || videoModels[0];

  // Reset selections when model changes
  useEffect(() => {
    if (!currentModel) return;
    if (!currentModel.aspect_ratios.includes(selectedRatio)) setSelectedRatio(currentModel.aspect_ratios[0] || '16:9');
    if (!currentModel.durations.includes(selectedDuration)) setSelectedDuration(currentModel.durations[0] || 5);
    if (!currentModel.resolutions.includes(selectedQuality)) setSelectedQuality(currentModel.resolutions[0] || '720p');
    if (!currentModel.supports_audio) setAudioEnabled(false);
    if (!currentModel.supports_start_frame) setUploadedImage(null);
    if (!currentModel.supports_end_frame) setEndFrameImage(null);
    if (!currentModel.supports_reference_images) setRefImages([]);
  }, [currentModel, selectedDuration, selectedQuality, selectedRatio]);

  // Credit calculation
  const creditCostPerSecond = audioEnabled && currentModel?.supports_audio
    ? (currentModel?.credit_cost_per_second_with_audio ?? 0)
    : (currentModel?.credit_cost_per_second_no_audio ?? 5);
  const totalCredits = selectedDuration * creditCostPerSecond;
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const getCreditLabel = useCallback((dur: number) => {
    const cps = audioEnabled && currentModel?.supports_audio
      ? currentModel.credit_cost_per_second_with_audio
      : currentModel?.credit_cost_per_second_no_audio ?? 5;
    return `${dur * cps} credits`;
  }, [audioEnabled, currentModel]);

  const handleUpload = useCallback(async (file: File, type: 'start' | 'end' | 'ref') => {
    if (isOversizedImage(file)) {
      toast.error(imageSizeError(isAr));
      return;
    }
    if (!user) return;
    if (type === 'ref' && refImages.length >= maxReferenceImages) return;
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    if (type === 'start') setUploadedImage({ preview, url: null });
    else if (type === 'end') setEndFrameImage({ preview, url: null });
    else if (type === 'ref') {
      setRefImages(prev => [...prev, { preview, url: null }].slice(0, maxReferenceImages));
    }
    const path = `${user.id}/video-${type}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('tool-files').upload(path, file);
    if (error) {
      toast.error(isAr ? 'فشل رفع الصورة' : 'Upload failed');
      if (type === 'start') setUploadedImage(null);
      else if (type === 'end') setEndFrameImage(null);
      else if (type === 'ref') setRefImages(prev => prev.filter(img => img.preview !== preview));
    } else {
      const { data: { publicUrl } } = supabase.storage.from('tool-files').getPublicUrl(path);
      if (type === 'start') setUploadedImage({ preview, url: publicUrl });
      else if (type === 'end') setEndFrameImage({ preview, url: publicUrl });
      else if (type === 'ref') setRefImages(prev => prev.map(img => img.preview === preview ? { preview, url: publicUrl } : img));
    }
    setIsUploading(false);
  }, [user, isAr, refImages.length]);

  const effectivePrompt = promptHidden ? toolPrompt : prompt.trim();
  const needsStartImage = toolRequiresStartImage || currentModel?.start_frame_required;
  const canGenerate = effectivePrompt.trim().length > 0 && !isUploading && !isGenerating &&
    !(needsStartImage && !uploadedImage?.url);

  const handleGenerate = async () => {
    if (!effectivePrompt.trim()) { toast.error(isAr ? 'يرجى إدخال وصف' : 'Please enter a prompt'); return; }
    if (!isAuthenticated) { openAuthModal('signup'); return; }
    if (credits < totalCredits) { openUpgradeModal(); return; }
    if (!currentModel) return;
    if (needsStartImage && !uploadedImage?.url) {
      toast.error(selectedTool?.uploadLabel || (isAr ? 'صورة البداية مطلوبة لهذا النموذج' : 'Start frame is required for this model'));
      return;
    }
    setIsGenerating(true);
    try {
      const referenceImageUrls = refImages.map(img => img.url).filter((url): url is string => !!url);
      const jobId = await submitVideoJob({
        prompt: effectivePrompt.trim(),
        ratio: selectedRatio,
        quality: selectedQuality,
        duration: `${selectedDuration}s`,
        modelId: currentModel.id,
        creditCost: totalCredits,
        imageUrl: uploadedImage?.url || undefined,
        endFrameUrl: endFrameImage?.url || undefined,
        referenceImageUrls,
        generateAudio: audioEnabled && currentModel.supports_audio,
      });
      if (jobId) {
        toast.success(isAr ? 'بدأ توليد الفيديو' : 'Video generation started');
      }
    } catch {
      toast.error(isAr ? 'فشل في بدء التوليد' : 'Failed to start generation');
    }
    setIsGenerating(false);
  };

  /* ─── Loading skeleton ─── */
  if (modelsLoading || videoModels.length === 0) {
    return (
      <div className="flex-1 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <div className="max-w-lg mx-auto px-4 pt-3 w-full space-y-4 md:hidden">
          <div className="w-full rounded-2xl bg-muted/30 animate-pulse" style={{ aspectRatio: '2.8/1' }} />
          <div className="grid grid-cols-2 gap-2.5"><div className="rounded-2xl bg-muted/20 animate-pulse" style={{ aspectRatio: '4/3' }} /><div className="rounded-2xl bg-muted/20 animate-pulse" style={{ aspectRatio: '4/3' }} /></div>
          <div className="rounded-2xl bg-muted/20 animate-pulse h-28" /><div className="rounded-2xl bg-muted/20 animate-pulse h-14" />
          <div className="flex gap-2"><div className="flex-1 rounded-2xl bg-muted/20 animate-pulse h-14" /><div className="flex-1 rounded-2xl bg-muted/20 animate-pulse h-14" /><div className="flex-1 rounded-2xl bg-muted/20 animate-pulse h-14" /></div>
        </div>
        <div className="hidden md:flex w-full px-6 pt-6 gap-6">
          <div className="w-[clamp(340px,30vw,400px)] flex-shrink-0 space-y-4"><div className="rounded-2xl bg-muted/20 animate-pulse h-48" /><div className="rounded-2xl bg-muted/20 animate-pulse h-32" /><div className="rounded-2xl bg-muted/20 animate-pulse h-14" /></div>
          <div className="flex-1 rounded-2xl bg-muted/10 animate-pulse h-96" />
        </div>
      </div>
    );
  }

  /* ─── Frame Upload Card ─── */
  const FrameCard = ({ type, image, onRemove, onUpload, required }: {
    type: 'start' | 'end'; image: { preview: string; url: string | null } | null; onRemove: () => void; onUpload: () => void; required?: boolean;
  }) => {
    const label = type === 'start'
      ? (selectedTool?.uploadLabel || (isAr ? 'إطار البداية' : 'Start frame'))
      : (isAr ? 'إطار النهاية' : 'End frame');
    return (
    <button
      onClick={onUpload}
      aria-label={label}
      className={cn(
      "relative flex-1 min-w-[150px] rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all overflow-hidden aspect-[4/3]",
      image ? "p-0" : "border border-dashed border-border/20 dark:border-border/10 bg-card/40 dark:bg-card/20 hover:bg-card/60 dark:hover:bg-card/30 active:scale-[0.97]"
    )}>
      {image ? (
        <>
          <img src={image.preview} alt={label} className="w-full h-full object-cover rounded-2xl" />
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="absolute top-2 right-2 min-h-11 min-w-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform" aria-label={type === 'start' ? (isAr ? 'إزالة إطار البداية' : 'Remove start frame') : (isAr ? 'إزالة إطار النهاية' : 'Remove end frame')}><X size={11} /></button>
          {isUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /></div>}
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded-full bg-muted/20 dark:bg-muted/10 flex items-center justify-center"><Image size={16} className="text-muted-foreground/30" /></div>
          <span className="text-[11px] text-muted-foreground/50 font-medium">{label}</span>
          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", required ? "bg-destructive/15 text-destructive" : "bg-muted/30 text-muted-foreground/40")}>
            {required ? (isAr ? 'مطلوب' : 'Required') : (isAr ? 'اختياري' : 'Optional')}
          </span>
        </>
      )}
    </button>
    );
  };

  /* ─── Reference Image Card ─── */
  const ReferenceImageStrip = () => (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <p className="text-[10px] text-muted-foreground/50 font-medium">{isAr ? 'صور مرجعية' : 'Reference images'}</p>
        <span className="text-[10px] text-muted-foreground/40">{refImages.length}/{maxReferenceImages}</span>
      </div>
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {refImages.map((img, idx) => (
          <div key={`${img.preview}-${idx}`} className="relative h-16 w-16 flex-none overflow-hidden rounded-xl border border-primary/20 bg-card/50">
            <img src={img.preview} alt={isAr ? `صورة مرجعية ${idx + 1}` : `Reference image ${idx + 1}`} className="h-full w-full object-cover" />
            {!img.url && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}
            <button
              onClick={() => setRefImages(prev => prev.filter((_, i) => i !== idx))}
              className="absolute top-1 right-1 min-h-11 min-w-11 rounded-full bg-black/60 flex items-center justify-center text-white"
              aria-label={isAr ? `إزالة الصورة المرجعية ${idx + 1}` : `Remove reference image ${idx + 1}`}
            >
              <X size={9} />
            </button>
          </div>
        ))}
        {refImages.length < maxReferenceImages && (
          <button
            type="button"
            onClick={() => refImageInputRef.current?.click()}
            className="h-16 w-16 flex-none rounded-xl border border-dashed border-border/20 bg-card/40 text-muted-foreground/45 transition-all hover:bg-card/60 hover:text-primary active:scale-[0.97]"
            aria-label={isAr ? 'رفع صورة مرجعية' : 'Upload reference image'}
          >
            <Image size={15} className="mx-auto" />
          </button>
        )}
      </div>
      <input
        ref={refImageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-label={isAr ? 'رفع صور مرجعية' : 'Upload reference images'}
        onChange={e => {
          const files = Array.from(e.target.files || []).slice(0, Math.max(0, maxReferenceImages - refImages.length));
          files.forEach(file => handleUpload(file, 'ref'));
          e.currentTarget.value = '';
        }}
      />
    </div>
  );

  /* ─── Audio Toggle Row ─── */
  const AudioToggle = () => {
    if (!currentModel?.supports_audio) return null;
    const extraCost = (currentModel.credit_cost_per_second_with_audio - currentModel.credit_cost_per_second_no_audio);
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-card/60 dark:bg-card/40">
        <div className="flex items-center gap-2.5">
          <Volume2 size={16} className={cn("transition-colors duration-200", audioEnabled ? "text-primary" : "text-muted-foreground/40")} />
          <span className="text-[13px] font-semibold text-foreground">{isAr ? 'صوت' : 'Audio'}</span>
        </div>
        <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} className="hover:bg-primary/35" />
      </div>
    );
  };

  /* ─── Creation Panel (shared between mobile & desktop) ─── */
  const renderCreationPanel = (isDesktop = false) => (
    <div className={cn("space-y-3", isDesktop && "space-y-3")}>
      {selectedTool && (
        <div className="rounded-2xl bg-card/50 dark:bg-card/30 px-4 py-3 shadow-sm">
          <p className="text-[15px] font-black text-foreground tracking-tight">{selectedTool.name}</p>
          <p className="text-[12px] text-muted-foreground/65 mt-0.5 leading-relaxed">{selectedTool.shortDesc || selectedTool.description}</p>
        </div>
      )}

      {/* Hero Model Card */}
      {isDesktop ? (
        <div className="w-full rounded-2xl overflow-hidden relative shadow-sm">
          <div className="aspect-[2.4/1] relative">
            {currentModel?.preview_image_url ? (
              <img src={currentModel.preview_image_url} alt={currentModel.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2">
              <p className="text-[18px] font-black text-white tracking-tight leading-tight">{currentModel?.display_name}</p>
              {currentModel?.badge && <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", currentModel.badge === 'NEW' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300')}>{currentModel.badge}</span>}
            </div>
            <p className="text-[11px] text-white/60 font-medium mt-0.5">{currentModel?.provider}</p>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowModelPicker(true)} className="w-full rounded-2xl overflow-hidden relative group active:scale-[0.98] transition-transform" aria-label={isAr ? 'اختيار نموذج الفيديو' : 'Choose video model'}>
          <div className="aspect-[2.8/1] relative">
            {currentModel?.preview_image_url ? <img src={currentModel.preview_image_url} alt={currentModel.display_name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/10" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2">
              <p className="text-[18px] font-black text-white tracking-tight leading-tight">{currentModel?.display_name}</p>
              {currentModel?.badge && <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", currentModel.badge === 'NEW' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300')}>{currentModel.badge}</span>}
            </div>
          </div>
        </button>
      )}

      {/* Frame Upload — conditional on model */}
      {(currentModel?.supports_start_frame || toolRequiresStartImage) && (
        <div className={cn("grid gap-2.5", currentModel.supports_end_frame ? "grid-cols-2" : "grid-cols-1")}>
          <FrameCard type="start" image={uploadedImage} onRemove={() => setUploadedImage(null)} onUpload={() => startFrameRef.current?.click()} required={currentModel.start_frame_required} />
          {currentModel.supports_end_frame && <FrameCard type="end" image={endFrameImage} onRemove={() => setEndFrameImage(null)} onUpload={() => endFrameRef.current?.click()} />}
          <input ref={startFrameRef} type="file" accept="image/*" className="hidden" aria-label={isAr ? 'رفع إطار البداية' : 'Upload start frame'} onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'start'); }} />
          {currentModel.supports_end_frame && <input ref={endFrameRef} type="file" accept="image/*" className="hidden" aria-label={isAr ? 'رفع إطار النهاية' : 'Upload end frame'} onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'end'); }} />}
        </div>
      )}

      {/* Reference Images */}
      {currentModel?.supports_reference_images && (
        <ReferenceImageStrip />
      )}

      {/* Prompt */}
      {!promptHidden && (
        <div className="rounded-2xl bg-card/50 dark:bg-card/30 overflow-hidden focus-within:ring-1 focus-within:ring-primary/20 transition-shadow shadow-sm">
          <textarea
            id="video-prompt"
            aria-label={isAr ? 'وصف الفيديو' : 'Video prompt'}
            value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder={isAr ? 'صف الفيديو الذي تريده...' : 'Describe your video...'}
            rows={isDesktop ? 4 : 4}
            className="w-full bg-transparent px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none resize-none leading-relaxed"
          />
        </div>
      )}

      {/* Audio Toggle */}
      <AudioToggle />

      {/* Desktop Model Selector — below prompt */}
      {isDesktop && (
        <button onClick={() => setShowModelPicker(p => !p)} className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card/50 dark:bg-card/30 hover:bg-card/70 dark:hover:bg-card/40 transition-colors group active:scale-[0.98] shadow-sm" aria-expanded={showModelPicker} aria-haspopup="listbox" aria-label={isAr ? 'اختيار نموذج الفيديو' : 'Choose video model'}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-muted/20 dark:bg-muted/10 flex items-center justify-center flex-shrink-0">
              {currentModel?.preview_image_url ? <img src={currentModel.preview_image_url} alt={currentModel.display_name} className="w-full h-full object-cover" /> : <Film size={14} className="text-muted-foreground/30" />}
            </div>
            <div className="text-start">
              <p className="text-[10px] text-muted-foreground/60 font-medium leading-none mb-0.5">{isAr ? 'النموذج' : 'Model'}</p>
              <p className="text-[14px] font-bold text-foreground">{currentModel?.display_name}</p>
            </div>
          </div>
          <ChevronRight size={14} className={cn("text-muted-foreground/40 transition-transform", isAr ? "rotate-180" : "")} />
        </button>
      )}

      {/* Settings Row */}
      <div className="flex items-stretch gap-2">
        <SettingSelector
          label={isAr ? 'المدة' : 'Duration'}
          options={currentModel?.durations.map(d => ({ label: `${d}s` })) || []}
          value={`${selectedDuration}s`}
          onSelect={v => setSelectedDuration(parseInt(v))}
          icon={<Clock size={13} className="text-muted-foreground/40 flex-shrink-0" />}
          forceUpward={isDesktop}
        />
        <SettingSelector
          label={isAr ? 'النسبة' : 'Ratio'}
          options={currentModel?.aspect_ratios.map(r => ({ label: r })) || []}
          value={selectedRatio}
          onSelect={setSelectedRatio}
          forceUpward={isDesktop}
        />
        <SettingSelector
          label={isAr ? 'الجودة' : 'Quality'}
          options={currentModel?.resolutions.map(r => ({ label: r })) || []}
          value={selectedQuality}
          onSelect={setSelectedQuality}
          icon={<Diamond size={12} className="text-muted-foreground/40 flex-shrink-0" />}
          forceUpward={isDesktop}
        />
      </div>

      {/* Mobile model selector */}
      {!isDesktop && (
        <button onClick={() => setShowModelPicker(true)} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card/50 transition-colors group active:scale-[0.98]" aria-haspopup="listbox" aria-label={isAr ? 'اختيار نموذج الفيديو' : 'Choose video model'}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-muted/20 flex items-center justify-center flex-shrink-0">
              {currentModel?.preview_image_url ? <img src={currentModel.preview_image_url} alt={currentModel.display_name} className="w-full h-full object-cover" /> : <Film size={14} className="text-muted-foreground/30" />}
            </div>
            <div className="text-start">
              <p className="text-[10px] text-muted-foreground/60 font-medium leading-none mb-0.5">{isAr ? 'النموذج' : 'Model'}</p>
              <p className="text-[13px] font-bold text-foreground">{currentModel?.display_name}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-muted-foreground/40" />
        </button>
      )}

      {/* Generate Button (desktop) */}
      {isDesktop && (
        <GenerateButton onClick={handleGenerate} disabled={!canGenerate} loading={isGenerating} credits={totalCredits}>
          {generateLabel}
        </GenerateButton>
      )}
    </div>
  );

  /* ─── MOBILE LAYOUT ─── */
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col min-h-0" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
            <button
              type="button"
              onClick={() => navigate(localizePath(selectedTool ? '/video' : '/create', lang))}
              className={cn(
                'group inline-flex items-center gap-2 h-9 ps-2 pe-3.5 -ms-2 mb-1 rounded-full',
                'text-[13px] font-medium text-muted-foreground',
                'hover:text-foreground hover:bg-muted/40 active:scale-[0.97] active:bg-muted/60',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'transition-all duration-200 cursor-pointer'
              )}
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted/30 group-hover:bg-muted/60 transition-colors">
                <BackArrow size={13} />
              </span>
              <span>{selectedTool ? (isAr ? 'العودة إلى أدوات الفيديو' : 'Back to Video tools') : (isAr ? 'العودة إلى الإنشاء' : 'Back to Create')}</span>
            </button>
            {renderCreationPanel()}
          </div>
        </div>
        <div className="fixed left-0 right-0 z-40 px-4 py-3 bg-background/95 backdrop-blur-md" style={{ bottom: 'calc(58px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-lg mx-auto">
            <GenerateButton onClick={handleGenerate} disabled={!canGenerate} loading={isGenerating} credits={totalCredits}>
              {generateLabel}
            </GenerateButton>
          </div>
        </div>
        {showModelPicker && <ModelPickerSheet videoModels={videoModels} selectedModelId={selectedModelId} onSelect={id => { setSelectedModelId(id); setShowModelPicker(false); }} onClose={() => setShowModelPicker(false)} isAr={isAr} />}
      </div>
    );
  }

  /* ─── DESKTOP LAYOUT ─── */
  return (
    <div className="flex-1 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="generate" className="w-full">
          <div className="sticky top-0 z-40 bg-background/90 px-5 py-3 backdrop-blur">
            <div className="flex justify-center">
              <TabsList className="bg-card/50 dark:bg-card/30 rounded-2xl p-1 w-auto inline-flex">
                <TabsTrigger value="generate" className="rounded-xl px-5 py-2 text-[13px] font-semibold data-[state=active]:bg-background dark:data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all">
                  <Play size={14} className={cn(isAr ? "ml-2" : "mr-2")} />{isAr ? 'توليد' : 'Generate'}
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl px-5 py-2 text-[13px] font-semibold data-[state=active]:bg-background dark:data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all">
                  <Film size={14} className={cn(isAr ? "ml-2" : "mr-2")} />{isAr ? 'السجل' : 'History'}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="generate" className="m-0">
            <div className="flex w-full" dir="ltr">
              <div className={cn("w-[clamp(340px,30vw,400px)] flex-shrink-0 relative", isAr ? "order-2" : "order-1")} dir={isAr ? 'rtl' : 'ltr'}>
                <div className="sticky px-5 py-5 overflow-y-auto" style={{ top: 'calc(6.25rem + var(--banner-h, 0px))', height: 'calc(100vh - 6.25rem - var(--banner-h, 0px))' }}>
                  {renderCreationPanel(true)}
                </div>
                {showModelPicker && (
                  <div className="fixed z-50" style={{ top: 'calc(6.25rem + var(--banner-h, 0px) + 1.25rem)', ...(isAr ? { right: 'clamp(360px, calc(30vw + 1.25rem), 420px)' } : { left: 'clamp(360px, calc(30vw + 1.25rem), 420px)' }) }}>
                    <DesktopModelPanel videoModels={videoModels} selectedModelId={selectedModelId} onSelect={id => { setSelectedModelId(id); setShowModelPicker(false); }} onClose={() => setShowModelPicker(false)} isAr={isAr} />
                  </div>
                )}
              </div>
              <div className={cn("flex-1 min-w-0 px-8 py-6", isAr ? "order-1" : "order-2")} dir={isAr ? 'rtl' : 'ltr'}>
                <VideoHowItWorks />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="m-0 px-8 py-6">
            <VideoHistoryPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─── Model Picker Bottom Sheet (mobile only) ─── */
function ModelPickerSheet({ videoModels, selectedModelId, onSelect, onClose, isAr }: {
  videoModels: VideoModel[]; selectedModelId: string; onSelect: (id: string) => void; onClose: () => void; isAr: boolean;
}) {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-150" />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-popover flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-200" style={{ maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto" /></div>
        <div className="flex-shrink-0 px-5 pb-3 pt-1"><h3 className="text-[15px] font-bold text-foreground">{isAr ? 'اختر النموذج' : 'Choose Model'}</h3></div>
        <div role="listbox" aria-label={isAr ? 'نماذج الفيديو' : 'Video models'} className="flex-1 overflow-y-auto overscroll-contain px-3 space-y-0.5 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {videoModels.map(model => {
            const isSelected = model.id === selectedModelId;
            return (
              <button key={model.id} onClick={() => onSelect(model.id)} className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-start active:scale-[0.98]",
                isSelected ? "bg-primary/10" : "hover:bg-accent/40"
              )} role="option" aria-selected={isSelected}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden", isSelected ? "ring-2 ring-primary/30" : "bg-muted/30 dark:bg-muted/10")}>
                  {model.preview_image_url ? <img src={model.preview_image_url} alt={model.display_name} className="w-full h-full object-cover" /> : <Film size={16} className={isSelected ? "text-primary" : "text-muted-foreground/40"} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-foreground truncate">{model.display_name}</span>
                    {model.badge && <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0", model.badge === 'NEW' ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-500 dark:text-amber-400')}>{model.badge}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {model.resolutions.map(r => <span key={r} className="text-[9px] px-1.5 py-px rounded-md bg-foreground/[0.04] text-muted-foreground/60 font-medium">{r}</span>)}
                    <span className="text-[9px] px-1.5 py-px rounded-md bg-foreground/[0.04] text-muted-foreground/60 font-medium">{model.durations[0]}–{model.durations[model.durations.length - 1]}s</span>
                    {model.supports_audio && <span className="text-[9px] px-1.5 py-px rounded-md bg-primary/10 text-primary font-medium">🔊</span>}
                  </div>
                </div>
                {isSelected && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><Check size={13} className="text-primary-foreground" /></div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
