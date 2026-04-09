import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Coins, Play, Film, Clock, MonitorSmartphone, ChevronDown, Image, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { useAuth } from '@/context/AuthContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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

/* ─── Component ─── */
export default function Video() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, isAuthenticated, openAuthModal, openUpgradeModal } = useApp();
  const { lang } = useLanguage();
  const { models } = useModels();
  const { submitVideoJob } = useGenerationJobs();
  const isMobile = useIsMobile();
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
    }))
  , [models]);

  const [selectedModelId, setSelectedModelId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedDuration, setSelectedDuration] = useState('5s');
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [uploadedImage, setUploadedImage] = useState<{ preview: string; url: string | null } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tiers, setTiers] = useState<VideoTier[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleUpload = useCallback(async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    setUploadedImage({ preview, url: null });
    const path = `${user.id}/video-input-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('tool-files').upload(path, file);
    if (error) {
      toast.error(isAr ? 'فشل رفع الصورة' : 'Upload failed');
      setUploadedImage(null);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('tool-files').getPublicUrl(path);
      setUploadedImage({ preview, url: publicUrl });
    }
    setIsUploading(false);
  }, [user, isAr]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleUpload(file);
  }, [handleUpload]);

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

  /* ─── Chip selector component ─── */
  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-28 md:pb-8" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        {/* ── Page header ── */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            {isAr ? 'توليد فيديو' : 'Create Video'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'اختر النموذج، اكتب الوصف، ثم أنشئ' : 'Choose a model, describe your vision, then generate'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ════════════ LEFT — Creation Panel ════════════ */}
          <div className="flex-1 max-w-2xl space-y-6">

            {/* A. Model Hero Card */}
            <button
              onClick={() => setShowModelPicker(true)}
              className="w-full group rounded-2xl bg-muted/40 hover:bg-muted/60 transition-all duration-200 overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <Film size={24} className="text-primary" />
                </div>
                <div className="flex-1 text-start min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-foreground truncate">{currentModel?.model_name}</span>
                    {currentModel?.supports_image_to_video && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
                        I2V
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {currentModel?.supported_qualities.map(q => (
                      <span key={q} className="text-[11px] text-muted-foreground font-medium">{q}</span>
                    ))}
                    <span className="text-muted-foreground/30">·</span>
                    {currentModel?.supported_durations.map(d => (
                      <span key={d} className="text-[11px] text-muted-foreground font-medium">{d}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                  <span className="text-[12px] font-medium">{isAr ? 'تغيير' : 'Change'}</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </button>

            {/* B. Prompt */}
            <div>
              <label className="text-[13px] font-semibold text-foreground/70 mb-2 block uppercase tracking-wide">
                {isAr ? 'الوصف' : 'Prompt'}
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={isAr ? 'صف الفيديو الذي تريد إنشاءه...' : 'Describe the video you want to create...'}
                rows={4}
                className="w-full rounded-2xl bg-muted/40 border-0 p-4 text-[15px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all leading-relaxed"
              />
            </div>

            {/* C. Optional reference image */}
            {currentModel?.supports_image_to_video && (
              <div>
                <label className="text-[13px] font-semibold text-foreground/70 mb-2 block uppercase tracking-wide">
                  {isAr ? 'صورة بداية' : 'Starting Frame'}
                  <span className="text-muted-foreground/40 font-normal normal-case ms-1.5">({isAr ? 'اختياري' : 'optional'})</span>
                </label>
                {uploadedImage ? (
                  <div className="relative inline-block rounded-xl overflow-hidden">
                    <img src={uploadedImage.preview} alt="" className="h-28 w-auto rounded-xl object-cover" />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-20 rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-150 ${
                      isDragging
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-foreground/[0.08] hover:border-foreground/[0.15] bg-muted/20 hover:bg-muted/30'
                    }`}
                  >
                    <Image size={18} className="text-muted-foreground/40" />
                    <span className="text-[13px] text-muted-foreground/50">
                      {isAr ? 'اسحب صورة أو اضغط للرفع' : 'Drag image or click to upload'}
                    </span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
              </div>
            )}

            {/* D. Compact Settings Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Ratio */}
              <div className="flex items-center gap-1.5">
                <MonitorSmartphone size={14} className="text-muted-foreground/50" />
                {currentModel?.supported_ratios.map(r => (
                  <Chip key={r} label={r} active={selectedRatio === r} onClick={() => setSelectedRatio(r)} />
                ))}
              </div>

              <div className="w-px h-6 bg-foreground/[0.06] hidden sm:block" />

              {/* Duration */}
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-muted-foreground/50" />
                {currentModel?.supported_durations.map(d => (
                  <Chip key={d} label={d} active={selectedDuration === d} onClick={() => setSelectedDuration(d)} />
                ))}
              </div>

              <div className="w-px h-6 bg-foreground/[0.06] hidden sm:block" />

              {/* Quality */}
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-muted-foreground/50" />
                {currentModel?.supported_qualities.map(q => (
                  <Chip key={q} label={q} active={selectedQuality === q} onClick={() => setSelectedQuality(q)} />
                ))}
              </div>
            </div>

            {/* E. Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || isUploading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground text-[15px] font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Play size={18} className="fill-current" />
                  {isAr ? 'توليد الفيديو' : 'Generate Video'}
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[12px] font-semibold">
                    <Coins size={12} /> {creditCost}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* ════════════ RIGHT — Preview Area ════════════ */}
          <div className="hidden lg:block w-[340px] flex-shrink-0">
            <div className="sticky top-28 space-y-5">
              {/* Featured sample preview */}
              <div className="rounded-2xl overflow-hidden bg-muted/30 aspect-video flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                <div className="text-center z-10">
                  <Play size={40} className="mx-auto text-primary/30 mb-3" />
                  <p className="text-[13px] text-muted-foreground/50 font-medium">
                    {isAr ? 'معاينة النموذج' : 'Model Preview'}
                  </p>
                </div>
              </div>

              {/* Model info */}
              <div className="rounded-xl bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Film size={14} className="text-primary" />
                  <span className="text-[13px] font-bold text-foreground">{currentModel?.model_name}</span>
                </div>
                {currentModel?.best_for && (
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {isAr ? currentModel.best_for_ar || currentModel.best_for : currentModel.best_for}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {currentModel?.supported_qualities.map(q => (
                    <span key={q} className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/[0.05] text-muted-foreground font-medium">{q}</span>
                  ))}
                  {currentModel?.supported_durations.map(d => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/[0.05] text-muted-foreground font-medium">{d}</span>
                  ))}
                  {currentModel?.supports_image_to_video && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      {isAr ? 'صورة → فيديو' : 'Image → Video'}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick tips */}
              <div className="rounded-xl bg-muted/10 p-4">
                <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider mb-2">
                  {isAr ? 'نصائح' : 'Tips'}
                </p>
                <ul className="space-y-1.5 text-[12px] text-muted-foreground/60 leading-relaxed">
                  <li>• {isAr ? 'كن واضحاً ومحدداً في الوصف' : 'Be clear and specific in your prompt'}</li>
                  <li>• {isAr ? 'صف الحركة والمشهد بالتفصيل' : 'Describe motion and scene in detail'}</li>
                  <li>• {isAr ? 'استخدم صورة بداية للتحكم أكثر' : 'Use a starting frame for more control'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ Model Picker Modal ════════════ */}
      <Dialog open={showModelPicker} onOpenChange={setShowModelPicker}>
        <DialogContent className="max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-0 bg-popover">
          <div className="p-5 pb-3">
            <h3 className="text-[15px] font-bold text-foreground">
              {isAr ? 'اختر النموذج' : 'Choose Model'}
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {isAr ? 'اختر نموذج توليد الفيديو' : 'Select a video generation model'}
            </p>
          </div>
          <div className="px-3 pb-4 space-y-1.5 max-h-[60vh] overflow-y-auto">
            {videoModels.map(model => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => { setSelectedModelId(model.id); setShowModelPicker(false); }}
                  className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-150 text-start ${
                    isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/25'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-primary/15' : 'bg-muted/40'
                  }`}>
                    <Film size={18} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[14px] font-bold truncate ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                        {model.model_name}
                      </span>
                      {model.supports_image_to_video && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">I2V</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {model.supported_qualities.map(q => (
                        <span key={q} className="text-[10px] text-muted-foreground font-medium">{q}</span>
                      ))}
                      <span className="text-muted-foreground/20">·</span>
                      {model.supported_durations.map(d => (
                        <span key={d} className="text-[10px] text-muted-foreground font-medium">{d}</span>
                      ))}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
