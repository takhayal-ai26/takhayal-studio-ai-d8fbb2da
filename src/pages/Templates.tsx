import { TopNavbar } from '@/components/layout/TopNavbar';
import { AuthModal } from '@/components/AuthModal';
import TemplatesView from '@/components/views/TemplatesView';

export default function Templates() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNavbar />
      <div className="flex-1 pt-16">
        <TemplatesView />
      </div>
      <AuthModal />
    </div>
  );
}
