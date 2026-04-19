import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';
import { Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToolsDB } from '@/hooks/useToolsDB';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';

export default function ToolsDirectory() {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { tools } = useToolsDB();
  const { setActivePage } = useApp();
  const [search, setSearch] = useState('');

  const filtered = tools
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.shortDesc.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const seoTitle = t.toolsDir.findNewWays;
  const seoDescription = isRTL
    ? 'استكشف أدوات تخيّل للصور والفيديو والتصميم والتحرير بالذكاء الاصطناعي.'
    : 'Explore Takhayal AI tools for image generation, editing, video creation, and creative workflows.';
  const toolSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: seoTitle,
    itemListElement: tools.slice(0, 12).map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(tool.route),
      name: tool.name,
      description: tool.shortDesc,
    })),
  };

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <PageSeo
        title={`${seoTitle} | Takhayal.ai`}
        description={seoDescription}
        canonicalPath="/tools"
        pageType="CollectionPage"
        schemas={[toolSchema]}
      />
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10 pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="typo-heading-page">
              {t.toolsDir.findNewWays}
            </h1>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={15} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground/40", isRTL ? "right-3.5" : "left-3.5")} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.toolsDir.searchPlaceholder}
              className={cn(
                "w-full h-11 bg-card/50 border border-border/30 rounded-2xl pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all",
                isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
              )}
            />
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground/50 text-[14px]">{t.toolsDir.noToolsMatch}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tool => {
              const Icon = tool.icon;
              const hasImage = !!tool.image;
              const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (tool.slug === 'generate') {
                      setActivePage('canvas');
                      navigate('/studio');
                    } else {
                      navigate(`/tools/${tool.slug}`);
                    }
                  }}
                  aria-label={tool.name}
                  className={cn(
                    "group relative rounded-2xl overflow-hidden",
                    "transition-[transform,box-shadow] duration-300 ease-out will-change-transform",
                    "hover:-translate-y-0.5 md:hover:scale-[1.015] hover:shadow-2xl hover:shadow-primary/10",
                    "active:scale-[0.985] active:translate-y-0 active:transition-transform active:duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  <div className="aspect-[4/3] relative bg-muted/10">
                    {hasImage ? (
                      <img
                        src={tool.image}
                        alt={tool.name}
                        className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.07] group-active:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/15 via-muted/20 to-background flex items-center justify-center">
                        <Icon size={48} className="text-primary/20" />
                      </div>
                    )}
                  </div>

                  {/* Base gradient (always visible) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300" />
                  {/* Hover/press gradient boost — stronger contrast for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300" />

                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <h3 className="text-xl font-bold text-white drop-shadow-sm">{tool.name}</h3>
                    <p className="text-[14px] text-white/70 mt-1 line-clamp-2 transition-colors duration-300 group-hover:text-white/90">
                      {tool.shortDesc}
                    </p>

                    {/* "Open tool" cue — slides in on hover, always visible on touch via active */}
                    <div
                      className={cn(
                        "mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/0 group-hover:text-white group-active:text-white",
                        "translate-y-1 group-hover:translate-y-0 group-active:translate-y-0",
                        "transition-all duration-300 ease-out"
                      )}
                    >
                      <span>{t.toolPage.openTool}</span>
                      <ArrowIcon
                        size={13}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                      />
                    </div>
                  </div>

                  {/* Border ring — brightens on interaction */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.05] group-hover:ring-primary/30 group-active:ring-primary/40 transition-all duration-300 pointer-events-none" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
