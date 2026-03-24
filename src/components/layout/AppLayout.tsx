import { Outlet } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { AuthModal } from '@/components/AuthModal';

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNavbar />
      <AuthModal />
      <Outlet />
    </div>
  );
}
