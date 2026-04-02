import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Edit3, Share2, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const GenerateResult = () => {
  const navigate = useNavigate();
  const { generatedImages, isGenerating, prompt, generate, setPrompt } = useApp();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [showImage, setShowImage] = useState(false);
  const latestImage = generatedImages[0];

  useEffect(() => {
    if (latestImage && !isGenerating) {
      const t = setTimeout(() => setShowImage(true), 300);
      return () => clearTimeout(t);
    }
  }, [latestImage, isGenerating]);

  // If user lands here with no generation in progress and no image, redirect
  useEffect(() => {
    if (!isGenerating && !latestImage) {
      const t = setTimeout(() => navigate('/'), 100);
      return () => clearTimeout(t);
    }
  }, [isGenerating, latestImage, navigate]);

  const handleDownload = async () => {
    if (!latestImage?.url) return;
    try {
      const res = await fetch(latestImage.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `takhayal-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(isAr ? 'تم التحميل' : 'Downloaded!');
    } catch {
      toast.error(isAr ? 'فشل التحميل' : 'Download failed');
    }
  };

  const handleRegenerate = () => {
    setShowImage(false);
    generate();
  };

  const handleEditPrompt = () => {
    navigate('/studio');
  };

  const handleShare = async () => {
    if (!latestImage?.url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Takhayal Studio', url: latestImage.url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(latestImage.url);
      toast.success(isAr ? 'تم النسخ' : 'Link copied!');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background animate-page-enter">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-[15px] font-semibold text-foreground">
          {isAr ? 'النتيجة' : 'Your Result'}
        </h1>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5">
        {/* Prompt echo */}
        {prompt && (
          <p className="text-[13px] text-muted-foreground text-center max-w-sm line-clamp-2 px-2">
            "{prompt}"
          </p>
        )}

        {/* Image area */}
        <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden relative bg-muted/30 border border-border/20">
          {(isGenerating || !showImage) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Skeleton className="absolute inset-0 rounded-2xl" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <Loader2 size={28} className="text-primary animate-spin" />
                <span className="text-[13px] font-medium text-muted-foreground">
                  {isAr ? 'جاري إنشاء صورتك...' : 'Creating your image...'}
                </span>
              </div>
            </div>
          ) : latestImage ? (
            <img
              src={latestImage.url}
              alt={latestImage.prompt}
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : null}
        </div>

        {/* Action buttons */}
        {showImage && latestImage && (
          <div className="w-full max-w-md flex flex-col gap-2.5 animate-fade-in">
            {/* Primary */}
            <button
              onClick={handleDownload}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_4px_20px_-4px] shadow-primary/25"
            >
              <Download size={16} />
              {isAr ? 'تحميل' : 'Download'}
            </button>

            {/* Secondary row */}
            <div className="flex gap-2.5">
              <button
                onClick={handleRegenerate}
                className="flex-1 h-11 rounded-xl bg-muted/50 border border-border/30 text-foreground font-medium text-[13px] flex items-center justify-center gap-1.5 hover:bg-muted transition-colors active:scale-[0.98]"
              >
                <RefreshCw size={14} />
                {isAr ? 'إعادة' : 'Regenerate'}
              </button>
              <button
                onClick={handleEditPrompt}
                className="flex-1 h-11 rounded-xl bg-muted/50 border border-border/30 text-foreground font-medium text-[13px] flex items-center justify-center gap-1.5 hover:bg-muted transition-colors active:scale-[0.98]"
              >
                <Edit3 size={14} />
                {isAr ? 'تعديل' : 'Edit Prompt'}
              </button>
              <button
                onClick={handleShare}
                className="w-11 h-11 rounded-xl bg-muted/50 border border-border/30 text-foreground flex items-center justify-center hover:bg-muted transition-colors active:scale-[0.98]"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateResult;
