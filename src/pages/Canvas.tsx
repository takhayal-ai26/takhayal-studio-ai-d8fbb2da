import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { CreationPanel } from '@/components/layout/CreationPanel';
import { StudioGenerationFeed } from '@/components/layout/StudioGenerationFeed';
import { UpgradeModal } from '@/components/UpgradeModal';
import { GalleryView } from '@/components/views/GalleryView';
import { CreditsView } from '@/components/views/CreditsView';
import { SettingsView } from '@/components/views/SettingsView';
import { TemplatesView } from '@/components/views/TemplatesView';

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
        return (
          <div className="flex flex-col flex-1 min-h-0 relative overflow-y-auto pb-24 md:pb-0">
            <div className="px-4 pt-4 md:px-5 md:pt-5">
              <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-4 md:grid-cols-[minmax(380px,420px)_minmax(0,1fr)] md:gap-5">
                <CreationPanel />
                <StudioGenerationFeed section="featured" />
              </div>
            </div>

            <div className="mx-auto w-full max-w-[1500px]">
              <StudioGenerationFeed section="history" />
            </div>
          </div>
        );
    }
  };

  if (activePage === 'gallery') {
    return <Navigate to="/gallery" replace />;
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
