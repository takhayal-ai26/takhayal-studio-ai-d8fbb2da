import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Download, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Logo } from '@/components/Logo';

interface SharedImage {
  prompt: string | null;
  image_url: string | null;
  ratio: string | null;
  quality_tier: string | null;
  created_at: string;
}

export default function SharePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [image, setImage] = useState<SharedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!publicId) { setNotFound(true); setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from('generation_logs')
        .select('prompt, image_url, ratio, quality_tier, created_at')
        .eq('public_id', publicId)
        .eq('is_public', true)
        .single();
      if (error || !data) { setNotFound(true); }
      else { setImage(data as SharedImage); }
      setLoading(false);
    })();
  }, [publicId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !image) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <Sparkles size={48} className="text-muted-foreground/20" />
        <h1 className="text-xl font-semibold text-foreground">Image not found</h1>
        <Link to="/" className="text-primary text-sm hover:underline">Go to Takhayal.ai</Link>
      </div>
    );
  }

  const handleDownload = () => {
    if (!image.image_url) return;
    const a = document.createElement('a');
    a.href = image.image_url;
    a.download = `takhayal-${publicId}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="h-14 flex items-center justify-between px-5 border-b border-border/10">
        <Logo />
        <Link
          to="/studio"
          className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:brightness-110 transition-all"
        >
          Create your own <ArrowRight size={14} />
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Image */}
        {image.image_url && (
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/20 mb-6">
            <img src={image.image_url} alt={image.prompt || ''} className="w-full" />
          </div>
        )}

        {/* Prompt */}
        {image.prompt && (
          <div className="rounded-xl bg-card/60 p-4 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={12} className="text-primary" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prompt</span>
            </div>
            <p className="text-[14px] text-foreground leading-relaxed">{image.prompt}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-6">
          {image.ratio && (
            <span className="px-3 py-1.5 rounded-full bg-muted/30 text-[12px] text-muted-foreground">
              {image.ratio}
            </span>
          )}
          {image.quality_tier && (
            <span className="px-3 py-1.5 rounded-full bg-muted/30 text-[12px] text-muted-foreground">
              {image.quality_tier}
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full bg-muted/30 text-[12px] text-muted-foreground">
            {formatDate(image.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 h-11 rounded-xl border border-border/30 text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors"
          >
            <Download size={16} />
            Download
          </button>
          <Link
            to="/studio"
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all"
          >
            Create your own
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Branding */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-muted-foreground/40">Created with Takhayal.ai</p>
        </div>
      </div>
    </div>
  );
}