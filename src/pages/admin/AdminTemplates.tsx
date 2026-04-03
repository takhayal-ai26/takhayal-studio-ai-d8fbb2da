import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Copy, Star, MoreHorizontal, Trash2, FolderOpen, GripVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplateEditorDialog from '@/components/admin/TemplateEditorDialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DBTemplate {
  id: string;
  title_en: string;
  title_ar: string;
  category: string;
  cover_image_url: string;
  ratio: string;
  width?: number | null;
  height?: number | null;
  prompt: string;
  prompt_ar: string;
  active: boolean;
  featured: boolean;
  show_on_studio: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  default_model_id: string | null;
}

interface DBCategory {
  id: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
  active: boolean;
}

/* ─── Category Editor Dialog ─── */
function CategoryEditorDialog({
  open, onOpenChange, category, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: DBCategory | null;
  onSave: (c: Omit<DBCategory, 'id'> & { id?: string }) => void;
}) {
  const isEdit = !!category?.id;
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open) {
      setNameEn(category?.name_en || '');
      setNameAr(category?.name_ar || '');
      setSortOrder(category?.sort_order ?? 0);
      setActive(category?.active ?? true);
    }
  }, [open, category]);

  const handleSave = () => {
    if (!nameEn.trim()) {
      toast({ title: 'Error', description: 'English name is required', variant: 'destructive' });
      return;
    }
    onSave({ id: category?.id, name_en: nameEn.trim(), name_ar: nameAr.trim(), sort_order: sortOrder, active });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border/40">
        <DialogHeader>
          <DialogTitle className="text-lg">{isEdit ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? 'Update category details' : 'Add a new template category'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name (English)</Label>
              <Input value={nameEn} onChange={e => setNameEn(e.target.value)} className="h-9 text-sm bg-muted/30 border-border/40" placeholder="e.g. Fashion" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name (Arabic)</Label>
              <Input dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} className="h-9 text-sm bg-muted/30 border-border/40 text-right" placeholder="مثال: أزياء" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} className="h-9 text-sm bg-muted/30 border-border/40" />
            </div>
            <div className="flex items-center justify-between pt-5">
              <Label className="text-xs">Active</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Create Category'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Categories Tab ─── */
function CategoriesTab({ categories, onRefresh }: { categories: DBCategory[]; onRefresh: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DBCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DBCategory | null>(null);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: DBCategory) => { setEditing(c); setDialogOpen(true); };

  const handleSave = async (c: Omit<DBCategory, 'id'> & { id?: string }) => {
    if (c.id) {
      await supabase.from('template_categories').update({
        name_en: c.name_en,
        name_ar: c.name_ar,
        sort_order: c.sort_order,
        active: c.active,
        updated_at: new Date().toISOString(),
      } as any).eq('id', c.id);
      toast({ title: 'Category updated' });
    } else {
      await supabase.from('template_categories').insert({
        name_en: c.name_en,
        name_ar: c.name_ar,
        sort_order: c.sort_order,
        active: c.active,
      } as any);
      toast({ title: 'Category created' });
    }
    onRefresh();
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await supabase.from('template_categories').delete().eq('id', deleteConfirm.id);
    toast({ title: 'Category deleted' });
    setDeleteConfirm(null);
    onRefresh();
  };

  const toggleActive = async (c: DBCategory) => {
    await supabase.from('template_categories').update({ active: !c.active, updated_at: new Date().toISOString() } as any).eq('id', c.id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Template Categories ({categories.length})</p>
          <p className="text-xs text-muted-foreground mt-0.5">Categories appear as filter pills on the Templates page</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openCreate}><Plus size={14} /> Add Category</Button>
      </div>

      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase text-muted-foreground w-12">Order</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Name (EN)</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Name (AR)</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Templates</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(c => (
              <TableRow key={c.id} className="border-border/20 hover:bg-muted/20 cursor-pointer" onClick={() => openEdit(c)}>
                <TableCell className="text-xs text-muted-foreground font-mono">{c.sort_order}</TableCell>
                <TableCell className="text-[13px] font-medium">{c.name_en}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground" dir="rtl">{c.name_ar || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">—</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} className="scale-75" />
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => openEdit(c)}><Edit size={12} /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => setDeleteConfirm(c)}>
                        <Trash2 size={12} /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No categories yet. Add your first category.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <CategoryEditorDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} onSave={handleSave} />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Category</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete "{deleteConfirm?.name_en}"? Templates using this category won't be deleted but will need reassignment.
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

