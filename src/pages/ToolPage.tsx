import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Upload, X } from 'lucide-react';
import { BackToImageTools } from '@/components/tools/BackToImageTools';
import { ToolPreviewImage } from '@/components/tools/ToolPreviewImage';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useToolProviders } from '@/hooks/useToolProviders';
import { ToolProviderSelector } from '@/components/tools/ToolProviderSelector';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toDateOnly } from '@/lib/seo-helpers';
import { GenerateButton, imageSizeError, isOversizedImage } from '@/lib/ux';

const TOOL_OPTIONS: Record<string, Array<{ label: string; values: string[]; defaultValue: string }>> = {
  generate: [{ label: 'Ratio', values: ['1:1', '9:16', '16:9', '4:5'], defaultValue: '1:1' }],
  logo: [
    { label: 'Style', values: ['Minimal', 'Modern', 'Geometric', 'Playful'], defaultValue: 'Minimal' },
    { label: 'Type', values: ['Icon', 'Wordmark', 'Combination'], defaultValue: 'Icon' },
  ],
  enhance: [{ label: 'Mode', values: ['General', 'Portrait', 'Landscape', 'Product'], defaultValue: 'General' }],
};
const EMPTY_TOOL_OPTIONS: Array<{ label: string; values: string[]; defaultValue: string }> = [];

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { requireAuth } = useApp();
  const { t, isRTL } = useLanguage();
  const { tools } = useToolsDB();
  const { createJob } = useGenerationJobs();

  const tool = tools.find(t => t.slug === toolId || t.id === toolId);
  const { activeProviders, defaultProvider } = useToolProviders(tool?.id);

  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultProvider && !selectedProviderId) setSelectedProviderId(defaultProvider.id);
  }, [defaultProvider, selectedProviderId]);

  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl');
    if (!imageUrl || previewUrl === imageUrl) return;
    setPreviewUrl(imageUrl);
    setSelectedFile(null);
  }, [searchParams, previewUrl]);

  const selectedProvider = activeProviders.find(p => p.id === selectedProviderId) || defaultProvider;

  const currentOptions = TOOL_OPTIONS[tool?.slug || ''] || EMPTY_TOOL_OPTIONS;

  useEffect(() => {
    if (currentOptions.length > 0) {
      const defaults: Record<string, string> = {};
      currentOptions.forEach(o => { defaults[o.label] = o.defaultValue; });
      setSelectedOptions(defaults);
    }
  }, [currentOptions]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isOversizedImage(file)) {
      toast.error(imageSizeError(isRTL));
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (isOversizedImage(file)) {
      toast.error(imageSizeError(isRTL));
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('You must be logged in');
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${authUser.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('tool-files').upload(path, file);
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
    const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(path);
    return urlData.publicUrl;
  }, []);

  const handleRun = () => {
    requireAuth(async () => {
      if (submitting) return;
      setSubmitting(true);

      try {
        // 1. Upload image if needed
        let imageUrl: string | null = null;
        if (selectedFile) {
          imageUrl = await uploadImage(selectedFile);
        } else if (previewUrl && previewUrl.startsWith('http')) {
          imageUrl = previewUrl;
        }

        // 2. Create generation_logs record (queued)
        const creditCost = selectedProvider?.credit_cost ?? tool!.creditCost;
        const promptText = inputValue || tool!.name || tool!.slug;

        const jobId = await createJob({
          prompt: promptText.slice(0, 500),
          ratio: selectedOptions['Ratio'] || '1:1',
          qualityTier: '1K',
          modelId: null,
          creditCost,
          sourceTag: `tool:${tool!.slug}`,
        });

        if (!jobId) {
          throw new Error('Failed to create job');
        }

        // 3. Fire-and-forget: invoke run-tool with job_id
        supabase.functions.invoke('run-tool', {
          body: {
            tool_slug: tool!.slug,
            prompt: inputValue || null,
            image_url: imageUrl,
            options: {
              ...selectedOptions,
              provider_endpoint: selectedProvider?.provider_endpoint,
              ratio: selectedOptions['Ratio'],
            },
            job_id: jobId,
          },
        }).catch(err => {
          console.error('run-tool invoke error:', err);
        });

        // 4. Redirect to gallery immediately
        toast.success(isRTL ? 'تم إرسال المهمة' : 'Job submitted — check Gallery');
        navigate('/gallery');

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    });
  };

  /* ── Not found ── */
  if (!tool) {
    return (
      <div className="pt-16 flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-light text-foreground mb-2">{t.toolPage.toolNotFound}</h1>
          <button onClick={() => navigate('/tools')} className="min-h-11 text-primary text-sm hover:underline">{t.toolPage.backToHome}</button>
        </div>
      </div>
    );
  }

  const Icon = tool.icon;
  const isUpload = tool.inputType === 'upload';
  const canRun = isUpload ? !!previewUrl && !submitting : inputValue.trim().length > 0 && !submitting;
  const creditCost = selectedProvider?.credit_cost ?? tool.creditCost;
  const uploadInputId = `tool-upload-${tool.slug}`;
  const promptInputId = `tool-prompt-${tool.slug}`;
  const dateModified = toDateOnly(tool.updatedAt);
  const updatedLabel = dateModified
    ? new Intl.DateTimeFormat(isRTL ? 'ar-KW' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(dateModified))
    : null;
  const seoDescription = tool.description || tool.shortDesc;
  const hasCondensedDetail = tool.slug === 'upscale' || tool.slug === 'logo' || tool.slug === 'remove-bg';
  const shouldMatchPreviewHeight = tool.slug === 'remove-bg';
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: isRTL ? `ماذا تفعل أداة ${tool.name}؟` : `What does the ${tool.name} tool do?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: seoDescription,
        },
      },
      {
        '@type': 'Question',
        name: isRTL ? 'متى أستخدم هذه الأداة؟' : 'When should I use this tool?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isUpload
            ? (isRTL ? 'استخدمها عندما تبدأ من صورة موجودة وتريد تحسينها أو تعديلها أو تنظيفها.' : 'Use it when you are starting from an existing image and want to improve, edit, or clean it.')
            : (isRTL ? 'استخدمها عندما تريد بدء الإنشاء من وصف أو إعدادات محددة.' : 'Use it when you want to generate a new asset from a prompt or predefined options.'),
        },
      },
      {
        '@type': 'Question',
        name: isRTL ? 'ما تكلفة التشغيل؟' : 'What does it cost to run?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isRTL ? `تبدأ تكلفة التشغيل من ${creditCost} رصيد لكل مهمة حسب المزود والجودة.` : `Runs start from ${creditCost} credits per job depending on provider and quality.`,
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
        name: isRTL ? 'الأدوات' : 'Tools',
        item: absoluteUrl('/tools'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tool.name,
        item: absoluteUrl(`/tools/${tool.slug}`),
      },
    ],
  };
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: seoDescription,
    url: absoluteUrl(`/tools/${tool.slug}`),
    image: tool.image,
    applicationCategory: isUpload ? 'GraphicsApplication' : 'DesignApplication',
    operatingSystem: 'Web',
    inLanguage: isRTL ? 'ar' : 'en',
    ...(dateModified ? { dateModified } : {}),
  };
  const facts = [
    {
      label: isRTL ? 'نوع الإدخال' : 'Input type',
      value: isUpload ? (isRTL ? 'صورة مرفوعة' : 'Uploaded image') : (isRTL ? 'برومبت أو وصف' : 'Prompt or text'),
    },
    {
      label: isRTL ? 'التكلفة الابتدائية' : 'Starting cost',
      value: isRTL ? `${creditCost} رصيد` : `${creditCost} credits`,
    },
    {
      label: isRTL ? 'المزود' : 'Provider',
      value: selectedProvider?.display_name || tool.providerName || 'Takhayal.ai',
    },
  ];
  const faqs = [
    {
      q: isRTL ? `ماذا تفعل أداة ${tool.name}؟` : `What does the ${tool.name} tool do?`,
      a: seoDescription,
    },
    {
      q: isRTL ? 'متى أستخدم هذه الأداة؟' : 'When should I use this tool?',
      a: isUpload
        ? (isRTL ? 'استخدمها للبدء من صورة موجودة عبر مسار مخصص أسرع وأكثر اتساقاً.' : 'Use it when you are starting from an existing image and want a faster, more consistent result from a dedicated workflow.')
        : (isRTL ? 'استخدمها لإنشاء أصل جديد أو تشغيل مهمة إبداعية مباشرة من وصفك.' : 'Use it when you want to create a new asset or run a creative task directly from your prompt.'),
    },
    {
      q: isRTL ? 'كيف أبدأ؟' : 'How do I get started?',
      a: isUpload
        ? (isRTL ? 'ارفع الصورة، اضبط الخيارات، ثم شغّل الأداة.' : 'Upload the image, choose any relevant options, then run the tool.')
        : (isRTL ? 'اكتب الوصف، اضبط الخيارات، ثم شغّل الأداة.' : 'Write the prompt, adjust any relevant options, then run the tool.'),
    },
  ];

  return (
    <div className="flex-1 animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <PageSeo
        title={`${tool.name} | Takhayal.ai`}
        description={seoDescription}
        canonicalPath={`/tools/${tool.slug}`}
        image={tool.image}
        pageType="WebPage"
        dateModified={dateModified}
        schemas={[breadcrumbSchema, softwareSchema, ...(!hasCondensedDetail ? [faqSchema] : [])]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* Back to Image Tools */}
        <BackToImageTools />

        {/* ══════ 2-Column Desktop / Stacked Mobile ══════ */}
        <div className={`flex flex-col lg:flex-row gap-6 lg:gap-10 ${shouldMatchPreviewHeight ? 'lg:items-stretch' : ''}`}>

          {/* ── LEFT: Form Panel ── */}
          <div className={`w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 ${shouldMatchPreviewHeight ? 'lg:self-stretch' : ''}`}>
            <div className={`rounded-2xl bg-card border border-border/50 p-5 sm:p-7 ${shouldMatchPreviewHeight ? 'h-full flex flex-col gap-5' : 'space-y-5'}`}>

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <h1 className="typo-heading-card">{tool.name}</h1>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{tool.shortDesc || tool.description}</p>
                </div>
              </div>

              {/* Upload or Prompt */}
              {isUpload ? (
                <div className={shouldMatchPreviewHeight ? 'lg:flex-1 lg:flex lg:items-center' : undefined}>
                  {previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-muted/10">
                      <img src={previewUrl} alt={isRTL ? `معاينة ${tool.name}` : `${tool.name} preview`} className="w-full rounded-xl object-contain max-h-[280px]" />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute top-3 right-3 min-h-11 min-w-11 rounded-full bg-background/90 text-foreground flex items-center justify-center hover:bg-background transition-colors cursor-pointer shadow-sm"
                        aria-label={isRTL ? 'إزالة الصورة المرفوعة' : 'Remove uploaded image'}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={e => e.preventDefault()}
                      className="w-full rounded-xl border border-dashed border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/15 transition-all cursor-pointer group"
                      aria-label={t.toolPage.dropImage}
                    >
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                          <Upload size={20} className="text-primary" />
                        </div>
                        <span className="text-[14px] font-medium text-foreground mb-1">{t.toolPage.dropImage}</span>
                        <span className="text-[12px] text-muted-foreground">{t.toolPage.fileTypes}</span>
                      </div>
                    </button>
                  )}
                  <input id={uploadInputId} ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" aria-label={t.toolPage.dropImage} />
                </div>
              ) : (
                <textarea
                  id={promptInputId}
                  aria-label={t.toolPage.describePrompt}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={t.toolPage.describePrompt}
                  className="w-full h-28 bg-muted/10 border border-border/40 rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 focus:bg-muted/15 transition-all"
                />
              )}

              {/* Provider selector */}
              {activeProviders.length > 1 && tool.slug !== 'generate' && tool.slug !== 'remove-bg' && (
                <ToolProviderSelector
                  providers={activeProviders}
                  selected={selectedProviderId}
                  onSelect={setSelectedProviderId}
                />
              )}

              {/* Options */}
              {currentOptions.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {currentOptions.map(opt => {
                    const optionId = `tool-option-${tool.slug}-${opt.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                    return (
                    <div key={opt.label} className="flex-1 min-w-[120px]">
                      <label htmlFor={optionId} className="text-[11px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">{opt.label}</label>
                      <select
                        id={optionId}
                        value={selectedOptions[opt.label] || opt.defaultValue}
                        onChange={e => setSelectedOptions(prev => ({ ...prev, [opt.label]: e.target.value }))}
                        className="w-full min-h-11 bg-muted/10 border border-border/40 rounded-xl px-3 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                      >
                        {opt.values.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    );
                  })}
                </div>
              )}

              {/* CTA Button */}
              <div className={shouldMatchPreviewHeight ? 'lg:mt-auto' : undefined}>
                <GenerateButton
                  onClick={handleRun}
                  disabled={!canRun}
                  loading={submitting}
                  loadingLabel={t.toolPage.submitting}
                  credits={creditCost}
                >
                  {isUpload ? (tool.slug === 'upscale' ? t.toolPage.enhance : t.toolPage.uploadProcess) : t.toolPage.generate}
                </GenerateButton>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Preview Panel (desktop only) ── */}
          <div className="flex-1 min-w-0">
            <div className="lg:sticky lg:top-24">
              <ToolPreviewImage
                src={tool.image}
                alt={tool.name}
                title={tool.heroTitle}
                subtitle={tool.heroSubtitle}
              />
            </div>
          </div>
        </div>

        {!hasCondensedDetail && (
          <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl bg-card border border-border/40 p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{fact.label}</p>
                <p className="text-[15px] font-semibold mt-2">{fact.value}</p>
              </div>
            ))}
          </section>
        )}

        <section className={`mt-8 ${hasCondensedDetail ? '' : 'grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6'}`}>
          <div className="rounded-2xl bg-card border border-border/40 p-6">
            <h2 className="text-xl font-bold">{isRTL ? `ماذا تفعل ${tool.name}؟` : `What does ${tool.name} do?`}</h2>
            <p className="text-sm text-muted-foreground leading-7 mt-3">{seoDescription}</p>
            <p className="text-sm text-muted-foreground leading-7 mt-3">
              {isUpload
                ? (isRTL ? 'مسار مناسب لمن يريد معالجة صورة موجودة بدون التنقل بين أدوات متعددة.' : 'This workflow is built for teams that want to process an existing image without jumping between multiple tools.')
                : (isRTL ? 'مسار مناسب للانتقال من الفكرة إلى أصل جديد بسرعة داخل تخيّل.' : 'This workflow is a good fit when you want to move from idea to new asset quickly inside Takhayal.')}
            </p>
          </div>

          {!hasCondensedDetail && (
            <div className="rounded-2xl bg-card border border-border/40 p-6">
              <h2 className="text-xl font-bold">{isRTL ? 'معلومات التشغيل' : 'Run details'}</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>{isUpload ? (isRTL ? 'يبدأ من صورة يرفعها المستخدم.' : 'Starts from a user-uploaded image.') : (isRTL ? 'يبدأ من وصف أو إعدادات يحددها المستخدم.' : 'Starts from a user-provided prompt or options.')}</li>
                <li>{isRTL ? `تكلفة التشغيل تبدأ من ${creditCost} رصيد.` : `Runs start from ${creditCost} credits.`}</li>
                <li>{updatedLabel ? (isRTL ? `آخر تحديث: ${updatedLabel}.` : `Last updated: ${updatedLabel}.`) : null}</li>
              </ul>
            </div>
          )}
        </section>

        {!hasCondensedDetail && (
          <section className="mt-8 rounded-2xl bg-card border border-border/40 p-6">
            <h2 className="text-xl font-bold">{isRTL ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2>
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
        )}
      </div>

      {/* Bottom safe spacing for mobile nav */}
      <div className="h-24 lg:h-0" />
    </div>
  );
}
