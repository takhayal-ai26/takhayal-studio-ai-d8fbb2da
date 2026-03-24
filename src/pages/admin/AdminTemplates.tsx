import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Copy, Archive, Eye, BarChart3, Star } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

const templates = [
  { id: '1', title: 'Luxury Perfume Ad', category: 'Ads', prompt: 'Luxury perfume bottle, dramatic studio lighting...', views: 2840, uses: 1420, rate: '50%', featured: true, seasonal: false, active: true },
  { id: '2', title: 'Ramadan Lantern Scene', category: 'Seasonal', prompt: 'Golden Ramadan lanterns, warm ambient glow...', views: 4210, uses: 2680, rate: '64%', featured: true, seasonal: true, active: true },
  { id: '3', title: 'Fashion Editorial', category: 'Fashion', prompt: 'High-end fashion editorial, soft diffused light...', views: 1890, uses: 920, rate: '49%', featured: false, seasonal: false, active: true },
  { id: '4', title: 'Modern Restaurant', category: 'Food', prompt: 'Modern restaurant, appetizing food shot...', views: 1560, uses: 780, rate: '50%', featured: false, seasonal: false, active: true },
  { id: '5', title: 'Tech Product Float', category: 'Product', prompt: 'Tech product floating on gradient, 3D render...', views: 2100, uses: 1050, rate: '50%', featured: true, seasonal: false, active: true },
  { id: '6', title: 'Arabic Calligraphy Logo', category: 'Logo', prompt: 'Arabic calligraphy logo, modern twist...', views: 3200, uses: 1800, rate: '56%', featured: false, seasonal: false, active: true },
];

export default function AdminTemplates() {
  const [search, setSearch] = useState('');
  const filtered = templates.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage template library, categories, and performance</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Create Template</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Templates', value: '124', icon: Star },
          { label: 'Featured', value: '18', icon: Star },
          { label: 'Total Views', value: '84,200', icon: Eye },
          { label: 'Avg Use Rate', value: '52%', icon: BarChart3 },
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
          <Input placeholder="Search templates..." className="pl-9 h-9 text-sm bg-muted/30" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Template</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Category</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Views</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Uses</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Rate</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Featured</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Seasonal</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id} className="border-border/20 hover:bg-muted/20">
                <TableCell>
                  <div>
                    <p className="text-[13px] font-medium">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{t.prompt}</p>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{t.category}</Badge></TableCell>
                <TableCell className="text-[13px]">{t.views.toLocaleString()}</TableCell>
                <TableCell className="text-[13px]">{t.uses.toLocaleString()}</TableCell>
                <TableCell className="text-[13px] font-medium text-primary">{t.rate}</TableCell>
                <TableCell><Switch defaultChecked={t.featured} className="scale-75" /></TableCell>
                <TableCell>{t.seasonal && <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Seasonal</Badge>}</TableCell>
                <TableCell><Switch defaultChecked={t.active} className="scale-75" /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-xs gap-2"><Edit size={12} /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2"><Copy size={12} /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2"><Eye size={12} /> Preview</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2 text-destructive"><Archive size={12} /> Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
