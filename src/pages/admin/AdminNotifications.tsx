import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Bell, Megaphone, AlertTriangle, Rocket } from 'lucide-react';
import PromoBannerEditor from '@/components/admin/PromoBannerEditor';

const notifications = [
  { id: '1', title: 'Ramadan Special Offer', message: 'Get 50% more credits this Ramadan!', type: 'Campaign', audience: 'All users', status: 'active', startDate: '2026-03-01', endDate: '2026-04-01', dismissible: true, priority: 'normal' },
  { id: '2', title: 'System Maintenance', message: 'Scheduled maintenance on March 28th', type: 'Maintenance', audience: 'All users', status: 'scheduled', startDate: '2026-03-27', endDate: '2026-03-28', dismissible: true, priority: 'high' },
  { id: '3', title: 'New Tool: Enhance Image', message: 'Try our new AI-powered image enhancement tool', type: 'Launch', audience: 'Pro users', status: 'active', startDate: '2026-03-15', endDate: '2026-04-15', dismissible: true, priority: 'normal' },
  { id: '4', title: 'Low Credits Reminder', message: 'Your credits are running low, top up now!', type: 'Reminder', audience: 'Low credit users', status: 'active', startDate: '-', endDate: '-', dismissible: false, priority: 'normal' },
];

const typeIcon: Record<string, typeof Bell> = {
  Campaign: Megaphone, Maintenance: AlertTriangle, Launch: Rocket, Reminder: Bell,
};

const statusStyle: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  draft: 'bg-muted/30 text-muted-foreground border-border/40',
  expired: 'bg-muted/30 text-muted-foreground border-border/40',
};

export default function AdminNotifications({ embedded }: { embedded?: boolean } = {}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage banners, alerts, and in-app messaging</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Create Notification</Button>
      </div>

      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Notification</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Type</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Audience</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Date Range</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Dismissible</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map(n => {
              const Icon = typeIcon[n.type] || Bell;
              return (
                <TableRow key={n.id} className="border-border/20 hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/10"><Icon size={14} className="text-primary" /></div>
                      <div>
                        <p className="text-[13px] font-medium">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{n.message}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{n.type}</Badge></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{n.audience}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusStyle[n.status]}`}>{n.status}</Badge></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{n.startDate === '-' ? 'Always' : `${n.startDate} — ${n.endDate}`}</TableCell>
                  <TableCell><Switch defaultChecked={n.dismissible} className="scale-75" /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Edit size={12} /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
