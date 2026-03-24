import { Download, RefreshCw, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const filterTags = ['All', 'Ramadan', 'Product', 'Reels', 'Fashion', 'Real Estate'];

export function GalleryView() {
  const { gallery, setActivePage, setPrompt } = useApp();

  if (gallery.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <ImageIcon size={64} className="text-surface-border mb-4" />
        <h2 className="text-xl font-medium text-foreground">No images yet</h2>
        <p className="text-sm text-muted-foreground mt-2">Start creating in the Studio</p>
        <button
          onClick={() => setActivePage('canvas')}
          className="mt-6 h-10 px-6 bg-primary hover:bg-ember-hover text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          Go to Studio <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-xl font-medium text-foreground">My Gallery</h1>
        <span className="text-sm text-muted-foreground">{gallery.length} images</span>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterTags.map((tag, i) => (
          <button
            key={tag}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
              i === 0
                ? 'bg-primary/[0.12] border-primary text-primary'
                : 'bg-card border-surface-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
        {gallery.map(img => (
          <div key={img.id} className="break-inside-avoid mb-3 group relative rounded-xl overflow-hidden bg-card border border-surface-border">
            <img src={img.url} alt={img.prompt} className="w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-background/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
              {img.template && (
                <span className="self-start px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px]">
                  {img.template}
                </span>
              )}
              <div>
                <p className="text-[13px] text-foreground line-clamp-2 mb-2">{img.prompt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">
                    {img.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex gap-2">
                    <button className="text-foreground hover:text-primary transition-colors"><Download size={16} /></button>
                    <button
                      onClick={() => { setPrompt(img.prompt); setActivePage('studio'); }}
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
