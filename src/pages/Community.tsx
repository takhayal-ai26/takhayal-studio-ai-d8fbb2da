import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { CommunityDetailModal } from '@/components/community/CommunityDetailModal';
import { CommunityCard } from '@/components/community/CommunityCard';

export interface CommunityPost {
  id: string;
  image_url: string;
  prompt: string | null;
  ratio: string | null;
  quality_tier: string | null;
  resolution: string | null;
  model_name: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  public_id: string | null;
  created_at: string;
}

export default function Community() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, isRTL, lang } = useLanguage();
  const { setPrompt, requireAuth } = useApp();
  const isMobile = useIsMobile();
  const isAr = lang === 'ar';

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch APPROVED community posts from the new community_posts table
  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('status', 'approved')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) {
        console.error('Community fetch error:', error);
        setLoading(false);
        return;
      }

      const mapped: CommunityPost[] = (data as any[])
        .filter((d: any) => d.image_url && d.image_url.length > 5)
        .map((d: any) => ({
          id: d.id,
          image_url: d.image_url,
          prompt: d.prompt || null,
          ratio: d.ratio || null,
          quality_tier: d.quality_or_resolution || null,
          resolution: d.quality_or_resolution || null,
          model_name: d.model || null,
          creator_name: d.username || null,
          creator_avatar: d.avatar_url || null,
          public_id: d.id, // use community post id as public ref
          created_at: d.created_at,
        }));

      setPosts(mapped);
      setLoading(false);
    })();
  }, []);

  // Open post from URL param
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId && posts.length > 0) {
      const found = posts.find(p => p.id === postId);
      if (found) setSelectedPost(found);
    }
  }, [searchParams, posts]);

  const handleOpenPost = useCallback((post: CommunityPost) => {
    setSelectedPost(post);
    setSearchParams({ post: post.id }, { replace: true });
  }, [setSearchParams]);

  const handleClosePost = useCallback(() => {
    setSelectedPost(null);
    const next = new URLSearchParams(searchParams);
    next.delete('post');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleUsePrompt = useCallback((prompt: string) => {
    setPrompt(prompt);
    navigate('/studio');
  }, [setPrompt, navigate]);

  const handleShare = useCallback(async (post: CommunityPost) => {
    const url = `${window.location.origin}/community?post=${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Takhayal.ai', url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      const { toast } = await import('sonner');
      toast.success(isAr ? 'تم نسخ الرابط' : 'Link copied!');
    }
  }, [isAr]);

  const selectedIndex = selectedPost ? posts.findIndex(p => p.id === selectedPost.id) : -1;
  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) {
      const prev = posts[selectedIndex - 1];
      setSelectedPost(prev);
      setSearchParams({ post: prev.id }, { replace: true });
    }
  }, [selectedIndex, posts, setSearchParams]);
  const handleNext = useCallback(() => {
    if (selectedIndex < posts.length - 1) {
      const next = posts[selectedIndex + 1];
      setSelectedPost(next);
      setSearchParams({ post: next.id }, { replace: true });
    }
  }, [selectedIndex, posts, setSearchParams]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-24 md:pb-6 animate-page-enter"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}
      >
        <section className="text-center px-5 pt-10 pb-6">
          <h1 className="typo-heading-page">
            {isAr ? 'إلهام المجتمع' : 'Community Inspiration'}
          </h1>
          <p className="text-sm text-muted-foreground/60 mt-2 max-w-md mx-auto">
            {isAr ? 'اكتشف أعمال المبدعين واستلهم من أوامرهم' : 'Discover what creators are making and get inspired by their prompts'}
          </p>
        </section>

        <div className="max-w-7xl mx-auto px-3 md:px-6">
          {posts.length === 0 ? (
            <div className="py-24 text-center">
              <Sparkles size={28} className="text-primary mx-auto mb-3 opacity-40" />
              <p className="text-foreground text-sm font-medium">
                {isAr ? 'لا توجد أعمال بعد' : 'No creations yet'}
              </p>
              <p className="text-muted-foreground/50 text-xs mt-1">
                {isAr ? 'كن أول من يشارك' : 'Be the first to share'}
              </p>
              <button
                onClick={() => requireAuth(() => navigate('/studio'))}
                className="mt-5 h-10 px-6 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold inline-flex items-center gap-2 hover:brightness-110 transition-all"
              >
                {isAr ? 'ابدأ الإبداع' : 'Start Creating'}
                <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </button>
            </div>
          ) : (
            <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
              {posts.map(post => (
                <div key={post.id} className="mb-3 break-inside-avoid">
                  <CommunityCard post={post} isAr={isAr} isMobile={isMobile} onTap={handleOpenPost} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CommunityDetailModal
        post={selectedPost}
        open={!!selectedPost}
        onClose={handleClosePost}
        onUsePrompt={handleUsePrompt}
        onShare={handleShare}
        isAr={isAr}
        isRTL={isRTL}
        isMobile={isMobile}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex < posts.length - 1}
      />
    </>
  );
}
