import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, BarChart3, Eye, Zap, ArrowUpRight, Trash2, Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers } from 'lucide-react';
import { useAdminToolsStore, AdminTool } from '@/stores/adminToolsStore';
import ToolEditorDialog from '@/components/admin/ToolEditorDialog';
import { toast } from '@/hooks/use-toast';
import type { LucideIcon } from 'lucide-react';

const iconLookup: Record<string, LucideIcon> = {
  Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers,
};

export default function AdminTools() {
  const { tools, addTool, updateTool, toggleActive, toggleFeatured, deleteTool } = useAdminToolsStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AdminTool | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return tools;
    const q = search.toLowerCase();
    return tools.filter(t =>
      t.name.en.toLowerCase().includes(q) ||
      t.name.ar.includes(q) ||
      t.inputType.includes(q)
    );
  }, [tools, search]);

  const stats = useMemo(() => {
    const active = tools.filter(t => t.active).length;
    const totalVisits = tools.reduce((s, t) => s + t.analytics.visits, 0);
    const totalGens = tools.reduce((s, t) => s + t.analytics.generations, 0);
    const totalRev = tools.reduce((s, t) => s + parseInt(t.analytics.revenue.replace(/[$,]/g, '') || '0'), 0);
    return [
      { label: 'Active Tools', value: String(active), icon: Zap },
      { label: 'Total Visits Today', value: totalVisits.toLocaleString(), icon: Eye },
      { label: 'Generations Today', value: totalGens.toLocaleString(), icon: BarChart3 },
      { label: 'Tool Revenue', value: `$${totalRev.toLocaleString()}`, icon: ArrowUpRight },
    ];
  }, [tools]);

  const handleSave = (tool: AdminTool) => {
    const exists = tools.find(t => t.id === tool.id);
    if (exists) {
      updateTool(tool.id, tool);
    } else {
      addTool(tool);
    }
  };

  const openEdit = (tool: AdminTool) => {
    setEditingTool(tool);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingTool(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    deleteTool(id);
    toast({ title: 'Tool deleted', description: `"${name}" has been removed.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage image tools, configurations, and performance</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openAdd}><Plus size={14} /> Add Tool</Button>
      </div>

      {/* Stats */}
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

      {/* Tools Table */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">All Tools ({filtered.length})</CardTitle>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs w-56 bg-muted/30"
            />
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Tool</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Arabic Name</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Credits</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Input</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Visits</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Revenue</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Featured</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(tool => {
              const Icon = iconLookup[tool.iconName] || Sparkles;
              return (
                <TableRow
                  key={tool.id}
                  className="border-border/20 hover:bg-muted/20 cursor-pointer"
                  onClick={() => openEdit(tool)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><Icon size={16} className="text-primary" /></div>
                      <div>
                        <p className="text-[13px] font-medium">{tool.name.en}</p>
                        <p className="text-[11px] text-muted-foreground">{tool.shortDesc.en}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span dir="rtl" className="text-[13px]">{tool.name.ar || <span className="text-yellow-500 text-[11px]">Missing</span>}</span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{tool.creditCost} credits</Badge></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground capitalize">{tool.inputType}</TableCell>
                  <TableCell className="text-[13px]">{tool.analytics.visits.toLocaleString()}</TableCell>
                  <TableCell className="text-[13px] font-medium text-primary">{tool.analytics.revenue}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Switch
                      checked={tool.active}
                      onCheckedChange={() => toggleActive(tool.id)}
                      className="scale-75"
                    />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Switch
                      checked={tool.featured}
                      onCheckedChange={() => toggleFeatured(tool.id)}
                      className="scale-75"
                    />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tool)}>
                        <Edit size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(tool.id, tool.name.en)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                  No tools found matching "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ToolEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tool={editingTool}
        onSave={handleSave}
      />
    </div>
  );
}
