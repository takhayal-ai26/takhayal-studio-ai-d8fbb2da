import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Film, Clock, ChevronRight, ChevronDown, Image, Check, Diamond } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { useAuth } from '@/context/AuthContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
function DropUpSelector({ label, options, value, onSelect, icon }: {
  label: string; options: string[]; value: string; onSelect: (v: string) => void; icon?: React.ReactNode;
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
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl bg-card/60 active:scale-[0.97] transition-all"
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
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-2xl bg-popover/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.25)] border border-border/10 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
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

/* ─── Component ─── */
export default function Video() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, isAuthenticated, openAuthModal, openUpgradeModal } = useApp();
  const { lang } = useLanguage();
  const { models } = useModels();
  const { submitVideoJob } = useGenerationJobs();
  const isAr = lang === 'ar';

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

  if (videoModels.length === 0) {
    return (
      <div className="flex-1 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <div className="max-w-lg mx-auto px-4 pt-3 w-full space-y-4">
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
        image ? "p-0" : "border border-dashed border-border/30 bg-card/40 hover:bg-card/60 active:scale-[0.97]"
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
          <div className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center">
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

  return (
    <div
      className="flex-1 flex flex-col"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
    >
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-lg mx-auto px-4 pt-3 space-y-0">

          {/* 1. Model Hero */}
          <button
            onClick={() => setShowModelPicker(true)}
            className="w-full rounded-2xl overflow-hidden relative group active:scale-[0.98] transition-transform mb-3"
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
              <p className="text-[18px] font-black text-white tracking-tight">{currentModel?.model_name}</p>
              <ChevronRight size={16} className="text-white/50" />
            </div>
          </button>

          {/* 2. Frame Upload */}
          {currentModel?.supports_image_to_video && (
            <div className="grid grid-cols-2 gap-2.5 mb-4">
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

          {/* 3. Prompt */}
          <div className="mb-4">
            <div className="rounded-2xl bg-card/50 overflow-hidden focus-within:ring-1 focus-within:ring-primary/20 transition-shadow">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={isAr ? 'صف الفيديو الذي تريده...' : 'Describe your video...'}
                rows={4}
                className="w-full bg-transparent px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* 4. Model Selector Row */}
          <button
            onClick={() => setShowModelPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card/50 transition-colors group active:scale-[0.98] mb-3"
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

          {/* 5. Settings — Drop-up selectors */}
          <div className="flex items-stretch gap-2">
            <DropUpSelector
              label={isAr ? 'المدة' : 'Duration'}
              options={currentModel?.supported_durations || []}
              value={selectedDuration}
              onSelect={setSelectedDuration}
              icon={<Clock size={13} className="text-muted-foreground/40 flex-shrink-0" />}
            />
            <DropUpSelector
              label={isAr ? 'النسبة' : 'Ratio'}
              options={currentModel?.supported_ratios || []}
              value={selectedRatio}
              onSelect={setSelectedRatio}
            />
            <DropUpSelector
              label={isAr ? 'الجودة' : 'Quality'}
              options={currentModel?.supported_qualities || []}
              value={selectedQuality}
              onSelect={setSelectedQuality}
              icon={<Diamond size={12} className="text-muted-foreground/40 flex-shrink-0" />}
            />
          </div>
        </div>
      </div>

      {/* 6. Sticky Generate Button */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || isUploading}
            className={cn(
              "w-full h-[52px] rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]",
              (!prompt.trim() || isUploading)
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(var(--primary-rgb,240,62,27),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary-rgb,240,62,27),0.4)] hover:brightness-110"
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

      {/* Model Picker Bottom Sheet */}
      {showModelPicker && (
        <div className="fixed inset-0 z-50" onClick={() => setShowModelPicker(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-popover flex flex-col animate-in slide-in-from-bottom duration-200"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex-shrink-0 pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto" />
            </div>

            {/* Title */}
            <div className="flex-shrink-0 px-5 pb-3">
              <h3 className="text-[15px] font-bold text-foreground">{isAr ? 'اختر النموذج' : 'Choose Model'}</h3>
            </div>

            {/* Models List — scrollable */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-3 space-y-0.5"
              style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              {videoModels.map(model => {
                const isSelected = model.id === selectedModelId;
                const maxQ = model.supported_qualities[model.supported_qualities.length - 1] || '';
                const durRange = model.supported_durations.length > 1
                  ? `${model.supported_durations[0]}–${model.supported_durations[model.supported_durations.length - 1]}`
                  : model.supported_durations[0] || '';

                return (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModelId(model.id); setShowModelPicker(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-start active:scale-[0.98]",
                      isSelected ? "bg-primary/10" : "hover:bg-accent/40"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
                      isSelected ? "ring-2 ring-primary/30" : "bg-muted/30"
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
                      <div className="flex items-center gap-2 mt-0.5">
                        {maxQ && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                            <Diamond size={9} /> {maxQ}
                          </span>
                        )}
                        {durRange && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                            <Clock size={9} /> {durRange}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={15} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
