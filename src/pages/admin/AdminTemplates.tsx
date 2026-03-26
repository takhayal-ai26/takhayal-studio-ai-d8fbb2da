import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Copy, Archive, Eye, BarChart3, Star, MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAdminTemplatesStore, AdminTemplate, CATEGORIES } from '@/stores/adminTemplatesStore';
import TemplateEditorDialog from '@/components/admin/TemplateEditorDialog';
import { toast } from '@/hooks/use-toast';

export default function AdminTemplates() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, toggleFeatured, toggleSeasonal, toggleActive } = useAdminTemplatesStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    let list = templates;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.en.toLowerCase().includes(q) || t.title.ar.includes(q) ||
        t.category.toLowerCase().includes(q) || t.tags.some(tag => tag.en.toLowerCase().includes(q) || tag.ar.includes(q))
      );
    }
    if (categoryFilter !== 'all') list = list.filter(t => t.category === categoryFilter);
    if (statusFilter === 'featured') list = list.filter(t => t.featured);
    if (statusFilter === 'seasonal') list = list.filter(t => t.seasonal);
    if (statusFilter === 'active') list = list.filter(t => t.active);
    if (statusFilter === 'inactive') list = list.filter(t => !t.active);
    return list;
  }, [templates, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalViews = templates.reduce((s, t) => s + t.analytics.views, 0);
    const totalUses = templates.reduce((s, t) => s + t.analytics.uses, 0);
    const avgRate = templates.length ? Math.round(totalUses / totalViews * 100) : 0;
    return [
      { label: 'Total Templates', value: String(templates.length), icon: Star },
      { label: 'Featured', value: String(templates.filter(t => t.featured).length), icon: Star },
      { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye },
      { label: 'Avg Use Rate', value: `${avgRate}%`, icon: BarChart3 },
    ];
  }, [templates]);

  const handleSave = (t: AdminTemplate) => {
    const exists = templates.find(x => x.id === t.id);
    if (exists) updateTemplate(t.id, t);
    else addTemplate(t);
  };

  const openEdit = (t: AdminTemplate) => { setEditingTemplate(t); setDialogOpen(true); };
  const openCreate = () => { setEditingTemplate(null); setDialogOpen(true); };

  const handleDuplicate = (id: string) => {
    duplicateTemplate(id);
    toast({ title: 'Template duplicated', description: 'A copy has been created.' });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteTemplate(deleteConfirm.id);
    toast({ title: 'Template deleted', description: `"${deleteConfirm.name}" removed.` });
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage template library, categories, and performance</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openCreate}><Plus size={14} /> Create Template</Button>
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

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-9 h-9 text-sm bg-muted/30" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-36 text-xs bg-muted/30 border-border/40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36 text-xs bg-muted/30 border-border/40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="seasonal">Seasonal</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">All Templates ({filtered.length})</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
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
              <TableRow key={t.id} className="border-border/20 hover:bg-muted/20 cursor-pointer" onClick={() => openEdit(t)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {t.thumbnail && (
                      <div className="w-9 h-9 rounded-md overflow-hidden border border-border/30 flex-shrink-0">
                        <img src={t.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] font-medium">{t.title.en}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{t.shortDescription.en || t.fullPrompt.en}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{t.category}</Badge></TableCell>
                <TableCell className="text-[13px]">{t.analytics.views.toLocaleString()}</TableCell>
                <TableCell className="text-[13px]">{t.analytics.uses.toLocaleString()}</TableCell>
                <TableCell className="text-[13px] font-medium text-primary">{t.analytics.useRate}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Switch checked={t.featured} onCheckedChange={() => toggleFeatured(t.id)} className="scale-75" />
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Switch checked={t.seasonal} onCheckedChange={() => toggleSeasonal(t.id)} className="scale-75" />
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Switch checked={t.active} onCheckedChange={() => toggleActive(t.id)} className="scale-75" />
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => openEdit(t)}><Edit size={12} /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => handleDuplicate(t.id)}><Copy size={12} /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2"><Eye size={12} /> Preview</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => setDeleteConfirm({ id: t.id, name: t.title.en })}>
                        <Trash2 size={12} /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                  No templates found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <TemplateEditorDialog open={dialogOpen} onOpenChange={setDialogOpen} template={editingTemplate} onSave={handleSave} />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Template</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" className="text-xs" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
