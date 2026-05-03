import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { Loader2, Upload, X, ArrowLeft, ImagePlus, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { buildTemplatePath, extractTemplateId, toDateOnly } from '@/lib/seo-helpers';
import { localizePath, stripLocalePrefix } from '@/lib/localized-routes';
import { GenerateButton, imageSizeError, isOversizedImage } from '@/lib/ux';
import { Button } from '@/components/ui/button';

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
  updated_at: string;
  before_image_url?: string | null;
  after_image_url?: string | null;
  example_caption_en?: string | null;
  example_caption_ar?: string | null;
  best_results_en?: string | null;
  best_results_ar?: string | null;
  input_requirements_en?: string | null;
  input_requirements_ar?: string | null;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function TemplateDetail() {
  const { templateKey } = useParams<{ templateKey: string }>();
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const { openAuthModal } = useApp();
  const { submitJob } = useGenerationJobs();
  const isAr = lang === 'ar';
  const templateId = extractTemplateId(templateKey);

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!templateId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setTemplate(null);
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .eq('active', true)
        .maybeSingle();
      if (error) {
        console.error('Failed to load template', error);
      }
      if (!cancelled) {
        if (data) setTemplate(data as any);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  useEffect(() => {
    if (!template || !templateKey) return;
    const nextCanonicalPath = buildTemplatePath(
      template.id,
      template.title_en || template.title_ar || 'template'
    );
    const expectedKey = nextCanonicalPath.replace('/templates/', '');
    const currentKey = stripLocalePrefix(window.location.pathname).replace('/templates/', '');
    if (templateKey !== expectedKey || currentKey !== expectedKey) {
      navigate(localizePath(nextCanonicalPath, lang), { replace: true });
    }
  }, [lang, navigate, template, templateKey]);

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: isAr ? 'ملف غير صالح' : 'Invalid file', description: isAr ? 'JPG أو PNG أو WebP فقط' : 'JPG, PNG, or WebP only', variant: 'destructive' });
      return;
    }
    if (isOversizedImage(file)) {
      toast({ title: imageSizeError(isAr), variant: 'destructive' });
      return;
    }
    setPendingFile(file);
    const localPreview = URL.createObjectURL(file);
    setUploadedImage(localPreview);

    if (!user) return;

    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('tool-files')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });
    if (error) {
      toast({ title: isAr ? 'فشل الرفع' : 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(data.path);
    setUploadedImage(urlData.publicUrl);
    setPendingFile(null);
    setUploading(false);
  }, [isAr, user]);

  const uploadTemplateImage = useCallback(async (file: File) => {
    if (!user) throw new Error('You must be logged in');
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('tool-files')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(data.path);
    return urlData.publicUrl;
  }, [user]);

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
    let imageUrl = uploadedImage;
    if (pendingFile) {
      try {
        imageUrl = await uploadTemplateImage(pendingFile);
        setUploadedImage(imageUrl);
        setPendingFile(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : undefined;
        toast({ title: isAr ? 'فشل الرفع' : 'Upload failed', description: message, variant: 'destructive' });
        setGenerating(false);
        return;
      }
    }
    const generationPrompt = template.prompt;
    const ratio = template.ratio || '1:1';

    const jobId = await submitJob({
      prompt: generationPrompt,
      ratio,
      qualityTier: '1K',
      modelId: resolvedModelId,
      creditCost: 2,
      sourceTag: `template:${template.id}`,
      imageUrl: imageUrl || undefined,
    });

    if (!jobId) {
      toast({ title: isAr ? 'حدث خطأ' : 'Error', description: isAr ? 'فشل في بدء التوليد' : 'Failed to start generation', variant: 'destructive' });
      setGenerating(false);
      return;
    }

    navigate(`/gallery?highlight=${jobId}`);
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
  const canonicalPath = buildTemplatePath(template.id, template.title_en || title);
  const dateModified = toDateOnly(template.updated_at);
  const updatedLabel = dateModified
    ? new Intl.DateTimeFormat(isAr ? 'ar-KW' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(dateModified))
    : null;
  const seoDescription = isAr
    ? `${title} قالب جاهز داخل تخيّل لفئة ${template.category || 'إبداعية'} وبنسبة ${template.ratio || '1:1'} لتسريع إنتاج الصور والحملات العربية.`
    : `${title} is a ready-made Takhayal template for ${template.category || 'creative'} work in ${template.ratio || '1:1'} format, built to speed up image production.`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: isAr ? `ما استخدام قالب ${title}؟` : `What is the ${title} template used for?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: isAr
            ? `${title} قالب جاهز لتسريع إنتاج محتوى ${template.category || 'إبداعي'} داخل تخيّل باستخدام صورة مرجعية ونسبة ${template.ratio || '1:1'}.`
            : `${title} is a ready-made template for faster ${template.category || 'creative'} production in Takhayal using a reference image and a ${template.ratio || '1:1'} ratio.`,
        },
      },
      {
        '@type': 'Question',
        name: isAr ? 'هل أحتاج إلى صورة مرجعية؟' : 'Do I need a reference image?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isAr
            ? 'نعم. هذا المسار يبدأ من رفع صورة مرجعية ثم يطبّق القالب لتوليد نتيجة أسرع وأكثر اتساقاً.'
            : 'Yes. This flow starts with a reference upload, then applies the template to generate a faster, more consistent result.',
        },
      },
      {
        '@type': 'Question',
        name: isAr ? 'ما نسبة الأبعاد المستخدمة؟' : 'What aspect ratio does it use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isAr
            ? `القالب يستخدم نسبة ${template.ratio || '1:1'} افتراضياً.`
            : `The template uses a default ${template.ratio || '1:1'} aspect ratio.`,
        },
      },
    ],
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isAr ? 'القوالب' : 'Templates',
        item: absoluteUrl('/templates'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: absoluteUrl(canonicalPath),
      },
    ],
  };
  const creativeWorkSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description: seoDescription,
    url: absoluteUrl(canonicalPath),
    image: template.cover_image_url,
    genre: template.category,
    keywords: [template.category, template.ratio, 'AI template', 'Takhayal.ai'],
    inLanguage: isAr ? 'ar' : 'en',
    ...(dateModified ? { dateModified } : {}),
  };

  const bestResultsNote = isAr
    ? template.best_results_ar || 'استخدم صورة واضحة بإضاءة جيدة وخلفية غير مزدحمة للحصول على نتيجة أدق.'
    : template.best_results_en || 'Use a clear photo with good lighting and a simple background for the best result.';
  const inputRequirementsNote = isAr
    ? template.input_requirements_ar || 'تجنب الصور الضبابية أو المقتصة بشدة أو التي تحتوي على عناصر كثيرة تحجب الهدف الأساسي.'
    : template.input_requirements_en || 'Avoid blurry, heavily cropped, or overly busy images that hide the main subject.';
  const exampleCaption = isAr
    ? template.example_caption_ar || 'مثال على التحويل المتوقع من الصورة الأصلية إلى النتيجة النهائية.'
    : template.example_caption_en || 'A quick preview of the expected transformation from input to final output.';
  const faqs = [
    {
      q: isAr ? `ما الذي يقدمه قالب ${title}؟` : `What does the ${title} template do?`,
      a: isAr
        ? `${title} يختصر وقت البدء من الصفر ويعطيك اتجاهاً بصرياً جاهزاً لإنتاج محتوى ${template.category || 'إبداعي'} أسرع.`
        : `${title} reduces setup time and gives you a ready visual direction for faster ${template.category || 'creative'} production.`,
    },
    {
      q: isAr ? 'متى أستخدم هذا القالب؟' : 'When should I use this template?',
      a: isAr
        ? 'استخدمه عندما يكون لديك صورة مرجعية وتريد نتيجة أسرع وأكثر اتساقاً للحملات أو المحتوى الاجتماعي أو صور المنتجات.'
        : 'Use it when you already have a reference image and want a faster, more consistent result for campaigns, social posts, or product visuals.',
    },
    {
      q: isAr ? 'هل أستطيع تعديل النتيجة لاحقاً؟' : 'Can I refine the result later?',
      a: isAr
        ? 'نعم. القالب يسرّع نقطة البداية، وبعد التوليد يمكنك متابعة العمل داخل بقية مسارات تخيّل.'
        : 'Yes. The template accelerates the starting point, and you can continue refining the output in the rest of the Takhayal workflow.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <PageSeo
        title={`${title} | Takhayal.ai`}
        description={seoDescription}
        canonicalPath={canonicalPath}
        image={template.cover_image_url}
        pageType="WebPage"
        dateModified={dateModified}
        schemas={[breadcrumbSchema, creativeWorkSchema, faqSchema]}
      />
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
              <span className="mb-3 inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                {template.category || (isAr ? 'قالب' : 'Template')}
              </span>
              <h1 className="typo-heading-page leading-tight">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {isAr ? 'ارفع صورتك وسنتكفل بالباقي' : "Upload your image and we'll handle the rest"}
              </p>
              {updatedLabel && (
                <p className="text-[11px] text-muted-foreground/70 mt-2">
                  {isAr ? `آخر تحديث: ${updatedLabel}` : `Last updated: ${updatedLabel}`}
                </p>
              )}
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
                        onClick={() => { setUploadedImage(null); setPendingFile(null); }}
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
                  className={`flex flex-col items-center justify-center gap-3 py-10 rounded-2xl cursor-pointer transition-all ${
                    dragOver
                      ? 'bg-primary/10 ring-2 ring-primary/40'
                      : 'bg-muted/10 hover:bg-muted/15'
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
            <GenerateButton
              onClick={handleGenerate}
              disabled={generating || !uploadedImage}
              loading={generating}
              loadingLabel={isAr ? 'جارِ التوليد...' : 'Generating...'}
              credits={2}
            >
              {isAr ? 'إنشاء الآن' : 'Generate Now'}
            </GenerateButton>

            {!uploadedImage && (
              <p className="text-xs text-muted-foreground/70 text-center md:text-start">
                {isAr ? 'ارفع صورة للمتابعة' : 'Upload an image to continue'}
              </p>
            )}

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

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
            <h2 className="text-xl font-bold">
              {isAr ? `ما استخدام قالب ${title}؟` : `What is the ${title} template for?`}
            </h2>
            <p className="text-sm text-muted-foreground leading-7 mt-3">
              {isAr
                ? `${title} هو قالب جاهز داخل تخيّل يسرّع إنتاج محتوى ${template.category || 'إبداعي'} عندما تريد الانطلاق من صورة مرجعية بدلاً من البدء من الصفر.`
                : `${title} is a ready-made Takhayal template that speeds up ${template.category || 'creative'} production when you want to start from a reference image instead of starting from scratch.`}
            </p>
            <p className="text-sm text-muted-foreground leading-7 mt-3">
              {isAr
                ? `هذا القالب مناسب عندما تريد نتيجة أسرع وأكثر اتساقاً بنسبة ${template.ratio || '1:1'} مع تكلفة واضحة قبل التشغيل.`
                : `It is a good fit when you want a faster, more consistent output in ${template.ratio || '1:1'} format with a clear cost before generation.`}
            </p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
            <h2 className="text-xl font-bold">{isAr ? 'كيف تستخدمه' : 'How to use it'}</h2>
            <div className="mt-4 grid gap-3">
              {[
                isAr ? 'ارفع صورة مرجعية مناسبة للمشهد أو المنتج.' : 'Upload a reference image that matches the scene or product.',
                isAr ? 'شغّل القالب لتطبيق الاتجاه البصري الجاهز.' : 'Run the template to apply the prebuilt visual direction.',
                isAr ? 'تابع التعديل أو التوليد الإضافي داخل تخيّل عند الحاجة.' : 'Continue refining or generating inside Takhayal if needed.',
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-xl bg-background/50 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                  <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
            <h2 className="text-xl font-bold">{isAr ? 'قبل وبعد' : 'Before and after'}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{exampleCaption}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: isAr ? 'قبل' : 'Before', src: template.before_image_url || template.cover_image_url },
                { label: isAr ? 'بعد' : 'After', src: template.after_image_url || template.cover_image_url },
              ].map(item => (
                <div key={item.label} className="overflow-hidden rounded-xl bg-muted/20">
                  <div className="aspect-square">
                    <img src={item.src} alt={item.label} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
            <h2 className="text-xl font-bold">{isAr ? 'أفضل النتائج' : 'Best results'}</h2>
            <div className="mt-4 space-y-3">
              {[bestResultsNote, inputRequirementsNote].map(note => (
                <div key={note} className="flex gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-muted-foreground">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-border/40 bg-card/50 p-6">
          <h2 className="text-xl font-bold">{isAr ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2>
          <Accordion type="single" collapsible className="mt-4">
            {faqs.map((item, index) => (
              <AccordionItem key={item.q} value={`faq-${index}`}>
                <AccordionTrigger className="text-start font-medium">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-7">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}
