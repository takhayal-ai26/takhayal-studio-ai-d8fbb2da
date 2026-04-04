import { Download, RefreshCw, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';

const filterTags = ['All', 'Ramadan', 'Product', 'Reels', 'Fashion', 'Real Estate'];

export function GalleryView() {
  const { gallery, setActivePage, setPrompt } = useApp();
  const { t, isRTL } = useLanguage();

  if (gallery.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-page-enter">
        <ImageIcon size={56} className="text-muted-foreground/15 mb-4" />
        <h2 className="typo-heading-section">{t.gallery.noImagesYet}</h2>
        <p className="text-sm text-muted-foreground/50 mt-2">{t.gallery.startCreatingStudio}</p>
        <button onClick={() => setActivePage('canvas')} className="mt-6 h-10 px-6 bg-primary hover:bg-ember-hover text-primary-foreground rounded-full text-[13px] font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/20">
          {t.gallery.goToStudio} <ArrowRight size={15} className={isRTL ? 'rotate-180' : ''} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 animate-page-enter">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="typo-heading-page">{t.gallery.myGallery}</h1>
        <span className="text-sm text-muted-foreground/50">{gallery.length} {t.gallery.imagesCount}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {filterTags.map((tag, i) => (
          <button key={tag} className={`filter-pill ${i === 0 ? 'active' : ''}`}>{tag}</button>
        ))}
      </div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
        {gallery.map(img => (
          <div key={img.id} className="break-inside-avoid mb-3 group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/10">
            <img src={img.url} alt={img.prompt} className="w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
              {img.template && (<span className="self-start px-2.5 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-[11px] font-medium">{img.template}</span>)}
              <div>
                <p className="text-[13px] text-white line-clamp-2 mb-2">{img.prompt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/50">{img.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className="flex gap-2">
                    <button className="text-white/80 hover:text-primary transition-colors"><Download size={16} /></button>
                    <button onClick={() => { setPrompt(img.prompt); setActivePage('canvas'); }} className="text-white/80 hover:text-primary transition-colors"><RefreshCw size={16} /></button>
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
