import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Sparkles, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TemplateData {
  id: string;
  title_en: string;
  title_ar: string;
  prompt: string;       // prompt_en
  prompt_ar: string;
  cover_image_url: string;
  ratio: string;
  category: string;
  default_model_id: string | null;
  featured: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const { requireAuth, openAuthModal } = useApp();
  const { createJob, startGeneration } = useGenerationJobs();
  const isAr = lang === 'ar';

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if model supports image input
  const [modelSupportsImage, setModelSupportsImage] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('templates')
        .select('id, title_en, title_ar, prompt, prompt_ar, cover_image_url, ratio, category, default_model_id, featured')
        .eq('id', id)
        .eq('active', true)
        .single();
      if (data) {
        setTemplate(data as any);
        // Check if model supports image input
        if ((data as any).default_model_id) {
          const { data: model } = await supabase
            .from('models')
            .select('supports_image_input')
            .eq('id', (data as any).default_model_id)
            .single();
          setModelSupportsImage(!!model?.supports_image_input);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file', description: 'JPG, PNG, or WebP only', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'Too large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('tool-files')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return;
    }
    const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(data.path);
    setUploadedImage(urlData.publicUrl);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleGenerate = async () => {
    if (!template) return;
    if (!user) {
      openAuthModal('signup');
      return;
    }

    setGenerating(true);

    // CRITICAL: Always use prompt_en (English prompt) for generation
    const generationPrompt = template.prompt;
    const ratio = template.ratio || '1:1';
    const modelId = template.default_model_id;

    const jobId = await createJob({
      prompt: generationPrompt,
      ratio,
      qualityTier: '1K',
      modelId,
      creditCost: 2,
    });

    if (!jobId) {
      toast({ title: isAr ? 'حدث خطأ' : 'Error', description: isAr ? 'فشل في بدء التوليد' : 'Failed to start generation', variant: 'destructive' });
      setGenerating(false);
      return;
    }

    await startGeneration(jobId, {
      prompt: generationPrompt,
      aspectRatio: ratio,
      qualityTier: '1K',
      modelId,
      imageUrl: uploadedImage || undefined,
    });

    navigate('/gallery');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <p className="text-muted-foreground">{isAr ? 'القالب غير موجود' : 'Template not found'}</p>
        <Button variant="outline" onClick={() => navigate('/templates')}>
          {isAr ? 'العودة للقوالب' : 'Back to Templates'}
        </Button>
      </div>
    );
  }

  const title = isAr && template.title_ar ? template.title_ar : template.title_en;

  return (
    <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
          {isAr ? 'رجوع' : 'Back'}
        </button>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* LEFT: Info + Generate */}
          <div className="flex-1 order-2 md:order-1 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{title}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isAr ? 'مُهيأ لأفضل النتائج' : 'Optimized for best results'}
              </p>
            </div>

            {/* Upload area (only if model supports it) */}
            {modelSupportsImage && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {isAr ? 'صورة مرجعية (اختياري)' : 'Reference Image (optional)'}
                </p>
                {uploadedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-border/40 bg-muted/20 max-w-[240px]">
                    <img src={uploadedImage} alt="Upload" className="w-full h-auto max-h-[200px] object-contain" />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border/40 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all max-w-[300px] ${
                      dragOver ? 'border-primary bg-primary/5' : 'border-border/40 bg-muted/10 hover:border-primary/50'
                    }`}
                  >
                    <Upload size={20} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {isAr ? 'اسحب صورة أو اضغط للرفع' : 'Drag image or click to upload'}
                    </p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
              </div>
            )}

            {/* Generate Button */}
            <Button
              size="lg"
              className="w-full md:w-auto min-w-[200px] h-12 text-base font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <><Loader2 size={18} className="animate-spin" /> {isAr ? 'جارِ التوليد...' : 'Generating...'}</>
              ) : (
                <><Sparkles size={18} /> {isAr ? 'إنشاء الآن' : 'Generate Now'}</>
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground/60">
              {isAr ? '٢ رصيد لكل توليد' : '2 credits per generation'}
            </p>
          </div>

          {/* RIGHT: Preview Image */}
          <div className="flex-1 order-1 md:order-2 max-w-lg">
            <div className="rounded-2xl overflow-hidden border border-border/20 shadow-xl shadow-black/10">
              <img
                src={template.cover_image_url}
                alt={title}
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
