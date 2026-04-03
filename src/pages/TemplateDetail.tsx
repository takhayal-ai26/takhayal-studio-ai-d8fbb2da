import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Sparkles, ArrowLeft, ImagePlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SEEDREAM_45_ID = '80225ee4-1930-4431-b484-43b448969b3b';

interface TemplateData {
  id: string;
  title_en: string;
  title_ar: string;
  prompt: string;
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
  const { openAuthModal } = useApp();
  const { createJob, startGeneration } = useGenerationJobs();
  const isAr = lang === 'ar';

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (data) setTemplate(data as any);
      setLoading(false);
    })();
  }, [id]);

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: isAr ? 'ملف غير صالح' : 'Invalid file', description: isAr ? 'JPG أو PNG أو WebP فقط' : 'JPG, PNG, or WebP only', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: isAr ? 'الملف كبير جداً' : 'Too large', description: isAr ? 'الحد الأقصى 10MB' : 'Max 10MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('tool-files')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) {
      toast({ title: isAr ? 'فشل الرفع' : 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(data.path);
    setUploadedImage(urlData.publicUrl);
    setUploading(false);
  }, [isAr]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const resolvedModelId = template?.default_model_id || SEEDREAM_45_ID;

  const handleGenerate = async () => {
    if (!template) return;
    if (!user) { openAuthModal('signup'); return; }
    if (!uploadedImage) {
      toast({ title: isAr ? 'مطلوب صورة' : 'Image required', description: isAr ? 'يرجى رفع صورة أولاً' : 'Please upload an image first', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    const generationPrompt = template.prompt;
    const ratio = template.ratio || '1:1';

    const jobId = await createJob({
      prompt: generationPrompt,
      ratio,
      qualityTier: '1K',
      modelId: resolvedModelId,
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
      modelId: resolvedModelId,
      imageUrl: uploadedImage,
    });

    navigate('/gallery');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-screen">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-32 md:pb-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} className={isRTL ? 'rotate-180' : ''} />
          {isAr ? 'رجوع' : 'Back'}
        </button>

        <div className="flex flex-col md:flex-row gap-8 md:gap-10">
          {/* LEFT column — desktop: info + upload + generate */}
          <div className="flex-1 order-2 md:order-1 space-y-5 md:max-w-md">
            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {isAr ? 'ارفع صورتك وسنتكفل بالباقي' : "Upload your image and we'll handle the rest"}
              </p>
            </div>

            {/* Upload area */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'صورتك' : 'Your Image'}
              </p>

              {uploadedImage ? (
                <div className="relative rounded-2xl overflow-hidden bg-muted/10 group">
                  <img src={uploadedImage} alt="Upload" className="w-full h-auto max-h-[240px] object-contain rounded-2xl" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 px-4 rounded-full bg-background/90 backdrop-blur text-xs font-medium flex items-center gap-1.5 hover:bg-background transition-colors"
                      >
                        <Upload size={13} />
                        {isAr ? 'استبدال' : 'Replace'}
                      </button>
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2.5 py-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-border/40 bg-muted/5 hover:border-primary/40 hover:bg-muted/10'
                  }`}
                >
                  {uploading ? (
                    <Loader2 size={22} className="animate-spin text-primary" />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ImagePlus size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {isAr ? 'ارفع صورتك' : 'Upload your image'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      JPG / PNG / WebP · {isAr ? 'الحد الأقصى 10MB' : 'Max 10MB'}
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Generate */}
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20"
              onClick={handleGenerate}
              disabled={generating || !uploadedImage}
            >
              {generating ? (
                <><Loader2 size={18} className="animate-spin" /> {isAr ? 'جارِ التوليد...' : 'Generating...'}</>
              ) : (
                <><Sparkles size={18} /> {isAr ? 'إنشاء الآن' : 'Generate Now'}</>
              )}
            </Button>

            {!uploadedImage && (
              <p className="text-xs text-muted-foreground/70 text-center md:text-start">
                {isAr ? 'ارفع صورة للمتابعة' : 'Upload an image to continue'}
              </p>
            )}

            <p className="text-[11px] text-muted-foreground/50 text-center md:text-start">
              {isAr ? '٢ رصيد لكل توليد' : '2 credits per generation'}
            </p>
          </div>

          {/* RIGHT column — Preview Image */}
          <div className="flex-1 order-1 md:order-2">
            <div className="rounded-2xl overflow-hidden shadow-xl shadow-black/10">
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
