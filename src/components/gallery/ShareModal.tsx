import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2, MessageCircle, Twitter, Instagram, Users, Check, Loader2, Clock, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GenerationJob } from '@/hooks/useGenerationJobs';

interface ShareModalProps {
  job: GenerationJob | null;
  open: boolean;
  onClose: () => void;
}

function generatePublicId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function ShareModal({ job, open, onClose }: ShareModalProps) {
  const { t, isRTL } = useLanguage();
  const lang = isRTL ? 'ar' : 'en';
  const s = t.share;
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [communityStatus, setCommunityStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submittingCommunity, setSubmittingCommunity] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Check if already submitted to community
  useEffect(() => {
    if (!open || !job) return;
    setCommunityStatus('none');
    setShowConfirm(false);
    (async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('status')
        .eq('source_generation_id', job.id)
        .limit(1);
      if (data && data.length > 0) {
        setCommunityStatus((data[0] as any).status as any);
      }
    })();
  }, [open, job?.id]);

  if (!mounted || !open || !job) return null;

  const PRODUCTION_ORIGIN = 'https://takhayal-studio-ai.lovable.app';

  const getShareUrl = async (): Promise<string> => {
    const origin = window.location.hostname.includes('lovable') && !window.location.hostname.startsWith('takhayal')
      ? PRODUCTION_ORIGIN
      : window.location.origin;
    const { data: existing } = await supabase
      .from('generation_logs')
      .select('public_id, is_public')
      .eq('id', job.id)
      .single();
    if (existing?.public_id && existing?.is_public) {
      return `${origin}/share/${existing.public_id}`;
    }
    const publicId = generatePublicId();
    await supabase
      .from('generation_logs')
      .update({ is_public: true, public_id: publicId, share_count: 1 } as any)
      .eq('id', job.id);
    return `${origin}/share/${publicId}`;
  };

  const handleCopyLink = async () => {
    setSharing(true);
    try {
      const url = await getShareUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(s.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
    setSharing(false);
  };

  const handleWhatsApp = async () => {
    const url = await getShareUrl();
    const text = encodeURIComponent(`${job.prompt || s.createdWith}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTwitter = async () => {
    const url = await getShareUrl();
    const text = encodeURIComponent(job.prompt || s.createdWith);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
  };

  const handleInstagram = () => {
    if (!job.image_url) return;
    const a = document.createElement('a');
    a.href = job.image_url;
    a.download = `takhayal-${job.id}.png`;
    a.target = '_blank';
    a.click();
    toast.success(s.downloadForIG);
  };

  const handleCommunityClick = () => {
    if (communityStatus !== 'none') return;
    setShowConfirm(true);
  };

  const handleSubmitToCommunity = async () => {
    setSubmittingCommunity(true);
    try {
      // Get user profile info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Please log in'); setSubmittingCommunity(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, first_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      // Get model name
      let modelName = '';
      if (job.model_id) {
        const { data: modelData } = await supabase
          .from('models')
          .select('model_name')
          .eq('id', job.model_id)
          .single();
        modelName = modelData?.model_name || '';
      }

      // Ensure public URL exists
      await getShareUrl();

      // Detect template-based generation
      const templateId = job.tool_id?.startsWith('template:') ? job.tool_id.replace('template:', '') : null;

      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id,
        username: (profile as any)?.username || profile?.first_name || profile?.full_name || 'Creator',
        avatar_url: profile?.avatar_url || '',
        image_url: job.image_url,
        prompt: job.prompt || '',
        model: modelName,
        ratio: job.ratio || '',
        quality_or_resolution: job.quality_tier || job.resolution || '',
        source_generation_id: job.id,
        source_type: job.tool_id ? 'tool' : 'generation',
        status: 'pending',
        template_id: templateId,
      } as any);

      if (error) {
        console.error('Community submit error:', error);
        toast.error(isRTL ? 'حدث خطأ' : 'Something went wrong');
      } else {
        // Also mark on generation_logs for backward compat
        await supabase
          .from('generation_logs')
          .update({ is_shared_to_community: true } as any)
          .eq('id', job.id);

        setCommunityStatus('pending');
        setShowConfirm(false);
        toast.success(
          isRTL
            ? 'تم الإرسال بنجاح. سنراجع منشورك قبل نشره.'
            : 'Submitted successfully. We\'ll review your post before publishing it.'
        );
      }
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Something went wrong');
    }
    setSubmittingCommunity(false);
  };

  const communityLabel = communityStatus === 'pending'
    ? (isRTL ? 'قيد المراجعة' : 'Under Review')
    : communityStatus === 'approved'
    ? (isRTL ? 'تم النشر' : 'Published')
    : communityStatus === 'rejected'
    ? (isRTL ? 'مرفوض' : 'Rejected')
    : (isRTL ? 'مشاركة في المجتمع' : 'Share to Community');

  const communityIcon = communityStatus === 'pending'
    ? <Clock size={18} />
    : communityStatus === 'approved'
    ? <ShieldCheck size={18} />
    : <Users size={18} />;

  const ShareButton = ({ icon, label, onClick, accent, disabled }: {
    icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean; disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled || sharing}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98] cursor-pointer ${
        accent
          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110'
          : 'bg-muted/30 text-foreground hover:bg-muted/50'
      } disabled:opacity-40`}
    >
      {icon}
      <span className="flex-1 text-start">{label}</span>
      {disabled && communityStatus !== 'none' && <Check size={14} className="text-primary-foreground" />}
    </button>
  );

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="relative w-full max-w-md mx-auto bg-popover rounded-t-3xl md:rounded-2xl p-5 pb-8 md:pb-5 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {showConfirm ? (
          /* ── CONFIRMATION STEP ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {isRTL ? 'مشاركة في المجتمع؟' : 'Share to Community?'}
              </h3>
              <button onClick={() => setShowConfirm(false)} className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            {job.image_url && (
              <div className="rounded-xl overflow-hidden">
                <img src={job.image_url} alt="" className="w-full h-40 object-cover" />
              </div>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRTL
                ? 'سيتم مراجعة صورتك أولاً قبل ظهورها بشكل عام في صفحة المجتمع.'
                : 'Your image will be reviewed before it appears publicly in the Community.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-11 rounded-xl bg-muted/30 text-foreground text-[13px] font-medium hover:bg-muted/50 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmitToCommunity}
                disabled={submittingCommunity}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingCommunity ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                {isRTL ? 'إرسال للمراجعة' : 'Submit for Review'}
              </button>
            </div>
          </div>
        ) : (
          /* ── MAIN SHARE OPTIONS ── */
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">{s.shareImage}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            {job.image_url && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img src={job.image_url} alt="" className="w-full h-32 object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <ShareButton
                icon={communityIcon}
                label={communityLabel}
                onClick={handleCommunityClick}
                accent
                disabled={communityStatus !== 'none'}
              />
              <ShareButton
                icon={copied ? <Check size={18} /> : (sharing ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />)}
                label={copied ? s.linkCopied : s.copyLink}
                onClick={handleCopyLink}
              />
              <ShareButton icon={<MessageCircle size={18} />} label={s.shareWhatsApp} onClick={handleWhatsApp} />
              <ShareButton icon={<Twitter size={18} />} label={s.shareTwitter} onClick={handleTwitter} />
              <ShareButton icon={<Instagram size={18} />} label={s.shareInstagram} onClick={handleInstagram} />
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
