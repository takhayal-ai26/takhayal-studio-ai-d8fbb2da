import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Palette, ShoppingCart, Layers,
  BarChart3, Settings, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Pricing', icon: ShoppingCart, path: '/admin/pricing' },
  { label: 'Models', icon: Palette, path: '/admin/models' },
  { label: 'Tools', icon: Layers, path: '/admin/tools' },
  { label: 'Templates', icon: Layers, path: '/admin/templates' },
  { label: 'Community', icon: Users, path: '/admin/community' },
  { label: 'Content', icon: Layers, path: '/admin/content' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-foreground">
              Takhayal <span className="text-primary">Admin</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              const btn = (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg text-[13px] font-medium transition-all duration-200',
                    collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                    active
                      ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.15)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  <item.icon size={18} className={active ? 'text-primary' : ''} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return btn;
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-border p-2">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'flex items-center gap-3 w-full rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors',
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span>Back to App</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6 lg:p-8 max-w-[1400px]">
            <Outlet />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
