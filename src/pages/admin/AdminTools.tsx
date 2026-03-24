import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, BarChart3, Eye, Zap, ArrowUpRight } from 'lucide-react';
import { TOOLS } from '@/data/tools';

const toolAnalytics: Record<string, { visits: number; conversions: number; generations: number; revenue: string }> = {
  generate: { visits: 8420, conversions: 4812, generations: 4200, revenue: '$8,400' },
  upscale: { visits: 3210, conversions: 1890, generations: 1650, revenue: '$4,950' },
  logo: { visits: 2840, conversions: 1240, generations: 980, revenue: '$2,940' },
  'remove-bg': { visits: 5120, conversions: 3410, generations: 3100, revenue: '$3,100' },
  enhance: { visits: 2190, conversions: 1340, generations: 1180, revenue: '$2,360' },
};

export default function AdminTools() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage image tools, configurations, and performance</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Add Tool</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Tools', value: '5', icon: Zap },
          { label: 'Total Visits Today', value: '21,780', icon: Eye },
          { label: 'Generations Today', value: '11,110', icon: BarChart3 },
          { label: 'Tool Revenue', value: '$21,750', icon: ArrowUpRight },
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

      {/* Tools Table */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">All Tools</CardTitle>
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search tools..." className="pl-9 h-8 text-xs w-48 bg-muted/30" /></div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Tool</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Credit Cost</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Input</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Visits</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Conversions</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Revenue</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Featured</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {TOOLS.map(tool => {
              const analytics = toolAnalytics[tool.id] || { visits: 0, conversions: 0, generations: 0, revenue: '$0' };
              return (
                <TableRow key={tool.id} className="border-border/20 hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><tool.icon size={16} className="text-primary" /></div>
                      <div>
                        <p className="text-[13px] font-medium">{tool.name}</p>
                        <p className="text-[11px] text-muted-foreground">{tool.shortDesc}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{tool.creditCost} credits</Badge></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground capitalize">{tool.inputType}</TableCell>
                  <TableCell className="text-[13px]">{analytics.visits.toLocaleString()}</TableCell>
                  <TableCell className="text-[13px]">{analytics.conversions.toLocaleString()}</TableCell>
                  <TableCell className="text-[13px] font-medium text-primary">{analytics.revenue}</TableCell>
                  <TableCell><Switch defaultChecked className="scale-75" /></TableCell>
                  <TableCell><Switch defaultChecked className="scale-75" /></TableCell>
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
