import { memo } from 'react';
import type { CommunityPost } from '@/pages/Community';

interface CommunityCardProps {
  post: CommunityPost;
  isAr: boolean;
  isMobile: boolean;
  onTap: (post: CommunityPost) => void;
}

export const CommunityCard = memo(function CommunityCard({ post, isAr, isMobile, onTap }: CommunityCardProps) {
  const creatorInitial = post.creator_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <button
      onClick={() => onTap(post)}
      className="w-full text-start rounded-2xl overflow-hidden bg-card/40 group relative cursor-pointer active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-black/10 animate-in fade-in zoom-in-95 duration-300"
    >
      <img
        src={post.image_url}
        alt={post.prompt || ''}
        className="w-full block transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />

      {/* Hover overlay — desktop only */}
      {!isMobile && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {post.creator_avatar ? (
                <img src={post.creator_avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[9px] font-bold text-white/80">
                  {creatorInitial}
                </span>
              )}
              <span className="text-[11px] text-white/80 font-medium">
                {post.creator_name || (isAr ? 'مبدع' : 'Creator')}
              </span>
            </div>
            <span className="text-[10px] text-white/40 font-medium">
              {isAr ? 'عرض التفاصيل' : 'View details'}
            </span>
          </div>
        </div>
      )}
    </button>
  );
});
