import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Upload, X } from 'lucide-react';
import { BackToImageTools } from '@/components/tools/BackToImageTools';
import { ToolPreviewImage } from '@/components/tools/ToolPreviewImage';
import { useState, useRef, useCallback } from 'react';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toDateOnly } from '@/lib/seo-helpers';
import { GenerateButton, imageSizeError, isOversizedImage } from '@/lib/ux';

export default function GuidedToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { t, isRTL, lang } = useLanguage();
  const { tools } = useToolsDB();
  const { requireAuth, openUpgradeModal, credits } = useApp();
  const { submitJob } = useGenerationJobs();

  const tool = tools.find(t => t.slug === toolId || t.id === toolId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleGenerate = () => {
    requireAuth(async () => {
      if (submitting || !selectedFile || !tool) return;

      const creditCost = tool.creditCost;
      if (credits < creditCost) {
        openUpgradeModal();
        return;
      }

      setSubmitting(true);
      try {
        // Upload image
        const imageUrl = await uploadImage(selectedFile);

        // Use hidden prompt
        const prompt = lang === 'ar' && tool.defaultPromptAr
          ? tool.defaultPromptAr
          : tool.defaultPromptEn;

        // Submit via existing generation pipeline
        const jobId = await submitJob({
          prompt: prompt || tool.name,
          ratio: '1:1',
          qualityTier: '1K',
          modelId: tool.selectedModelId,
          creditCost,
          sourceTag: `tool:${tool.slug}`,
          imageUrl,
        });

        if (!jobId) throw new Error('Failed to create job');

        toast.success(isRTL ? 'تم إرسال المهمة' : 'Processing — check Gallery');
        navigate('/gallery');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    });
  };

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

  const canRun = !!selectedFile && !submitting;
  const uploadInputId = `guided-tool-upload-${tool.slug}`;
  const dateModified = toDateOnly(tool.updatedAt);
  const seoDescription = tool.description || tool.shortDesc;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: isRTL ? `ما الذي تفعله أداة ${tool.name}؟` : `What does the ${tool.name} tool do?`,
        acceptedAnswer: { '@type': 'Answer', text: seoDescription },
      },
      {
        '@type': 'Question',
        name: isRTL ? 'هل أحتاج إلى رفع صورة؟' : 'Do I need to upload an image?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isRTL ? 'نعم. هذا المسار يعتمد على صورة مرجعية يرفعها المستخدم.' : 'Yes. This workflow depends on a user-uploaded reference image.',
        },
      },
    ],
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isRTL ? 'الأدوات' : 'Tools', item: absoluteUrl('/tools') },
      { '@type': 'ListItem', position: 2, name: tool.name, item: absoluteUrl(`/tools/${tool.slug}`) },
    ],
  };
  const faqs = [
    {
      q: isRTL ? `ما استخدام ${tool.name}؟` : `What is ${tool.name} used for?`,
      a: seoDescription,
    },
    {
      q: isRTL ? 'كيف أبدأ؟' : 'How do I start?',
      a: isRTL ? 'ارفع الصورة المرجعية ثم شغّل الأداة لبدء المعالجة.' : 'Upload the reference image, then run the tool to start processing.',
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
        schemas={[breadcrumbSchema, faqSchema]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Back to Image Tools */}
        <BackToImageTools />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* LEFT: Form Panel */}
          <div className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0">
            <div className="rounded-2xl bg-card border border-border/50 p-5 sm:p-7 space-y-5">
              {/* Header */}
              <div>
                <h1 className="typo-heading-card text-2xl font-bold">{tool.name}</h1>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{tool.shortDesc || tool.description}</p>
              </div>

              {tool.description && tool.description !== tool.shortDesc && (
                <p className="text-[13px] text-foreground/70 leading-relaxed">{tool.description}</p>
              )}

              {/* Upload */}
              <div>
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
                    aria-label={tool.uploadLabel}
                  >
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                        <Upload size={20} className="text-primary" />
                      </div>
                      <span className="text-[14px] font-medium text-foreground mb-1">{tool.uploadLabel}</span>
                      <span className="text-[12px] text-muted-foreground">{tool.uploadHelper}</span>
                    </div>
                  </button>
                )}
                <input id={uploadInputId} ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" aria-label={tool.uploadLabel} />
              </div>

              {/* CTA Button */}
              <GenerateButton
                type="button"
                onClick={handleGenerate}
                disabled={!canRun}
                loading={submitting}
                loadingLabel={t.toolPage.submitting}
                credits={tool.creditCost}
              >
                {tool.ctaLabel}
              </GenerateButton>
            </div>
          </div>

          {/* RIGHT: Preview Panel */}
          <div className="flex-1 min-w-0">
            <div className="lg:sticky lg:top-24">
              <ToolPreviewImage
                src={tool.image}
                alt={tool.name}
                title={tool.heroTitle || tool.name}
                subtitle={tool.heroSubtitle || tool.shortDesc}
              />
            </div>
          </div>
        </div>

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
      </div>
      <div className="h-24 lg:h-0" />
    </div>
  );
}
