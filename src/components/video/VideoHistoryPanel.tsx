import { useEffect, useState } from 'react';
import { Film, Download, RotateCcw, Play, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface VideoHistoryItem {
  id: string;
  prompt: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  status: string;
  created_at: string;
  model_id: string | null;
}

export default function VideoHistoryPanel() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [items, setItems] = useState<VideoHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('generation_logs')
      .select('id, prompt, video_url, thumbnail_url, duration, status, created_at, model_id')
      .eq('user_id', user.id)
      .eq('media_type', 'video')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setItems(data as VideoHistoryItem[]);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 p-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl bg-muted/20 animate-pulse aspect-video" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mb-6">
          <Play size={28} className="text-muted-foreground/25 ml-1" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          {isAr ? 'ستظهر فيديوهاتك هنا' : 'Your videos will appear here'}
        </h3>
        <p className="text-sm text-muted-foreground/50 max-w-xs leading-relaxed">
          {isAr ? 'ابدأ بتوليد الفيديوهات لتراها هنا' : 'Start generating videos to see your creations'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-1">
      {items.map(item => (
        <div
          key={item.id}
          className="group relative rounded-2xl overflow-hidden bg-card/60 dark:bg-card/40 shadow-sm hover:shadow-md transition-all"
        >
          <div className="aspect-video relative bg-muted/10">
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film size={24} className="text-muted-foreground/20" />
              </div>
            )}
            {item.status === 'completed' && item.video_url && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play size={18} className="text-white ml-0.5" />
                </div>
              </div>
            )}
            {item.duration && (
              <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
                <Clock size={9} /> {item.duration}
              </span>
            )}
            {item.status !== 'completed' && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                {item.status === 'failed' ? (
                  <span className="text-xs text-destructive font-medium">{isAr ? 'فشل' : 'Failed'}</span>
                ) : (
                  <div className="w-5 h-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                )}
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed mb-1.5">
              {item.prompt || (isAr ? 'بدون وصف' : 'No prompt')}
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              {new Date(item.created_at).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
