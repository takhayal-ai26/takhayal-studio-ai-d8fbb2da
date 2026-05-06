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

export function GenerateImageCanvasPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <>
      <div className="flex flex-1 min-h-0 overflow-visible" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <div className="flex flex-col flex-1 min-h-0 relative overflow-y-auto pb-24 md:pb-0">
          <Tabs defaultValue="generate" className="w-full">
            <div className="sticky top-0 z-20 bg-background/90 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
              <div className="mx-auto flex w-full max-w-[1480px] justify-center">
                <TabsList className="h-11 rounded-2xl bg-card/50 p-1">
                  <TabsTrigger value="generate" className="h-9 rounded-xl px-4 text-[13px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Wand2 size={14} className={isAr ? 'ml-2' : 'mr-2'} />
                    {isAr ? 'توليد' : 'Generate'}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="h-9 rounded-xl px-4 text-[13px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Clock size={14} className={isAr ? 'ml-2' : 'mr-2'} />
                    {isAr ? 'السجل' : 'History'}
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="generate" className="m-0 px-4 pt-3 md:px-6 md:pt-4 lg:px-8 xl:px-10">
              <div className="mx-auto grid w-full max-w-[1480px] grid-cols-1 items-start justify-center gap-4 lg:grid-cols-[minmax(380px,0.92fr)_minmax(430px,1.08fr)] lg:gap-6 xl:grid-cols-[minmax(500px,0.95fr)_minmax(560px,1.05fr)] xl:gap-9">
                <CreationPanel />
                <StudioGenerationFeed section="featured" />
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0">
              <div className="mx-auto w-full max-w-[1900px]">
                <StudioGenerationFeed section="history" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
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