/* ─── Main Component ─── */
export default function AdminTemplates({ embedded }: { embedded?: boolean } = {}) {
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DBTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('templates');

  const fetchData = async () => {
    const [tplRes, catRes] = await Promise.all([
      supabase.from('templates').select('*').order('sort_order'),
      supabase.from('template_categories').select('*').order('sort_order'),
    ]);
    if (tplRes.data) setTemplates(tplRes.data as any[]);
    if (catRes.data) setCategories(catRes.data as any[]);
  };

  useEffect(() => { fetchData(); }, []);

  const categoryNames = useMemo(() => categories.map(c => c.name_en), [categories]);

  // Count templates per category
  const categoriesWithCount = useMemo(() => {
    return categories.map(c => ({
      ...c,
      templateCount: templates.filter(t => t.category === c.name_en).length,
    }));
  }, [categories, templates]);

  const filtered = useMemo(() => {
    let list = templates;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title_en.toLowerCase().includes(q) || t.title_ar.includes(q) || t.category.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') list = list.filter(t => t.category === categoryFilter);
    if (statusFilter === 'featured') list = list.filter(t => t.featured);
    if (statusFilter === 'active') list = list.filter(t => t.active);
    if (statusFilter === 'inactive') list = list.filter(t => !t.active);
    return list;
  }, [templates, search, categoryFilter, statusFilter]);

  const toggleField = async (id: string, field: 'active' | 'featured', current: boolean) => {
    await supabase.from('templates').update({ [field]: !current, updated_at: new Date().toISOString() } as any).eq('id', id);
    fetchData();
  };

  const handleDuplicate = async (t: DBTemplate) => {
    const dup = { ...t, title_en: `${t.title_en} (Copy)`, title_ar: t.title_ar ? `${t.title_ar} (نسخة)` : '', featured: false, sort_order: t.sort_order + 1 };
    delete (dup as any).id;
    delete (dup as any).created_at;
    delete (dup as any).updated_at;
    await supabase.from('templates').insert(dup as any);
    fetchData();
    toast({ title: 'Template duplicated' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await supabase.from('templates').delete().eq('id', deleteConfirm.id);
    fetchData();
    toast({ title: 'Template deleted' });
    setDeleteConfirm(null);
  };

  const openEdit = (t: DBTemplate) => { setEditingTemplate(t); setDialogOpen(true); };
  const openCreate = () => { setEditingTemplate(null); setDialogOpen(true); };

  const handleSave = async (t: any) => {
    if (t.id && templates.find(x => x.id === t.id)) {
      const { id, created_at, ...updates } = t;
      await supabase.from('templates').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
    } else {
      const { id, created_at, updated_at, ...insertData } = t;
      await supabase.from('templates').insert(insertData as any);
    }
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage template gallery and categories</p>
        </div>
        {activeTab === 'templates' && (
          <Button size="sm" className="gap-1.5 text-xs" onClick={openCreate}><Plus size={14} /> Create Template</Button>
        )}
      </div>

      {/* Sub-tabs: Templates / Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="templates" className="text-xs gap-1.5">Templates</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs gap-1.5"><FolderOpen size={14} /> Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border/40 bg-card/50"><CardContent className="p-4"><p className="text-lg font-bold">{templates.length}</p><p className="text-[11px] text-muted-foreground">Total Templates</p></CardContent></Card>
            <Card className="border-border/40 bg-card/50"><CardContent className="p-4"><p className="text-lg font-bold">{templates.filter(t => t.featured).length}</p><p className="text-[11px] text-muted-foreground">Featured</p></CardContent></Card>
            <Card className="border-border/40 bg-card/50"><CardContent className="p-4"><p className="text-lg font-bold">{templates.filter(t => t.active).length}</p><p className="text-[11px] text-muted-foreground">Active</p></CardContent></Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search templates..." className="pl-9 h-9 text-sm bg-muted/30" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-36 text-xs bg-muted/30 border-border/40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 text-xs bg-muted/30 border-border/40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="border-border/40 bg-card/50 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">All Templates ({filtered.length})</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Template</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Category</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Ratio</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Featured</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id} className="border-border/20 hover:bg-muted/20 cursor-pointer" onClick={() => openEdit(t)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {t.cover_image_url && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/30 flex-shrink-0">
                            <img src={t.cover_image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="text-[13px] font-medium">{t.title_en}</p>
                          {t.title_ar && <p className="text-[11px] text-muted-foreground" dir="rtl">{t.title_ar}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{t.category}</Badge></TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{t.ratio}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Switch checked={t.featured} onCheckedChange={() => toggleField(t.id, 'featured', t.featured)} className="scale-75" />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Switch checked={t.active} onCheckedChange={() => toggleField(t.id, 'active', t.active)} className="scale-75" />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => openEdit(t)}><Edit size={12} /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => handleDuplicate(t)}><Copy size={12} /> Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => setDeleteConfirm({ id: t.id, name: t.title_en })}>
                            <Trash2 size={12} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No templates found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab categories={categories} onRefresh={fetchData} />
        </TabsContent>
      </Tabs>

      <TemplateEditorDialog open={dialogOpen} onOpenChange={setDialogOpen} template={editingTemplate} onSave={handleSave} categories={categoryNames} />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Template</DialogTitle>
            <DialogDescription className="text-xs">Are you sure you want to delete "{deleteConfirm?.name}"? This cannot be undone.</DialogDescription>
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