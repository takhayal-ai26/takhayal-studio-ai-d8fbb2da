import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { CreationPanel } from '@/components/layout/CreationPanel';
import { StudioGenerationFeed } from '@/components/layout/StudioGenerationFeed';
import { UpgradeModal } from '@/components/UpgradeModal';
import { GalleryView } from '@/components/views/GalleryView';
import { CreditsView } from '@/components/views/CreditsView';
import { SettingsView } from '@/components/views/SettingsView';
import { TemplatesView } from '@/components/views/TemplatesView';
import { useLanguage } from '@/i18n/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GenerateImageCanvasPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const direction = isAr ? 'rtl' : 'ltr';

  const tabsControl = (
    <TabsList
      dir={direction}
      className="grid h-10 w-full grid-cols-2 rounded-2xl border border-black/10 bg-black/[0.035] p-1 shadow-none dark:border-white/10 dark:bg-white/[0.055]"
    >
      <TabsTrigger
        value="generate"
        className={cn(
          'h-8 rounded-xl px-3 text-[12px] font-bold text-muted-foreground transition-all duration-200',
          'data-[state=active]:bg-white data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm',
          'dark:data-[state=active]:bg-[#202023] dark:data-[state=active]:text-white'
        )}
      >
        <Wand2 size={13} className="me-1.5" />
        {isAr ? 'توليد' : 'Generate'}
      </TabsTrigger>
      <TabsTrigger
        value="history"
        className={cn(
          'h-8 rounded-xl px-3 text-[12px] font-bold text-muted-foreground transition-all duration-200',
          'data-[state=active]:bg-white data-[state=active]:text-neutral-950 data-[state=active]:shadow-sm',
          'dark:data-[state=active]:bg-[#202023] dark:data-[state=active]:text-white'
        )}
      >
        <Clock size={13} className="me-1.5" />
        {isAr ? 'السجل' : 'History'}
      </TabsTrigger>
    </TabsList>
  );

  return (
    <>
      <div
        className="image-generation-workspace flex h-full min-h-0 overflow-hidden"
        dir={direction}
        style={{ paddingTop: 'calc(2.75rem + var(--banner-h, 0px))' }}
      >
        <Tabs defaultValue="generate" className="flex h-full min-h-0 w-full overflow-hidden">
          <div className={cn('flex h-full min-h-0 w-full gap-4 overflow-hidden p-4 lg:gap-5 lg:p-5 xl:gap-6 xl:p-6', isAr && 'flex-row-reverse')}>
            <CreationPanel tabsControl={tabsControl} />

            <main className="min-w-0 flex-1">
              <TabsContent value="generate" className="m-0 h-full">
                <StudioGenerationFeed section="featured" />
              </TabsContent>

              <TabsContent value="history" className="m-0 h-full">
                <section className="image-preview-canvas h-full overflow-hidden rounded-[28px]">
                  <StudioGenerationFeed section="history" />
                </section>
              </TabsContent>
            </main>
          </div>
        </Tabs>
      </div>
      <UpgradeModal />
    </>
  );
}

const Canvas = () => {
  const { activePage } = useApp();

  const renderContent = () => {
    switch (activePage) {
      case 'gallery': return <GalleryView />;
      case 'credits': return <CreditsView />;
      case 'settings': return <SettingsView />;
      case 'templates': return <TemplatesView />;
      case 'canvas':
      default:
        return null;
    }
  };

  if (activePage === 'gallery') {
    return <Navigate to="/gallery" replace />;
  }

  if (activePage === 'canvas') {
    return <GenerateImageCanvasPage />;
  }

  return (
    <>
      <div className="flex flex-1 min-h-0 overflow-visible" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        {renderContent()}
      </div>
      <UpgradeModal />
    </>
  );
};

export default Canvas;
