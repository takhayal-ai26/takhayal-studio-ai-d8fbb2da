import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, BarChart3, Eye, Zap, ArrowUpRight, Trash2, Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers, Loader2 } from 'lucide-react';
import { useToolsDB, ToolRecord } from '@/hooks/useToolsDB';
import { useToolProviders } from '@/hooks/useToolProviders';
import AdminToolEditorDialog from '@/components/admin/AdminToolEditorDialog';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LucideIcon } from 'lucide-react';

const iconLookup: Record<string, LucideIcon> = {
  Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers,
};

export default function AdminTools() {
  const { rawTools, isLoading, updateTool, deleteTool: deleteToolMutation } = useToolsDB();
  const { providers: allProviders } = useToolProviders();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolRecord | null>(null);

  // Tool runs stats
  const { data: runStats = [] } = useQuery({
    queryKey: ['tool-run-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tool_runs')
        .select('tool_slug, status, credits_charged, revenue')
        .order('created_at', { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rawTools;
    const q = search.toLowerCase();
    return rawTools.filter(t =>
      t.title_en.toLowerCase().includes(q) ||
      t.title_ar.includes(q) ||
      t.slug.includes(q)
    );
  }, [rawTools, search]);

  const stats = useMemo(() => {
    const active = rawTools.filter(t => t.active).length;
    const totalRuns = runStats.length;
    const completedRuns = runStats.filter((r: any) => r.status === 'completed').length;
    const totalRevenue = runStats.reduce((s: number, r: any) => s + (Number(r.revenue) || 0), 0);
    return [
      { label: 'Active Tools', value: String(active), icon: Zap },
      { label: 'Total Runs', value: totalRuns.toLocaleString(), icon: Eye },
      { label: 'Completed', value: completedRuns.toLocaleString(), icon: BarChart3 },
      { label: 'Revenue (USD)', value: `$${totalRevenue.toFixed(2)}`, icon: ArrowUpRight },
    ];
  }, [rawTools, runStats]);

  const handleToggleActive = (tool: ToolRecord) => {
    updateTool.mutate({ id: tool.id, updates: { active: !tool.active } });
  };

  const handleToggleFeatured = (tool: ToolRecord) => {
    updateTool.mutate({ id: tool.id, updates: { featured: !tool.featured } });
  };

  const handleDelete = (tool: ToolRecord) => {
    deleteToolMutation.mutate(tool.id, {
      onSuccess: () => toast({ title: 'Tool deleted', description: `"${tool.title_en}" has been removed.` }),
    });
  };

  const openEdit = (tool: ToolRecord) => {
    setEditingTool(tool);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingTool(null);
    setDialogOpen(true);
  };

  const getToolRunCount = (slug: string) => runStats.filter((r: any) => r.tool_slug === slug).length;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tools, providers, pricing, and performance</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openAdd}><Plus size={14} /> Add Tool</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">All Tools ({filtered.length})</CardTitle>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs w-56 bg-muted/30" />
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Tool</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Arabic</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Credits</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Provider</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Runs</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Featured</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(tool => {
              const Icon = iconLookup[tool.icon_name] || Sparkles;
              return (
                <TableRow key={tool.id} className="border-border/20 hover:bg-muted/20 cursor-pointer" onClick={() => openEdit(tool)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><Icon size={16} className="text-primary" /></div>
                      <div>
                        <p className="text-[13px] font-medium">{tool.title_en}</p>
                        <p className="text-[11px] text-muted-foreground">{tool.short_desc_en}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span dir="rtl" className="text-[13px]">{tool.title_ar || <span className="text-yellow-500 text-[11px]">Missing</span>}</span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{tool.default_credit_cost} credits</Badge></TableCell>
                  <TableCell>
                    <div>
                      <p className="text-[12px] text-muted-foreground">{tool.provider_name}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono">{tool.provider_endpoint}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px]">{getToolRunCount(tool.slug)}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Switch checked={tool.active} onCheckedChange={() => handleToggleActive(tool)} className="scale-75" />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Switch checked={tool.featured} onCheckedChange={() => handleToggleFeatured(tool)} className="scale-75" />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tool)}><Edit size={12} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(tool)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No tools found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AdminToolEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tool={editingTool}
      />
    </div>
  );
}
