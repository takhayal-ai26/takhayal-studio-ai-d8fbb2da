import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Layers, Calendar, Eye } from 'lucide-react';

const contentBlocks = [
  { id: '1', title: 'Ramadan Campaign Banner', location: 'Home', type: 'Banner', status: 'active', startDate: '2026-03-01', endDate: '2026-04-01', visible: true },
  { id: '2', title: 'Homepage Hero Promo', location: 'Landing', type: 'Hero', status: 'active', startDate: '-', endDate: '-', visible: true },
  { id: '3', title: 'Tools Section Intro', location: 'Home', type: 'Section Header', status: 'active', startDate: '-', endDate: '-', visible: true },
  { id: '4', title: 'Summer Sale Offer', location: 'Landing', type: 'Banner', status: 'draft', startDate: '2026-06-01', endDate: '2026-06-30', visible: false },
  { id: '5', title: 'Featured Works Section', location: 'Home', type: 'Content Block', status: 'active', startDate: '-', endDate: '-', visible: true },
  { id: '6', title: 'Limited Time Pro Discount', location: 'Pricing', type: 'Banner', status: 'scheduled', startDate: '2026-04-01', endDate: '2026-04-15', visible: false },
];

const statusStyle: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  draft: 'bg-muted/30 text-muted-foreground border-border/40',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function AdminContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage banners, sections, and dynamic content across the platform</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Add Content Block</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Blocks', value: '12', icon: Layers },
          { label: 'Scheduled', value: '3', icon: Calendar },
          { label: 'Seasonal Active', value: '2', icon: Eye },
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

      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Content Block</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Location</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Type</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Date Range</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Visible</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contentBlocks.map(c => (
              <TableRow key={c.id} className="border-border/20 hover:bg-muted/20">
                <TableCell className="text-[13px] font-medium">{c.title}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{c.location}</Badge></TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{c.type}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusStyle[c.status]}`}>{c.status}</Badge></TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{c.startDate === '-' ? 'Always' : `${c.startDate} — ${c.endDate}`}</TableCell>
                <TableCell><Switch defaultChecked={c.visible} className="scale-75" /></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Edit size={12} /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
