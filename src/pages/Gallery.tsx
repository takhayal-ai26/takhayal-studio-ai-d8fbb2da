import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw, Image as ImageIcon, ArrowRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useGenerationJobs, GenerationJob } from '@/hooks/useGenerationJobs';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

function groupByDate(jobs: GenerationJob[]): { label: string; labelAr: string; items: GenerationJob[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const groups: { label: string; labelAr: string; items: GenerationJob[] }[] = [
    { label: 'Today', labelAr: 'اليوم', items: [] },
    { label: 'Yesterday', labelAr: 'أمس', items: [] },
    { label: 'Older', labelAr: 'سابقاً', items: [] },
  ];

  for (const job of jobs) {
    const d = new Date(job.created_at);
    if (d >= today) groups[0].items.push(job);
    else if (d >= yesterday) groups[1].items.push(job);
    else groups[2].items.push(job);
  }

  return groups.filter(g => g.items.length > 0);
}

function GalleryCard({ job, isAr, onRetry, onReuse }: {
  job: GenerationJob;
  isAr: boolean;
  onRetry: (id: string) => void;
  onReuse: (prompt: string) => void;
}) {
  const isProcessing = job.status === 'processing';
  const isFailed = job.status === 'failed';

  const handleDownload = () => {
    if (!job.image_url) return;
    const a = document.createElement('a');
    a.href = job.image_url;
    a.download = `takhayal-${job.id}.png`;
    a.target = '_blank';
    a.click();
  };

  if (isProcessing) {
    return (
      <div className="break-inside-avoid mb-3 rounded-2xl overflow-hidden bg-card/60 border border-border/20">
        <div className="aspect-square flex flex-col items-center justify-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-muted/10">
          <Loader2 size={28} className="text-primary animate-spin" />
          <span className="text-xs font-medium text-primary">
            {isAr ? 'جاري التوليد...' : 'Generating...'}
          </span>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-muted-foreground line-clamp-2">{job.prompt}</p>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="break-inside-avoid mb-3 rounded-2xl overflow-hidden bg-card/60 border border-destructive/20">
        <div className="aspect-square flex flex-col items-center justify-center gap-3 p-4">
          <AlertCircle size={28} className="text-destructive/60" />
          <span className="text-xs font-medium text-destructive">
            {isAr ? 'فشل التوليد' : 'Failed'}
          </span>
          <button
            onClick={() => onRetry(job.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            <RotateCcw size={12} />
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-muted-foreground line-clamp-2">{job.prompt}</p>
        </div>
      </div>
    );
  }

  // Completed
  return (
    <div className="break-inside-avoid mb-3 group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/10 animate-in fade-in zoom-in-95 duration-300">
      {job.image_url && (
        <img src={job.image_url} alt={job.prompt} className="w-full object-cover" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
        <div />
        <div>
          <p className="text-[13px] text-white line-clamp-2 mb-2">{job.prompt}</p>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/50">
              {new Date(job.created_at).toLocaleDateString(isAr ? 'ar' : 'en-US', { month: 'short', day: 'numeric' })}
            </span>
            <div className="flex gap-2">
              <button onClick={handleDownload} className="text-white/80 hover:text-primary transition-colors">
                <Download size={16} />
              </button>
              <button onClick={() => onReuse(job.prompt)} className="text-white/80 hover:text-primary transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const { openAuthModal } = useApp();
  const { jobs, loading, retryJob } = useGenerationJobs();
  const isAr = lang === 'ar';

  const groups = useMemo(() => groupByDate(jobs), [jobs]);

  const handleReuse = (prompt: string) => {
    navigate('/studio');
  };

  if (!user) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-page-enter"
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
      >
        <ImageIcon size={56} className="text-muted-foreground/15 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">
          {isAr ? 'سجل الدخول لعرض معرضك' : 'Sign in to view your gallery'}
        </h2>
        <button
          onClick={() => openAuthModal('signup')}
          className="mt-6 h-10 px-6 bg-primary hover:brightness-110 text-primary-foreground rounded-full text-[13px] font-semibold flex items-center gap-2 transition-all"
        >
          {isAr ? 'جرب مجاناً' : 'Try Free'}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center min-h-[60vh]"
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
      >
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-page-enter"
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
      >
        <ImageIcon size={56} className="text-muted-foreground/15 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">
          {isAr ? 'لا توجد صور بعد' : 'No images yet'}
        </h2>
        <p className="text-sm text-muted-foreground/50 mt-2">
          {isAr ? 'ابدأ الإنشاء في الاستوديو' : 'Start creating in the Studio'}
        </p>
        <button
          onClick={() => navigate('/studio')}
          className="mt-6 h-10 px-6 bg-primary hover:brightness-110 text-primary-foreground rounded-full text-[13px] font-semibold flex items-center gap-2 transition-all"
        >
          {isAr ? 'الاستوديو' : 'Go to Studio'}
          <ArrowRight size={15} className={isRTL ? 'rotate-180' : ''} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto pb-24 md:pb-6 animate-page-enter"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
    >
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-xl font-semibold text-foreground">
            {isAr ? 'معرضي' : 'My Gallery'}
          </h1>
          <span className="text-sm text-muted-foreground/50">
            {jobs.length} {isAr ? 'صورة' : 'images'}
          </span>
        </div>

        {groups.map(group => (
          <div key={group.label} className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              {isAr ? group.labelAr : group.label}
            </h2>
            <div className="columns-2 sm:columns-3 gap-3">
              {group.items.map(job => (
                <GalleryCard
                  key={job.id}
                  job={job}
                  isAr={isAr}
                  onRetry={retryJob}
                  onReuse={handleReuse}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
