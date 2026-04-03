import { useState } from 'react';
import { X, Link2, MessageCircle, Twitter, Instagram, Users, Check, Loader2 } from 'lucide-react';
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
  const [communityShared, setCommunityShared] = useState(false);

  if (!open || !job) return null;

  const getShareUrl = async (): Promise<string> => {
    // Check if already has public_id
    const { data: existing } = await supabase
      .from('generation_logs')
      .select('public_id, is_public')
      .eq('id', job.id)
      .single();

    if (existing?.public_id && existing?.is_public) {
      return `${window.location.origin}/share/${existing.public_id}`;
    }

    const publicId = generatePublicId();
    await supabase
      .from('generation_logs')
      .update({ is_public: true, public_id: publicId, share_count: 1 } as any)
      .eq('id', job.id);

    return `${window.location.origin}/share/${publicId}`;
  };

  const handleCopyLink = async () => {
    setSharing(true);
    try {
      const url = await getShareUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(s.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
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

  const handleCommunity = async () => {
    setSharing(true);
    try {
      await getShareUrl();
      await supabase
        .from('generation_logs')
        .update({ is_shared_to_community: true } as any)
        .eq('id', job.id);
      setCommunityShared(true);
      toast.success(s.sharedToCommunity);
    } catch {
      toast.error('Failed');
    }
    setSharing(false);
  };

  const ShareButton = ({ icon, label, onClick, accent, disabled }: {
    icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean; disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled || sharing}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98] ${
        accent
          ? 'bg-primary/10 text-primary hover:bg-primary/15'
          : 'bg-muted/30 text-foreground hover:bg-muted/50'
      } disabled:opacity-40`}
    >
      {icon}
      <span className="flex-1 text-start">{label}</span>
      {disabled && <Check size={14} className="text-green-500" />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="relative w-full max-w-md mx-auto bg-popover rounded-t-3xl md:rounded-2xl p-5 pb-8 md:pb-5 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">{s.shareImage}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        {job.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img src={job.image_url} alt="" className="w-full h-32 object-cover" />
          </div>
        )}

        {/* Share options */}
        <div className="space-y-2">
          <ShareButton
            icon={copied ? <Check size={18} /> : (sharing ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />)}
            label={copied ? s.linkCopied : s.copyLink}
            onClick={handleCopyLink}
          />
          <ShareButton
            icon={<MessageCircle size={18} />}
            label={s.shareWhatsApp}
            onClick={handleWhatsApp}
          />
          <ShareButton
            icon={<Twitter size={18} />}
            label={s.shareTwitter}
            onClick={handleTwitter}
          />
          <ShareButton
            icon={<Instagram size={18} />}
            label={s.shareInstagram}
            onClick={handleInstagram}
          />
          <ShareButton
            icon={<Users size={18} />}
            label={communityShared ? s.alreadyShared : s.shareCommunity}
            onClick={handleCommunity}
            accent
            disabled={communityShared}
          />
        </div>
      </div>
    </div>
  );
}