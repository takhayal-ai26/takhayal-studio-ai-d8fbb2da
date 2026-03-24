import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, Image, Filter, Grid3X3, List, Copy, Trash2 } from 'lucide-react';

const mediaItems = [
  { id: '1', name: 'ramadan-banner.jpg', type: 'Banner', size: '420 KB', date: '2026-03-01', usage: 'Home' },
  { id: '2', name: 'generate-tool-cover.jpg', type: 'Tool Cover', size: '380 KB', date: '2026-02-15', usage: 'Tools' },
  { id: '3', name: 'upscale-tool-cover.jpg', type: 'Tool Cover', size: '350 KB', date: '2026-02-15', usage: 'Tools' },
  { id: '4', name: 'template-perfume.jpg', type: 'Template', size: '290 KB', date: '2026-01-20', usage: 'Templates' },
  { id: '5', name: 'template-fashion.jpg', type: 'Template', size: '310 KB', date: '2026-01-20', usage: 'Templates' },
  { id: '6', name: 'logo-full.svg', type: 'Brand', size: '12 KB', date: '2025-10-01', usage: 'Global' },
  { id: '7', name: 'hero-bg.jpg', type: 'Background', size: '680 KB', date: '2025-11-15', usage: 'Landing' },
  { id: '8', name: 'community-featured-1.jpg', type: 'Community', size: '450 KB', date: '2026-03-20', usage: 'Community' },
];

export default function AdminMedia() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Centralized asset management for the platform</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Upload size={14} /> Upload Asset</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Assets', value: '284' },
          { label: 'Storage Used', value: '1.2 GB' },
          { label: 'Recent Uploads', value: '12' },
        ].map(s => (
          <Card key={s.label} className="border-border/40 bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Image size={16} className="text-primary" /></div>
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
          <Input placeholder="Search assets..." className="pl-9 h-9 text-sm bg-muted/30" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Filter size={14} /> Filter</Button>
      </div>

      {/* Grid of media items */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mediaItems.map(item => (
          <Card key={item.id} className="border-border/40 bg-card/50 overflow-hidden group hover:ring-1 hover:ring-primary/20 transition-all">
            <div className="aspect-square bg-muted/20 flex items-center justify-center relative">
              <Image size={32} className="text-muted-foreground/30" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-white/10"><Copy size={14} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-white/10"><Trash2 size={14} /></Button>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-[12px] font-medium truncate">{item.name}</p>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="outline" className="text-[9px]">{item.type}</Badge>
                <span className="text-[10px] text-muted-foreground">{item.size}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
