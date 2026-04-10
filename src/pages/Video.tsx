import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Film, Clock, MonitorSmartphone, ChevronRight, Image, Sparkles, Search, Check, Diamond } from 'lucide-react';
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

/* ─── Pill Selector ─── */
function PillSelector({ label, options, value, onSelect }: {
  label: string; options: string[]; value: string; onSelect: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={cn(
              "px-4 py-2 rounded-xl text-[13px] font-semibold transition-all",
              opt === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-accent/60"
            )}
          >
            {opt}
          </button>
        ))}
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
  const [modelSearch, setModelSearch] = useState('');
  const startFrameRef = useRef<HTMLInputElement>(null);
  const endFrameRef = useRef<HTMLInputElement>(null);

  // Auto-select default model
  useEffect(() => {
    if (videoModels.length > 0 && !selectedModelId) {
      const def = videoModels.find(m => m.is_default) || videoModels[0];
      setSelectedModelId(def.id);
    }
  }, [videoModels, selectedModelId]);

  const currentModel = videoModels.find(m => m.id === selectedModelId) || videoModels[0];

  // Fetch pricing tiers
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

  // Auto-select valid options when model changes
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

  // Upload handler
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

  // Generate
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

  const filteredModels = videoModels.filter(m =>
    !modelSearch || m.model_name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  /* ─── Empty state ─── */
  if (videoModels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <div className="text-center">
          <Film size={48} className="mx-auto text-muted-foreground/20 mb-4" />
          <h2 className="text-lg font-bold text-foreground">{isAr ? 'قريباً' : 'Coming Soon'}</h2>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? 'نعمل على تجهيز توليد الفيديو' : 'Video generation is being prepared'}</p>
        </div>
      </div>
    );
  }

  /* ─── Frame Upload Card ─── */
  const FrameCard = ({ type, image, onRemove, onUpload, inputRef }: {
    type: 'start' | 'end';
    image: { preview: string; url: string | null } | null;
    onRemove: () => void;
    onUpload: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <button
      onClick={onUpload}
      className={cn(
        "relative rounded-2xl flex flex-col items-center justify-center gap-2 transition-all overflow-hidden",
        image ? "p-0" : "py-8 bg-card/80 hover:bg-card active:scale-[0.97]"
      )}
    >
      {image ? (
        <>
          <img src={image.preview} alt="" className="w-full h-full object-cover rounded-2xl aspect-[4/3]" />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <X size={12} />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="w-11 h-11 rounded-full bg-muted/30 flex items-center justify-center">
            <Image size={18} className="text-muted-foreground/40" />
          </div>
          <span className="text-[12px] text-muted-foreground/60 font-medium">
            {type === 'start' ? (isAr ? 'إطار البداية' : 'Start frame') : (isAr ? 'إطار النهاية' : 'End frame')}
          </span>
          <span className="text-[10px] text-muted-foreground/30 font-medium">
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
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-lg mx-auto px-5 pt-5 space-y-5">

          {/* 1. Frame Upload */}
          {currentModel?.supports_image_to_video && (
            <div className="grid grid-cols-2 gap-3">
              <FrameCard
                type="start"
                image={uploadedImage}
                onRemove={() => setUploadedImage(null)}
                onUpload={() => startFrameRef.current?.click()}
                inputRef={startFrameRef}
              />
              <FrameCard
                type="end"
                image={endFrameImage}
                onRemove={() => setEndFrameImage(null)}
                onUpload={() => endFrameRef.current?.click()}
                inputRef={endFrameRef}
              />
              <input ref={startFrameRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'start'); }} />
              <input ref={endFrameRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'end'); }} />
            </div>
          )}

          {/* 2. Prompt */}
          <div className="rounded-2xl bg-card/80 overflow-hidden focus-within:ring-1 focus-within:ring-primary/30 transition-shadow">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={isAr ? 'صف الفيديو الذي تريده...' : 'Describe your video...'}
              rows={4}
              className="w-full bg-transparent p-4 text-[15px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 3. Model Selector Row */}
          <button
            onClick={() => setShowModelPicker(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card/80 hover:bg-card transition-colors group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center flex-shrink-0">
                {currentModel?.preview_image_url ? (
                  <img src={currentModel.preview_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Film size={16} className="text-muted-foreground/40" />
                )}
              </div>
              <div className="text-start">
                <p className="text-[11px] text-muted-foreground font-medium">{isAr ? 'النموذج' : 'Model'}</p>
                <p className="text-[14px] font-bold text-foreground">{currentModel?.model_name}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          {/* 4. Settings — Pill selectors */}
          <div className="space-y-4">
            <PillSelector
              label={isAr ? 'المدة' : 'Duration'}
              options={currentModel?.supported_durations || []}
              value={selectedDuration}
              onSelect={setSelectedDuration}
            />
            <PillSelector
              label={isAr ? 'النسبة' : 'Ratio'}
              options={currentModel?.supported_ratios || []}
              value={selectedRatio}
              onSelect={setSelectedRatio}
            />
            <PillSelector
              label={isAr ? 'الجودة' : 'Quality'}
              options={currentModel?.supported_qualities || []}
              value={selectedQuality}
              onSelect={setSelectedQuality}
            />
          </div>
        </div>
      </div>

      {/* 5. Sticky Generate Button */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || isUploading}
            className={cn(
              "w-full h-[52px] rounded-2xl text-[16px] font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]",
              (!prompt.trim() || isUploading)
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:brightness-110"
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
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowModelPicker(false); setModelSearch(''); }} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] rounded-t-3xl bg-popover flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto mt-3 mb-2" />

            {/* Search */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-card/80">
                <Search size={14} className="text-muted-foreground/50 flex-shrink-0" />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={e => setModelSearch(e.target.value)}
                  placeholder={isAr ? 'بحث عن نموذج...' : 'Search models...'}
                  className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Models List */}
            <div className="overflow-y-auto flex-1 px-3 pb-6 space-y-0.5">
              {filteredModels.map(model => {
                const isSelected = model.id === selectedModelId;
                const maxQ = model.supported_qualities[model.supported_qualities.length - 1] || '';
                const durRange = model.supported_durations.length > 1
                  ? `${model.supported_durations[0]}–${model.supported_durations[model.supported_durations.length - 1]}`
                  : model.supported_durations[0] || '';

                return (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModelId(model.id); setShowModelPicker(false); setModelSearch(''); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-start active:scale-[0.98]",
                      isSelected ? "bg-primary/10" : "hover:bg-accent/60"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
                      isSelected ? "bg-primary/15" : "bg-muted/50"
                    )}>
                      {model.preview_image_url ? (
                        <img src={model.preview_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Film size={16} className={isSelected ? "text-primary" : "text-muted-foreground"} />
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
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Diamond size={9} /> {maxQ}
                          </span>
                        )}
                        {durRange && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock size={9} /> {durRange}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={15} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
              {filteredModels.length === 0 && (
                <p className="text-center text-[12px] text-muted-foreground/50 py-6">
                  {isAr ? 'لا توجد نتائج' : 'No models found'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
