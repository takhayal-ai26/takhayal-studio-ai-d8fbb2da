import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Film, Clock, ChevronRight, ChevronDown, Image, Check, Diamond, Pencil, Play } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { useAuth } from '@/context/AuthContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VideoHistoryPanel from '@/components/video/VideoHistoryPanel';
import VideoHowItWorks from '@/components/video/VideoHowItWorks';

/* ─── Types ─── */
interface VideoModel {
  id: string;
  model_name: string;
  endpoint_id: string;
  supported_ratios: string[];
  supported_durations: string[];
  supported_qualities: string[];
  text_to_video_endpoint: string | null;
  image_to_video_endpoint: string | null;
  supports_image_to_video: boolean;
  is_default: boolean;
  speed: string | null;
  best_for: string | null;
  best_for_ar: string | null;
  cost_per_run: number | null;
  preview_image_url: string;
}

interface VideoTier {
  id: string;
  model_id: string;
  quality_level: string;
  duration: string;
  credits_charged: number;
  cost_per_run: number;
  is_available: boolean;
  is_default: boolean;
  tier_label: string;
}

/* ─── Drop-up Selector ─── */
function SettingSelector({ label, options, value, onSelect, icon, forceUpward = false }: {
  label: string; options: string[]; value: string; onSelect: (v: string) => void; icon?: React.ReactNode; forceUpward?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
          "absolute left-0 right-0 z-50 rounded-2xl bg-popover/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in duration-150",
          forceUpward
            ? "bottom-full mb-2 slide-in-from-bottom-2"
            : "bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-2 slide-in-from-bottom-2 md:slide-in-from-top-2"
        )}>
          <div className="p-1.5 space-y-0.5">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors",
                  opt === value
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent/40"
                )}
              >
                {opt}
                {opt === value && <Check size={14} className="text-primary" />}
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
  videoModels: VideoModel[];
  selectedModelId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  isAr: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute top-0 z-50 w-[320px] animate-in fade-in duration-200",
        isAr
          ? "right-full mr-3 slide-in-from-right-2"
          : "left-full ml-3 slide-in-from-left-2"
      )}
    >
      <div
        className="rounded-[20px] overflow-hidden bg-popover/90 backdrop-blur-2xl shadow-[0_8px_40px_-4px_rgba(0,0,0,0.15),0_2px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_-4px_rgba(0,0,0,0.5),0_2px_12px_-2px_rgba(0,0,0,0.3)]"
        style={{ maxHeight: 'calc(100vh - 8rem)' }}
      >
        {/* Header label */}
        <div className="px-4 pt-3.5 pb-2">
          <p className="text-[10px] uppercase tracking-[1.5px] font-semibold text-muted-foreground/40">
            {isAr ? 'نماذج الفيديو' : 'Video models'}
          </p>
        </div>

        {/* Model list */}
        <div className="overflow-y-auto px-1.5 pb-2" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
          {videoModels.map(model => {
            const isSelected = model.id === selectedModelId;
            const bestFor = isAr ? model.best_for_ar : model.best_for;

            return (
              <button
                key={model.id}
                onClick={() => onSelect(model.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-[14px] transition-all duration-150 text-start group",
                  isSelected
                    ? "bg-primary/[0.08] dark:bg-primary/[0.12]"
                    : "hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.06]"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden",
                  isSelected ? "ring-[1.5px] ring-primary/30" : "bg-muted/15 dark:bg-muted/10"
                )}>
                  {model.preview_image_url ? (
                    <img src={model.preview_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Film size={15} className={isSelected ? "text-primary" : "text-muted-foreground/30"} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[13px] font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                      {model.model_name}
                    </span>
                    {model.supports_image_to_video && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">I2V</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {model.supported_qualities.map(q => (
                      <span key={q} className="text-[9px] px-1.5 py-px rounded-md bg-foreground/[0.04] dark:bg-foreground/[0.06] text-muted-foreground/60 font-medium">{q}</span>
                    ))}
                    {model.supported_durations.length > 0 && (
                      <span className="text-[9px] px-1.5 py-px rounded-md bg-foreground/[0.04] dark:bg-foreground/[0.06] text-muted-foreground/60 font-medium">
                        {model.supported_durations[0]}–{model.supported_durations[model.supported_durations.length - 1]}
                      </span>
                    )}
                  </div>
                  {bestFor && (
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5 truncate">{bestFor}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-primary-foreground" />
                  </div>
                )}
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
  const { user } = useAuth();
  const { credits, isAuthenticated, openAuthModal, openUpgradeModal } = useApp();
  const { lang } = useLanguage();
  const { models } = useModels();
  const { submitVideoJob } = useGenerationJobs();
  const isAr = lang === 'ar';
  const isMobile = useIsMobile();

  const videoModels = useMemo(() =>
    models.filter((m: any) => m.media_type === 'video' && m.is_active).map((m: any): VideoModel => ({
      id: m.id, model_name: m.model_name, endpoint_id: m.endpoint_id,
      supported_ratios: Array.isArray(m.supported_ratios) ? m.supported_ratios : [],
      supported_durations: Array.isArray(m.supported_durations) ? m.supported_durations : [],
      supported_qualities: Array.isArray(m.supported_qualities) ? m.supported_qualities : [],
      text_to_video_endpoint: m.text_to_video_endpoint || null,
      image_to_video_endpoint: m.image_to_video_endpoint || null,
      supports_image_to_video: m.supports_image_to_video || false,
      is_default: m.is_default, speed: m.speed, best_for: m.best_for,
      best_for_ar: m.best_for_ar, cost_per_run: m.cost_per_run ? Number(m.cost_per_run) : null,
      preview_image_url: m.preview_image_url || '',
    }))
  , [models]);

  const [selectedModelId, setSelectedModelId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedDuration, setSelectedDuration] = useState('5s');
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [uploadedImage, setUploadedImage] = useState<{ preview: string; url: string | null } | null>(null);
  const [endFrameImage, setEndFrameImage] = useState<{ preview: string; url: string | null } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tiers, setTiers] = useState<VideoTier[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const startFrameRef = useRef<HTMLInputElement>(null);
  const endFrameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoModels.length > 0 && !selectedModelId) {
      const def = videoModels.find(m => m.is_default) || videoModels[0];
      setSelectedModelId(def.id);
    }
  }, [videoModels, selectedModelId]);

  const currentModel = videoModels.find(m => m.id === selectedModelId) || videoModels[0];

  useEffect(() => {
    if (!currentModel) return;
    supabase.from('model_pricing_tiers').select('*')
      .eq('model_id', currentModel.id).eq('is_available', true).eq('is_active', true)
      .then(({ data }) => {
        if (data) setTiers(data.map((d: any) => ({
          id: d.id, model_id: d.model_id, quality_level: d.quality_level || '',
          duration: d.duration || '', credits_charged: d.credits_charged,
          cost_per_run: Number(d.cost_per_run), is_available: d.is_available,
          is_default: d.is_default, tier_label: d.tier_label,
        })));
      });
  }, [currentModel?.id]);

  useEffect(() => {
    if (!currentModel) return;
    if (!currentModel.supported_ratios.includes(selectedRatio))
      setSelectedRatio(currentModel.supported_ratios[0] || '16:9');
    if (!currentModel.supported_durations.includes(selectedDuration))
      setSelectedDuration(currentModel.supported_durations[0] || '5s');
    if (!currentModel.supported_qualities.includes(selectedQuality))
      setSelectedQuality(currentModel.supported_qualities[0] || '720p');
    if (!currentModel.supports_image_to_video) setUploadedImage(null);
  }, [currentModel]);

  const matchedTier = useMemo(() =>
    tiers.find(t => t.quality_level === selectedQuality && t.duration === selectedDuration) ||
    tiers.find(t => t.is_default) || tiers[0]
  , [tiers, selectedQuality, selectedDuration]);

  const creditCost = matchedTier?.credits_charged ?? 10;

  const handleUpload = useCallback(async (file: File, type: 'start' | 'end' = 'start') => {
    if (!user) return;
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    const setter = type === 'start' ? setUploadedImage : setEndFrameImage;
    setter({ preview, url: null });
    const path = `${user.id}/video-${type}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('tool-files').upload(path, file);
    if (error) {
      toast.error(isAr ? 'فشل رفع الصورة' : 'Upload failed');
      setter(null);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('tool-files').getPublicUrl(path);
      setter({ preview, url: publicUrl });
    }
    setIsUploading(false);
  }, [user, isAr]);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error(isAr ? 'يرجى إدخال وصف' : 'Please enter a prompt'); return; }
    if (!isAuthenticated) { openAuthModal('signup'); return; }
    if (credits < creditCost) { openUpgradeModal(); return; }
    if (!currentModel) return;
    setIsGenerating(true);
    try {
      const jobId = await submitVideoJob({
        prompt: prompt.trim(), ratio: selectedRatio, quality: selectedQuality,
        duration: selectedDuration, modelId: currentModel.id, creditCost,
        imageUrl: uploadedImage?.url || undefined,
      });
      if (jobId) navigate(`/gallery?highlight=${jobId}`);
    } catch {
      toast.error(isAr ? 'فشل في بدء التوليد' : 'Failed to start generation');
    }
    setIsGenerating(false);
  };

  /* ─── Loading skeleton ─── */
  if (videoModels.length === 0) {
    return (
      <div className="flex-1 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <div className="max-w-lg mx-auto px-4 pt-3 w-full space-y-4 md:hidden">
          <div className="w-full rounded-2xl bg-muted/30 animate-pulse" style={{ aspectRatio: '2.8/1' }} />
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-muted/20 animate-pulse" style={{ aspectRatio: '4/3' }} />
            <div className="rounded-2xl bg-muted/20 animate-pulse" style={{ aspectRatio: '4/3' }} />
          </div>
          <div className="rounded-2xl bg-muted/20 animate-pulse h-28" />
          <div className="rounded-2xl bg-muted/20 animate-pulse h-14" />
          <div className="flex gap-2">
            <div className="flex-1 rounded-2xl bg-muted/20 animate-pulse h-14" />
            <div className="flex-1 rounded-2xl bg-muted/20 animate-pulse h-14" />
            <div className="flex-1 rounded-2xl bg-muted/20 animate-pulse h-14" />
          </div>
        </div>
        <div className="hidden md:flex w-full px-6 pt-6 gap-6">
          <div className="w-[400px] flex-shrink-0 space-y-4">
            <div className="rounded-2xl bg-muted/20 animate-pulse h-48" />
            <div className="rounded-2xl bg-muted/20 animate-pulse h-32" />
            <div className="rounded-2xl bg-muted/20 animate-pulse h-14" />
          </div>
          <div className="flex-1 rounded-2xl bg-muted/10 animate-pulse h-96" />
        </div>
      </div>
    );
  }

  /* ─── Frame Upload Card ─── */
  const FrameCard = ({ type, image, onRemove, onUpload }: {
    type: 'start' | 'end';
    image: { preview: string; url: string | null } | null;
    onRemove: () => void;
    onUpload: () => void;
  }) => (
    <button
      onClick={onUpload}
      className={cn(
        "relative rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all overflow-hidden aspect-[4/3]",
        image
          ? "p-0"
          : "border border-dashed border-border/20 dark:border-border/10 bg-card/40 dark:bg-card/20 hover:bg-card/60 dark:hover:bg-card/30 active:scale-[0.97]"
      )}
    >
      {image ? (
        <>
          <img src={image.preview} alt="" className="w-full h-full object-cover rounded-2xl" />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <X size={11} />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded-full bg-muted/20 dark:bg-muted/10 flex items-center justify-center">
            <Image size={16} className="text-muted-foreground/30" />
          </div>
          <span className="text-[11px] text-muted-foreground/50 font-medium">
            {type === 'start' ? (isAr ? 'إطار البداية' : 'Start frame') : (isAr ? 'إطار النهاية' : 'End frame')}
          </span>
          <span className="text-[9px] text-muted-foreground/25 font-medium">
            {isAr ? 'اختياري' : 'Optional'}
          </span>
        </>
      )}
    </button>
  );

  /* ─── Creation Panel (shared between mobile & desktop) ─── */
  const CreationPanel = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className={cn("space-y-3", isDesktop && "space-y-3")}>
      {/* Hero Model Card — display only */}
      {isDesktop ? (
        <div className="w-full rounded-2xl overflow-hidden relative shadow-sm">
          <div className="aspect-[2.4/1] relative">
            {currentModel?.preview_image_url ? (
              <img src={currentModel.preview_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-[18px] font-black text-white tracking-tight leading-tight">{currentModel?.model_name}</p>
            {currentModel?.supports_image_to_video && (
              <p className="text-[11px] text-white/60 font-medium mt-0.5">
                {isAr ? 'صورة إلى فيديو' : 'Image to Video'}
              </p>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowModelPicker(true)}
          className="w-full rounded-2xl overflow-hidden relative group active:scale-[0.98] transition-transform"
        >
          <div className="aspect-[2.8/1] relative">
            {currentModel?.preview_image_url ? (
              <img src={currentModel.preview_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
            <div>
              <p className="text-[18px] font-black text-white tracking-tight leading-tight">{currentModel?.model_name}</p>
              {currentModel?.supports_image_to_video && (
                <p className="text-[11px] text-white/60 font-medium mt-0.5">
                  {isAr ? 'صورة إلى فيديو' : 'Image to Video'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-semibold bg-white/10 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
              <Pencil size={10} />
              {isAr ? 'تغيير' : 'Change'}
            </div>
          </div>
        </button>
      )}

      {/* Frame Upload */}
      {currentModel?.supports_image_to_video && (
        <div className="grid grid-cols-2 gap-2.5">
          <FrameCard
            type="start"
            image={uploadedImage}
            onRemove={() => setUploadedImage(null)}
            onUpload={() => startFrameRef.current?.click()}
          />
          <FrameCard
            type="end"
            image={endFrameImage}
            onRemove={() => setEndFrameImage(null)}
            onUpload={() => endFrameRef.current?.click()}
          />
          <input ref={startFrameRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'start'); }} />
          <input ref={endFrameRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'end'); }} />
        </div>
      )}

      {/* Prompt */}
      <div className="rounded-2xl bg-card/50 dark:bg-card/30 overflow-hidden focus-within:ring-1 focus-within:ring-primary/20 transition-shadow shadow-sm">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={isAr ? 'صف الفيديو الذي تريده... مثلاً: مشهد سينمائي صحراوي مع حركة كاميرا بطيئة' : 'Describe your video... e.g. A cinematic desert scene with slow camera movement'}
          rows={isDesktop ? 4 : 4}
          className="w-full bg-transparent px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Desktop Model Selector — below prompt */}
      {isDesktop && (
        <button
          onClick={() => setShowModelPicker(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card/50 dark:bg-card/30 hover:bg-card/70 dark:hover:bg-card/40 transition-colors group active:scale-[0.98] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-muted/20 dark:bg-muted/10 flex items-center justify-center flex-shrink-0">
              {currentModel?.preview_image_url ? (
                <img src={currentModel.preview_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Film size={14} className="text-muted-foreground/30" />
              )}
            </div>
            <div className="text-start">
              <p className="text-[10px] text-muted-foreground/60 font-medium leading-none mb-0.5">{isAr ? 'النموذج' : 'Model'}</p>
              <p className="text-[14px] font-bold text-foreground">{currentModel?.model_name}</p>
            </div>
          </div>
          <ChevronRight size={14} className={cn(
            "text-muted-foreground/40 transition-transform",
            isAr ? "rotate-180" : ""
          )} />
        </button>
      )}

      {/* Settings Row — dropdowns open UPWARD on desktop */}
      <div className="flex items-stretch gap-2">
        <SettingSelector
          label={isAr ? 'المدة' : 'Duration'}
          options={currentModel?.supported_durations || []}
          value={selectedDuration}
          onSelect={setSelectedDuration}
          icon={<Clock size={13} className="text-muted-foreground/40 flex-shrink-0" />}
          forceUpward={isDesktop}
        />
        <SettingSelector
          label={isAr ? 'النسبة' : 'Ratio'}
          options={currentModel?.supported_ratios || []}
          value={selectedRatio}
          onSelect={setSelectedRatio}
          forceUpward={isDesktop}
        />
        <SettingSelector
          label={isAr ? 'الجودة' : 'Quality'}
          options={currentModel?.supported_qualities || []}
          value={selectedQuality}
          onSelect={setSelectedQuality}
          icon={<Diamond size={12} className="text-muted-foreground/40 flex-shrink-0" />}
          forceUpward={isDesktop}
        />
      </div>

      {/* Mobile model selector */}
      {!isDesktop && (
        <button
          onClick={() => setShowModelPicker(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card/50 transition-colors group active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-muted/20 flex items-center justify-center flex-shrink-0">
              {currentModel?.preview_image_url ? (
                <img src={currentModel.preview_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Film size={14} className="text-muted-foreground/30" />
              )}
            </div>
            <div className="text-start">
              <p className="text-[10px] text-muted-foreground/60 font-medium leading-none mb-0.5">{isAr ? 'النموذج' : 'Model'}</p>
              <p className="text-[13px] font-bold text-foreground">{currentModel?.model_name}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-muted-foreground/40" />
        </button>
      )}

      {/* Generate Button (desktop) */}
      {isDesktop && (
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || isUploading}
          className={cn(
            "w-full h-[52px] rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]",
            (!prompt.trim() || isUploading)
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(var(--primary-rgb,240,62,27),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary-rgb,240,62,27),0.4)] hover:brightness-110"
          )}
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              {isAr ? 'توليد الفيديو' : 'Generate Video'}
              <span className="text-[13px] font-semibold opacity-90">✨ {creditCost}</span>
            </>
          )}
        </button>
      )}
    </div>
  );

  /* ─── MOBILE LAYOUT ─── */
  if (isMobile) {
    return (
      <div
        className="flex-1 flex flex-col min-h-0"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
      >
        {/* Scrollable content area — bottom padding accounts for sticky CTA + bottom nav + safe area */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(4.5rem + 4rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
            <CreationPanel />
          </div>
        </div>

        {/* Sticky Generate Bar — sits above the bottom nav (bottom-nav is ~4rem tall) */}
        <div
          className="fixed left-0 right-0 z-40 px-4 py-3 bg-background/95 backdrop-blur-md"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || isUploading}
              className={cn(
                "w-full h-[52px] rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]",
                (!prompt.trim() || isUploading)
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(var(--primary-rgb,240,62,27),0.3)]"
              )}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {isAr ? 'توليد' : 'Generate'}
                  <span className="text-[13px] font-semibold opacity-90">✨ {creditCost}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Model Picker (mobile) */}
        {showModelPicker && <ModelPickerSheet videoModels={videoModels} selectedModelId={selectedModelId} onSelect={id => { setSelectedModelId(id); setShowModelPicker(false); }} onClose={() => setShowModelPicker(false)} isAr={isAr} />}
      </div>
    );
  }

  /* ─── DESKTOP LAYOUT ─── */
  return (
    <div
      className="flex-1 flex flex-col"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Edge-anchored layout — no max-w centering, sidebar hugs the side */}
        <div className="flex w-full">
          {/* Creation Sidebar — fixed width, sticky, edge-anchored */}
          <div className="w-[400px] flex-shrink-0 relative">
            <div
              className="sticky px-5 py-5 overflow-y-auto"
              style={{
                top: 'calc(3.5rem + var(--banner-h, 0px))',
                height: 'calc(100vh - 3.5rem - var(--banner-h, 0px))',
              }}
            >
              <CreationPanel isDesktop />
            </div>

            {/* Desktop Model Panel — opens beside sidebar */}
            {showModelPicker && (
              <div
                className="fixed z-50"
                style={{
                  top: 'calc(3.5rem + var(--banner-h, 0px) + 1.25rem)',
                  ...(isAr
                    ? { right: '420px' }
                    : { left: '420px' }
                  ),
                }}
              >
                <DesktopModelPanel
                  videoModels={videoModels}
                  selectedModelId={selectedModelId}
                  onSelect={id => { setSelectedModelId(id); setShowModelPicker(false); }}
                  onClose={() => setShowModelPicker(false)}
                  isAr={isAr}
                />
              </div>
            )}
          </div>

          {/* Content Panel — fills remaining space */}
          <div className="flex-1 min-w-0 px-8 py-6">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="bg-card/50 dark:bg-card/30 rounded-2xl p-1 mb-6 w-auto inline-flex">
                <TabsTrigger
                  value="history"
                  className="rounded-xl px-5 py-2 text-[13px] font-semibold data-[state=active]:bg-background dark:data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all"
                >
                  <Film size={14} className={cn(isAr ? "ml-2" : "mr-2")} />
                  {isAr ? 'السجل' : 'History'}
                </TabsTrigger>
                <TabsTrigger
                  value="howItWorks"
                  className="rounded-xl px-5 py-2 text-[13px] font-semibold data-[state=active]:bg-background dark:data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all"
                >
                  <Play size={14} className={cn(isAr ? "ml-2" : "mr-2")} />
                  {isAr ? 'كيف يعمل' : 'How it works'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-0">
                <VideoHistoryPanel />
              </TabsContent>

              <TabsContent value="howItWorks" className="mt-0">
                <VideoHowItWorks />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Model Picker Bottom Sheet (mobile only) ─── */
function ModelPickerSheet({ videoModels, selectedModelId, onSelect, onClose, isAr }: {
  videoModels: VideoModel[];
  selectedModelId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  isAr: boolean;
}) {
  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150" />
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-popover flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-200"
        style={{ maxHeight: '70vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto" />
        </div>
        {/* Title */}
        <div className="flex-shrink-0 px-5 pb-3 pt-1">
          <h3 className="text-[15px] font-bold text-foreground">{isAr ? 'اختر النموذج' : 'Choose Model'}</h3>
        </div>
        {/* Scrollable model list */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-3 space-y-0.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {videoModels.map(model => {
            const isSelected = model.id === selectedModelId;
            const bestFor = isAr ? model.best_for_ar : model.best_for;
            return (
              <button
                key={model.id}
                onClick={() => onSelect(model.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-start active:scale-[0.98]",
                  isSelected ? "bg-primary/10" : "hover:bg-accent/40"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
                  isSelected ? "ring-2 ring-primary/30" : "bg-muted/30 dark:bg-muted/10"
                )}>
                  {model.preview_image_url ? (
                    <img src={model.preview_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Film size={16} className={isSelected ? "text-primary" : "text-muted-foreground/40"} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-foreground truncate">{model.model_name}</span>
                    {model.supports_image_to_video && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-bold flex-shrink-0">I2V</span>
                    )}
                  </div>
                  {bestFor && (
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">{bestFor}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
          {/* Bottom spacer so last item is always reachable above safe area */}
          <div style={{ height: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }} />
        </div>
      </div>
    </div>
  );
}
                {isSelected && <Check size={15} className="text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
