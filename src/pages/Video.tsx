import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, X, Coins, Play, Film, Clock, MonitorSmartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { useAuth } from '@/context/AuthContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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

const RATIO_ICONS: Record<string, string> = {
  '16:9': '🖥️', '9:16': '📱', '1:1': '⬛',
};

export default function Video() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, isAuthenticated, openAuthModal, openUpgradeModal } = useApp();
  const { lang } = useLanguage();
  const { models } = useModels();
  const { submitVideoJob } = useGenerationJobs();
  const isMobile = useIsMobile();
  const isAr = lang === 'ar';

  // Video models
  const videoModels = useMemo(() =>
    models.filter((m: any) => m.media_type === 'video' && m.is_active).map((m: any): VideoModel => ({
      id: m.id,
      model_name: m.model_name,
      endpoint_id: m.endpoint_id,
      supported_ratios: Array.isArray(m.supported_ratios) ? m.supported_ratios : [],
      supported_durations: Array.isArray(m.supported_durations) ? m.supported_durations : [],
      supported_qualities: Array.isArray(m.supported_qualities) ? m.supported_qualities : [],
      text_to_video_endpoint: m.text_to_video_endpoint || null,
      image_to_video_endpoint: m.image_to_video_endpoint || null,
      supports_image_to_video: m.supports_image_to_video || false,
      is_default: m.is_default,
      speed: m.speed,
      best_for: m.best_for,
      best_for_ar: m.best_for_ar,
      cost_per_run: m.cost_per_run ? Number(m.cost_per_run) : null,
    }))
  , [models]);

  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedDuration, setSelectedDuration] = useState('5s');
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [uploadedImage, setUploadedImage] = useState<{ preview: string; url: string | null } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tiers, setTiers] = useState<VideoTier[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

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
    supabase.from('model_pricing_tiers')
      .select('*')
      .eq('model_id', currentModel.id)
      .eq('is_available', true)
      .eq('is_active', true)
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
    if (!currentModel.supported_ratios.includes(selectedRatio)) {
      setSelectedRatio(currentModel.supported_ratios[0] || '16:9');
    }
    if (!currentModel.supported_durations.includes(selectedDuration)) {
      setSelectedDuration(currentModel.supported_durations[0] || '5s');
    }
    if (!currentModel.supported_qualities.includes(selectedQuality)) {
      setSelectedQuality(currentModel.supported_qualities[0] || '720p');
    }
    // Clear upload if model doesn't support I2V
    if (!currentModel.supports_image_to_video) {
      setUploadedImage(null);
    }
  }, [currentModel]);

  // Find matching tier
  const matchedTier = useMemo(() =>
    tiers.find(t => t.quality_level === selectedQuality && t.duration === selectedDuration) ||
    tiers.find(t => t.is_default) ||
    tiers[0]
  , [tiers, selectedQuality, selectedDuration]);

  const creditCost = matchedTier?.credits_charged ?? 10;

  // Upload handler
  const handleUpload = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    setUploadedImage({ preview, url: null });

    const path = `${user.id}/video-input-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('tool-files').upload(path, file);
    if (error) {
      toast.error(isAr ? 'فشل رفع الصورة' : 'Upload failed');
      setUploadedImage(null);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('tool-files').getPublicUrl(path);
      setUploadedImage({ preview, url: publicUrl });
    }
    setIsUploading(false);
  };

  // Generate
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(isAr ? 'يرجى إدخال وصف' : 'Please enter a prompt');
      return;
    }
    if (!isAuthenticated) { openAuthModal('signup'); return; }
    if (credits < creditCost) { openUpgradeModal(); return; }
    if (!currentModel) return;

    setIsGenerating(true);
    try {
      const jobId = await submitVideoJob({
        prompt: prompt.trim(),
        ratio: selectedRatio,
        quality: selectedQuality,
        duration: selectedDuration,
        modelId: currentModel.id,
        creditCost,
        imageUrl: uploadedImage?.url || undefined,
      });

      if (jobId) {
        navigate(`/gallery?highlight=${jobId}`);
      }
    } catch (err) {
      console.error('Video generation error:', err);
      toast.error(isAr ? 'فشل في بدء التوليد' : 'Failed to start generation');
    }
    setIsGenerating(false);
  };

  const scrollStrip = (dir: number) => {
    stripRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

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

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-6" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      {/* ── Model Strip ── */}
      <div className="relative px-4 md:px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground">{isAr ? 'توليد فيديو' : 'Video Generation'}</h1>
          <div className="hidden md:flex gap-1">
            <button onClick={() => scrollStrip(-1)} className="w-8 h-8 rounded-full bg-foreground/[0.05] hover:bg-foreground/[0.1] flex items-center justify-center transition-colors">
              <ChevronLeft size={16} className={isAr ? 'rotate-180' : ''} />
            </button>
            <button onClick={() => scrollStrip(1)} className="w-8 h-8 rounded-full bg-foreground/[0.05] hover:bg-foreground/[0.1] flex items-center justify-center transition-colors">
              <ChevronRight size={16} className={isAr ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        <div ref={stripRef} className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">
          {videoModels.map(model => {
            const isSelected = model.id === selectedModelId;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`flex-shrink-0 snap-start rounded-2xl p-3.5 min-w-[160px] md:min-w-[180px] transition-all duration-200 text-start ${
                  isSelected
                    ? 'bg-primary/10 ring-2 ring-primary/40 shadow-lg shadow-primary/10'
                    : 'bg-foreground/[0.04] hover:bg-foreground/[0.07]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Film size={16} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                  <span className={`text-[13px] font-bold ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                    {model.model_name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {model.supported_qualities.map(q => (
                    <span key={q} className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/[0.06] text-muted-foreground font-medium">{q}</span>
                  ))}
                  {model.supported_durations.map(d => (
                    <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/[0.06] text-muted-foreground font-medium">{d}</span>
                  ))}
                </div>
                {model.supports_image_to_video && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {isAr ? 'صورة → فيديو' : 'Image → Video'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-6">
        {/* Left Panel — Controls */}
        <div className="flex-1 max-w-xl space-y-5">
          {/* Prompt */}
          <div>
            <label className="text-[13px] font-semibold text-foreground mb-2 block">{isAr ? 'الوصف' : 'Prompt'}</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={isAr ? 'صف الفيديو الذي تريد إنشاءه...' : 'Describe the video you want to create...'}
              rows={4}
              className="w-full rounded-2xl bg-foreground/[0.04] border-0 p-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
            />
          </div>

          {/* Image Upload (only if model supports I2V) */}
          {currentModel?.supports_image_to_video && (
            <div>
              <label className="text-[13px] font-semibold text-foreground mb-2 block">
                {isAr ? 'صورة بداية (اختياري)' : 'Starting Frame (optional)'}
              </label>
              {uploadedImage ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden">
                  <img src={uploadedImage.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white"
                  >
                    <X size={12} />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-2xl border-2 border-dashed border-foreground/10 hover:border-primary/30 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all"
                >
                  <Upload size={18} />
                  <span className="text-sm">{isAr ? 'ارفع صورة' : 'Upload image'}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
            </div>
          )}

          {/* Ratio */}
          <div>
            <label className="text-[13px] font-semibold text-foreground mb-2 block">{isAr ? 'النسبة' : 'Ratio'}</label>
            <div className="flex gap-2">
              {currentModel?.supported_ratios.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRatio(r)}
                  className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    selectedRatio === r
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.07]'
                  }`}
                >
                  {RATIO_ICONS[r] || ''} {r}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[13px] font-semibold text-foreground mb-2 block">
              <Clock size={14} className="inline mr-1" />
              {isAr ? 'المدة' : 'Duration'}
            </label>
            <div className="flex gap-2">
              {currentModel?.supported_durations.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    selectedDuration === d
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.07]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="text-[13px] font-semibold text-foreground mb-2 block">
              <MonitorSmartphone size={14} className="inline mr-1" />
              {isAr ? 'الجودة' : 'Quality'}
            </label>
            <div className="flex gap-2">
              {currentModel?.supported_qualities.map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuality(q)}
                  className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    selectedQuality === q
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.07]'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || isUploading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white text-[15px] font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play size={18} />
                {isAr ? 'توليد الفيديو' : 'Generate Video'}
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[12px] font-semibold">
                  <Coins size={12} /> {creditCost}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Panel — Inspiration */}
        <div className="hidden md:block flex-1 max-w-md">
          <div className="sticky top-24 space-y-4">
            <h3 className="text-[13px] font-bold text-foreground/60 uppercase tracking-wider">
              {isAr ? 'إلهام' : 'Inspiration'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { prompt: isAr ? 'غروب سينمائي على المحيط' : 'Cinematic sunset over the ocean', ratio: '16:9' },
                { prompt: isAr ? 'عرض منتج عطر فاخر' : 'Luxury perfume product reveal', ratio: '9:16' },
                { prompt: isAr ? 'مدينة مستقبلية في الليل' : 'Futuristic city at night', ratio: '16:9' },
                { prompt: isAr ? 'طعام شهي يُقدم على طاولة' : 'Delicious food being served', ratio: '1:1' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(item.prompt); if (currentModel?.supported_ratios.includes(item.ratio)) setSelectedRatio(item.ratio); }}
                  className="p-4 rounded-2xl bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all text-start group"
                >
                  <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center mb-3">
                    <Play size={20} className="text-primary/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                  <p className="text-[12px] text-muted-foreground line-clamp-2">{item.prompt}</p>
                  <span className="text-[10px] text-muted-foreground/50 mt-1 block">{item.ratio}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
