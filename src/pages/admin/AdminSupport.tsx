import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Bug, Flag, RotateCcw, Lightbulb, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const tickets = [
  { id: 'TK-481', user: 'Ahmed K.', type: 'Support', priority: 'medium', subject: 'Cannot download generated images', status: 'open', assigned: 'Unassigned', date: '2h ago' },
  { id: 'TK-480', user: 'Sara M.', type: 'Bug', priority: 'high', subject: 'Upscale tool returns blank image', status: 'in_progress', assigned: 'Admin', date: '5h ago' },
  { id: 'TK-479', user: 'Omar H.', type: 'Refund', priority: 'high', subject: 'Charged twice for Pro subscription', status: 'open', assigned: 'Unassigned', date: '8h ago' },
  { id: 'TK-478', user: 'Layla I.', type: 'Abuse', priority: 'critical', subject: 'User generating inappropriate content', status: 'in_progress', assigned: 'Admin', date: '1d ago' },
  { id: 'TK-477', user: 'Karim S.', type: 'Feature', priority: 'low', subject: 'Request: batch generation mode', status: 'backlog', assigned: 'Unassigned', date: '2d ago' },
];

const priorityStyle: Record<string, string> = {
  low: 'bg-muted/30 text-muted-foreground border-border/40',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusStyle: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  backlog: 'bg-muted/30 text-muted-foreground border-border/40',
};

const typeIcon: Record<string, typeof MessageSquare> = {
  Support: MessageSquare, Bug: Bug, Refund: RotateCcw, Abuse: Flag, Feature: Lightbulb,
};

export default function AdminSupport() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-heading-page">Support & Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage tickets, bug reports, abuse reports, and feature requests</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Open', value: '12', icon: MessageSquare },
          { label: 'In Progress', value: '5', icon: Bug },
          { label: 'Refund Requests', value: '3', icon: RotateCcw },
          { label: 'Abuse Reports', value: '2', icon: Flag },
          { label: 'Feature Requests', value: '18', icon: Lightbulb },
        ].map(s => (
          <Card key={s.label} className="border-border/40 bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><s.icon size={16} className="text-primary" /></div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tickets..." className="pl-9 h-9 text-sm bg-muted/30" />
        </div>
      </div>

      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">ID</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">User</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Type</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Subject</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Priority</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Assigned</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map(t => {
              const Icon = typeIcon[t.type] || MessageSquare;
              return (
                <TableRow key={t.id} className="border-border/20 hover:bg-muted/20">
                  <TableCell className="text-[12px] font-mono text-muted-foreground">{t.id}</TableCell>
                  <TableCell className="text-[13px] font-medium">{t.user}</TableCell>
                  <TableCell><div className="flex items-center gap-1.5"><Icon size={12} className="text-muted-foreground" /><span className="text-[12px]">{t.type}</span></div></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground max-w-[200px] truncate">{t.subject}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${priorityStyle[t.priority]}`}>{t.priority}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusStyle[t.status]}`}>{t.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{t.assigned}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem className="text-xs">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs">Assign</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs">Resolve</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs text-destructive">Close</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
