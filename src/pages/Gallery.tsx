import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw, Image as ImageIcon, ArrowRight, Loader2, AlertCircle, RotateCcw, Share2, Search, SortAsc, SortDesc, Trash2 } from 'lucide-react';
import { useGenerationJobs, GenerationJob } from '@/hooks/useGenerationJobs';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ImageDetailDrawer } from '@/components/gallery/ImageDetailDrawer';
import { ImageLightbox } from '@/components/gallery/ImageLightbox';
import { ShareModal } from '@/components/gallery/ShareModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FilterKey = 'all' | 'today' | 'yesterday' | 'generated' | 'edited';
type SortKey = 'newest' | 'oldest';

function groupByDate(jobs: GenerationJob[]): { label: string; labelAr: string; key: string; items: GenerationJob[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const groups: { label: string; labelAr: string; key: string; items: GenerationJob[] }[] = [
    { label: 'Today', labelAr: 'اليوم', key: 'today', items: [] },
    { label: 'Yesterday', labelAr: 'أمس', key: 'yesterday', items: [] },
    { label: 'Older', labelAr: 'سابقاً', key: 'older', items: [] },
  ];

  for (const job of jobs) {
    const d = new Date(job.created_at);
    if (d >= today) groups[0].items.push(job);
    else if (d >= yesterday) groups[1].items.push(job);
    else groups[2].items.push(job);
  }

  return groups.filter(g => g.items.length > 0);
}

function GalleryCard({ job, isAr, onRetry, onReuse, onTap, onShare, isMobile }: {
  job: GenerationJob;
  isAr: boolean;
  onRetry: (id: string) => void;
  onReuse: (prompt: string) => void;
  onTap: (job: GenerationJob) => void;
  onShare: (job: GenerationJob) => void;
  isMobile: boolean;
}) {
  const isProcessing = job.status === 'processing';
  const isFailed = job.status === 'failed';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.image_url) return;
    const a = document.createElement('a');
    a.href = job.image_url;
    a.download = `takhayal-${job.id}.png`;
    a.target = '_blank';
    a.click();
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry(job.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(job);
  };

  if (isProcessing) {
    return (
      <button
        onClick={() => onTap(job)}
        className="rounded-2xl overflow-hidden bg-card/60 w-full text-start cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="aspect-square flex flex-col items-center justify-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-muted/10">
          <Loader2 size={28} className="text-primary animate-spin" />
          <span className="text-xs font-medium text-primary">
            {isAr ? 'جاري التوليد...' : 'Generating...'}
          </span>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-muted-foreground line-clamp-2">{job.prompt}</p>
        </div>
      </button>
    );
  }

  if (isFailed) {
    return (
      <button
        onClick={() => onTap(job)}
        className="rounded-2xl overflow-hidden bg-card/60 w-full text-start cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="aspect-square flex flex-col items-center justify-center gap-3 p-4">
          <AlertCircle size={28} className="text-destructive/60" />
          <span className="text-xs font-medium text-destructive">
            {isAr ? 'فشل التوليد' : 'Failed'}
          </span>
          <span
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            <RotateCcw size={12} />
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </span>
        </div>
        <div className="p-3">
          <p className="text-[11px] text-muted-foreground line-clamp-2">{job.prompt}</p>
        </div>
      </button>
    );
  }

  // Completed
  return (
    <button
      onClick={() => onTap(job)}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/10 animate-in fade-in zoom-in-95 duration-300 w-full text-start cursor-pointer active:scale-[0.98]"
    >
      {job.image_url && (
        <img src={job.image_url} alt={job.prompt || ''} className="w-full aspect-square object-cover" loading="lazy" />
      )}
      {/* Hover overlay - desktop shows all actions; mobile shows share icon */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent ${isMobile ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 flex flex-col justify-between p-3`}>
        {/* Top-right actions */}
        <div className={`flex ${isAr ? 'justify-start' : 'justify-end'} gap-1.5`}>
          <span onClick={handleShare} className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white/90 hover:bg-white/25 hover:text-primary transition-all cursor-pointer" title={isAr ? 'مشاركة' : 'Share'}>
            <Share2 size={14} />
          </span>
          <span onClick={handleDownload} className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white/90 hover:bg-white/25 hover:text-primary transition-all cursor-pointer" title={isAr ? 'تحميل' : 'Download'}>
            <Download size={14} />
          </span>
        </div>
        {/* Bottom info */}
        <div>
          <p className="text-[12px] text-white/90 line-clamp-2 mb-1.5">{job.prompt}</p>
          <span className="text-[11px] text-white/40">
            {new Date(job.created_at).toLocaleDateString(isAr ? 'ar' : 'en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
      {/* Mobile share icon always visible */}
      {isMobile && (
        <span
          onClick={handleShare}
          className={`absolute top-2 ${isAr ? 'left-2' : 'right-2'} w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80`}
        >
          <Share2 size={12} />
        </span>
      )}
    </button>
  );
}

export default function Gallery() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { openAuthModal, setPrompt } = useApp();
  const { jobs, loading, retryJob } = useGenerationJobs();
  const isAr = lang === 'ar';
  const [selectedJob, setSelectedJob] = useState<GenerationJob | null>(null);
  const [shareJob, setShareJob] = useState<GenerationJob | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [filter, setFilter] = useState<FilterKey>('all');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const g = t.gallery;

  // Filter + search + sort
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j => j.prompt?.toLowerCase().includes(q));
    }

    // Filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (filter === 'today') result = result.filter(j => new Date(j.created_at) >= today);
    else if (filter === 'yesterday') result = result.filter(j => { const d = new Date(j.created_at); return d >= yesterday && d < today; });

    // Sort
    if (sort === 'oldest') result.reverse();

    return result;
  }, [jobs, search, sort, filter]);

  const groups = useMemo(() => groupByDate(filteredJobs), [filteredJobs]);

  const handleReuse = useCallback((prompt: string) => {
    setPrompt(prompt);
    navigate('/studio');
  }, [navigate, setPrompt]);

  const handleTap = useCallback((job: GenerationJob) => {
    setSelectedJob(job);
  }, []);

  const selectedIndex = selectedJob ? filteredJobs.findIndex(j => j.id === selectedJob.id) : -1;
  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) setSelectedJob(filteredJobs[selectedIndex - 1]);
  }, [selectedIndex, filteredJobs]);
  const handleNext = useCallback(() => {
    if (selectedIndex < filteredJobs.length - 1) setSelectedJob(filteredJobs[selectedIndex + 1]);
  }, [selectedIndex, filteredJobs]);

  const handleDelete = useCallback(async (jobId: string) => {
    const confirmed = window.confirm(isAr ? 'هل أنت متأكد من الحذف؟' : 'Delete this image?');
    if (!confirmed) return;
    await supabase.from('generation_logs').delete().eq('id', jobId);
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    setSelectedJob(null);
  }, [isAr]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: g.all },
    { key: 'today', label: g.today },
    { key: 'yesterday', label: g.yesterday },
    { key: 'generated', label: g.generated },
  ];

  // ── Auth gate ──
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <ImageIcon size={56} className="text-muted-foreground/15 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">{isAr ? 'سجل الدخول لعرض معرضك' : 'Sign in to view your gallery'}</h2>
        <button onClick={() => openAuthModal('signup')} className="mt-6 h-10 px-6 bg-primary hover:brightness-110 text-primary-foreground rounded-full text-[13px] font-semibold flex items-center gap-2 transition-all">
          {isAr ? 'جرب مجاناً' : 'Try Free'}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <ImageIcon size={56} className="text-muted-foreground/15 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">{g.noImagesYet || (isAr ? 'لا توجد صور بعد' : 'No images yet')}</h2>
        <p className="text-sm text-muted-foreground/50 mt-2">{g.startCreatingStudio || (isAr ? 'ابدأ الإبداع في الاستوديو' : 'Start creating in the Studio')}</p>
        <button onClick={() => navigate('/studio')} className="mt-6 h-10 px-6 bg-primary hover:brightness-110 text-primary-foreground rounded-full text-[13px] font-semibold flex items-center gap-2 transition-all">
          {g.goToStudio || (isAr ? 'الاستوديو' : 'Go to Studio')}
          <ArrowRight size={15} className={isRTL ? 'rotate-180' : ''} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex-1 overflow-y-auto pb-24 md:pb-6 animate-page-enter"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
          {/* ── Header row ── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-semibold text-foreground">{g.myGallery}</h1>
              <span className="text-sm text-muted-foreground/50">{filteredJobs.length} {g.images}</span>
            </div>

            {/* Desktop controls */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground/50 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={g.searchPlaceholder}
                  className={`h-9 w-52 rounded-xl bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                />
              </div>
              {/* Sort */}
              <button
                onClick={() => setSort(s => s === 'newest' ? 'oldest' : 'newest')}
                className="h-9 px-3 rounded-xl bg-muted/30 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {sort === 'newest' ? <SortDesc size={14} /> : <SortAsc size={14} />}
                {sort === 'newest' ? g.newest : g.oldest}
              </button>
            </div>
          </div>

          {/* ── Filter row (desktop) ── */}
          <div className="hidden md:flex gap-1.5 mb-6">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Mobile search ── */}
          <div className="md:hidden mb-4">
            <div className="relative">
              <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground/50 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={g.searchPlaceholder}
                className={`h-9 w-full rounded-xl bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
              />
            </div>
          </div>

          {/* ── Content ── */}
          {filteredJobs.length === 0 ? (
            <div className="py-20 text-center">
              <Search size={40} className="text-muted-foreground/15 mx-auto mb-3" />
              <p className="text-foreground text-sm">{g.noResults}</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.key} className="mb-8">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  {isAr ? group.labelAr : group.label}
                </h2>
                {/* Mobile: 2 cols masonry, Desktop: 4-6 col grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {group.items.map(job => (
                    <GalleryCard
                      key={job.id}
                      job={job}
                      isAr={isAr}
                      onRetry={retryJob}
                      onReuse={handleReuse}
                      onTap={handleTap}
                      onShare={setShareJob}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile: drawer, Desktop: lightbox */}
      <div className="md:hidden">
        <ImageDetailDrawer
          job={selectedJob}
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          onRetry={retryJob}
          onReuse={handleReuse}
          onShare={setShareJob}
          onDelete={handleDelete}
        />
      </div>
      <div className="hidden md:block">
        <ImageLightbox
          job={selectedJob}
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          onRetry={retryJob}
          onReuse={handleReuse}
          onShare={(j) => { console.log('SHARE CLICKED', j.id); setSelectedJob(null); setTimeout(() => { console.log('SETTING SHARE JOB', j.id); setShareJob(j); }, 100); }}
          onDelete={handleDelete}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < filteredJobs.length - 1}
        />
      </div>

      <ShareModal
        job={shareJob}
        open={!!shareJob}
        onClose={() => setShareJob(null)}
      />
    </>
  );
}
