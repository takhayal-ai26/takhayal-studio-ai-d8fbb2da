import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import { useModelGuides, type ModelGuide } from '@/hooks/useModelGuides';
import { useModels } from '@/hooks/useModels';
import { useVideoModels } from '@/hooks/useVideoModels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EMPTY: Partial<ModelGuide> = {
  slug: '', type: 'image', active: true, featured: false,
  name_en: '', name_ar: '', title_en: '', title_ar: '',
  subtitle_en: '', subtitle_ar: '',
  short_description_en: '', short_description_ar: '',
  tags_en: [], tags_ar: [],
  main_image_url: '', icon_url: '', video_preview_url: '',
  comparison_enabled: false, comparison_images: [], comparison_model_ids: [],
  best_for_items: [],
  speed: 'fast', quality: 'high',
  best_for_line_en: '', best_for_line_ar: '',
  linked_model_id: null, sort_order: 0,
};

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export default function AdminModelGuide({ embedded }: { embedded?: boolean }) {
  const { guides, upsert, remove, refetch } = useModelGuides();
  const { models } = useModels();
  const { models: videoModels } = useVideoModels(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ModelGuide>>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tagInputEn, setTagInputEn] = useState('');
  const [tagInputAr, setTagInputAr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const compFileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const openNew = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (g: ModelGuide) => { setForm({ ...g }); setOpen(true); };

  const uploadImage = useCallback(async (file: File, prefix: string) => {
    const ext = file.name.split('.').pop();
    const path = `${prefix}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('model-guide-images').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('model-guide-images').getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const handleMainImage = async (file: File) => {
    setUploading(true);
    try { const url = await uploadImage(file, 'main'); set('main_image_url', url); } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleIconImage = async (file: File) => {
    setUploading(true);
    try { const url = await uploadImage(file, 'icons'); set('icon_url', url); } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleCompImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, 'comparison');
      set('comparison_images', [...(form.comparison_images || []), { url, model_name: '', tag: '' }]);
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const validate = () => {
    if (!form.name_en) { toast.error('Name (EN) is required'); return false; }
    if (!form.slug) { toast.error('Slug is required'); return false; }
    if (!form.short_description_en) { toast.error('Description (EN) is required'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try { await upsert(form as any); toast.success('Saved'); setOpen(false); } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this model guide?')) return;
    try { await remove(id); toast.success('Deleted'); } catch (e: any) { toast.error(e.message); }
  };

  const addBestFor = () => set('best_for_items', [...(form.best_for_items || []), { title_en: '', title_ar: '', description_en: '', description_ar: '' }]);
  const updateBestFor = (idx: number, k: string, v: string) => {
    const items = [...(form.best_for_items || [])];
    (items[idx] as any)[k] = v;
    set('best_for_items', items);
  };
  const removeBestFor = (idx: number) => set('best_for_items', (form.best_for_items || []).filter((_, i) => i !== idx));

  const addTag = (field: 'tags_en' | 'tags_ar', val: string) => {
    if (!val.trim()) return;
    const tags = [...(form[field] || [])];
    if (tags.length < 5) tags.push(val.trim());
    set(field, tags);
    field === 'tags_en' ? setTagInputEn('') : setTagInputAr('');
  };
  const removeTag = (field: 'tags_en' | 'tags_ar', idx: number) => set(field, (form[field] || []).filter((_, i) => i !== idx));

  // Sync: auto-create model guide entries for active models that don't have one
  const syncMissingModels = async () => {
    setSyncing(true);
    let count = 0;
    const existingSlugs = new Set(guides.map(g => g.slug));

    // Sync active image models from `models` table
    const activeImageModels = models.filter(m => m.is_active);
    for (const m of activeImageModels) {
      const slug = m.model_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (existingSlugs.has(slug)) continue;
      try {
        await upsert({
          slug,
          name_en: m.model_name,
          name_ar: '',
          type: m.media_type === 'video' ? 'video' : 'image',
          active: true,
          featured: false,
          title_en: m.model_name,
          title_ar: '',
          subtitle_en: m.best_for || '',
          subtitle_ar: m.best_for_ar || '',
          short_description_en: m.best_for || m.model_name,
          short_description_ar: m.best_for_ar || '',
          tags_en: [],
          tags_ar: [],
          main_image_url: m.preview_image_url || '',
          icon_url: '',
          video_preview_url: '',
          comparison_enabled: false,
          comparison_images: [],
          comparison_model_ids: [],
          best_for_items: [],
          speed: (m.speed as any) || 'fast',
          quality: 'high',
          best_for_line_en: m.best_for || '',
          best_for_line_ar: m.best_for_ar || '',
          linked_model_id: m.id,
          sort_order: 0,
        });
        existingSlugs.add(slug);
        count++;
      } catch (e) { console.error('Sync image model failed:', m.model_name, e); }
    }

    // Sync active video models from `video_models` table
    const activeVidModels = videoModels.filter(vm => vm.is_active);
    for (const vm of activeVidModels) {
      const slug = vm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (existingSlugs.has(slug)) continue;
      try {
        await upsert({
          slug,
          name_en: vm.display_name,
          name_ar: '',
          type: 'video',
          active: true,
          featured: false,
          title_en: vm.display_name,
          title_ar: '',
          subtitle_en: '',
          subtitle_ar: '',
          short_description_en: vm.display_name,
          short_description_ar: '',
          tags_en: [],
          tags_ar: [],
          main_image_url: vm.preview_image_url || '',
          icon_url: '',
          video_preview_url: '',
          comparison_enabled: false,
          comparison_images: [],
          comparison_model_ids: [],
          best_for_items: [],
          speed: 'fast',
          quality: 'high',
          best_for_line_en: '',
          best_for_line_ar: '',
          linked_model_id: null,
          sort_order: 0,
        });
        existingSlugs.add(slug);
        count++;
      } catch (e) { console.error('Sync video model failed:', vm.display_name, e); }
    }

    await refetch();
    setSyncing(false);
    if (count > 0) toast.success(`Added ${count} new model guide(s)`);
    else toast.info('All active models already have guides');
  };

  const isVideo = form.type === 'video';


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Model Guide</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage model pages content (EN + AR)</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={syncMissingModels} disabled={syncing} className="gap-1.5 text-xs">
            {syncing ? 'Syncing...' : 'Sync Active Models'}
          </Button>
          <Button size="sm" onClick={openNew} className="gap-1.5 text-xs"><Plus size={14} /> Add Model</Button>
        </div>
      </div>

      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Name</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Slug</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Type</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Featured</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {guides.map(g => (
              <TableRow key={g.id} className="border-border/20 hover:bg-muted/20">
                <TableCell className="text-[13px] font-medium">{g.name_en}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{g.slug}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[10px] ${g.type === 'video' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {g.type === 'video' ? 'Video' : 'Image'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch checked={g.featured} onCheckedChange={(v) => upsert({ id: g.id, featured: v })} className="scale-75" />
                </TableCell>
                <TableCell>
                  <Switch checked={g.active} onCheckedChange={(v) => upsert({ id: g.id, active: v })} className="scale-75" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}><Edit size={12} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(g.id)}><Trash2 size={12} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {guides.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No model guides yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Model Guide' : 'New Model Guide'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Name (EN) *</Label><Input value={form.name_en || ''} onChange={e => { set('name_en', e.target.value); if (!form.id) set('slug', slugify(e.target.value)); }} /></div>
                <div><Label className="text-xs">Name (AR)</Label><Input value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-xs">Slug *</Label><Input value={form.slug || ''} onChange={e => set('slug', e.target.value)} /></div>
                <div><Label className="text-xs">Sort Order</Label><Input type="number" value={form.sort_order || 0} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} /></div>
                <div>
                  <Label className="text-xs">Type *</Label>
                  <Select value={form.type || 'image'} onValueChange={v => set('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.active ?? true} onCheckedChange={v => set('active', v)} /> Active</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured ?? false} onCheckedChange={v => set('featured', v)} /> Featured</label>
              </div>
            </div>

            {/* Hero */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hero Section</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Title (EN)</Label><Input value={form.title_en || ''} onChange={e => set('title_en', e.target.value)} /></div>
                <div><Label className="text-xs">Title (AR)</Label><Input value={form.title_ar || ''} onChange={e => set('title_ar', e.target.value)} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Subtitle (EN)</Label><Input value={form.subtitle_en || ''} onChange={e => set('subtitle_en', e.target.value)} /></div>
                <div><Label className="text-xs">Subtitle (AR)</Label><Input value={form.subtitle_ar || ''} onChange={e => set('subtitle_ar', e.target.value)} dir="rtl" /></div>
              </div>

              {/* Main Image */}
              <div>
                <Label className="text-xs">Main Image</Label>
                <div
                  className="mt-1 border-2 border-dashed border-border/40 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleMainImage(f); }}
                >
                  {form.main_image_url ? (
                    <div className="relative inline-block">
                      <img src={form.main_image_url} alt="" className="max-h-40 rounded-lg mx-auto" />
                      <button onClick={e => { e.stopPropagation(); set('main_image_url', ''); }} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Click or drag & drop'}</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleMainImage(f); }} />
              </div>


              {/* Video Preview URL — only for video type */}
              {isVideo && (
                <div>
                  <Label className="text-xs">Video Preview URL</Label>
                  <Input value={form.video_preview_url || ''} onChange={e => set('video_preview_url', e.target.value)} placeholder="https://... .mp4" />
                  <p className="text-[10px] text-muted-foreground mt-1">Plays as hero preview on the model detail page</p>
                </div>
              )}
            </div>

            {/* Short Description */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Short Description</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">EN *</Label><Textarea value={form.short_description_en || ''} onChange={e => set('short_description_en', e.target.value)} rows={2} /></div>
                <div><Label className="text-xs">AR</Label><Textarea value={form.short_description_ar || ''} onChange={e => set('short_description_ar', e.target.value)} rows={2} dir="rtl" /></div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tags (max 5)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">EN</Label>
                  <div className="flex gap-2 flex-wrap mb-1">{(form.tags_en || []).map((t, i) => <Badge key={i} variant="secondary" className="gap-1 text-xs">{t}<button onClick={() => removeTag('tags_en', i)}><X size={10} /></button></Badge>)}</div>
                  <Input value={tagInputEn} onChange={e => setTagInputEn(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('tags_en', tagInputEn); }}} placeholder="Press Enter to add" />
                </div>
                <div>
                  <Label className="text-xs">AR</Label>
                  <div className="flex gap-2 flex-wrap mb-1">{(form.tags_ar || []).map((t, i) => <Badge key={i} variant="secondary" className="gap-1 text-xs">{t}<button onClick={() => removeTag('tags_ar', i)}><X size={10} /></button></Badge>)}</div>
                  <Input value={tagInputAr} onChange={e => setTagInputAr(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('tags_ar', tagInputAr); }}} placeholder="Press Enter to add" dir="rtl" />
                </div>
              </div>
            </div>

            {/* Best For */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Best For</h3>
                <Button size="sm" variant="outline" onClick={addBestFor} className="text-xs gap-1"><Plus size={12} /> Add</Button>
              </div>
              {(form.best_for_items || []).map((item, i) => (
                <div key={i} className="border border-border/30 rounded-lg p-3 space-y-2 relative">
                  <button onClick={() => removeBestFor(i)} className="absolute top-2 right-2 text-destructive"><X size={14} /></button>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Title EN" value={item.title_en} onChange={e => updateBestFor(i, 'title_en', e.target.value)} />
                    <Input placeholder="Title AR" value={item.title_ar} onChange={e => updateBestFor(i, 'title_ar', e.target.value)} dir="rtl" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Description EN" value={item.description_en} onChange={e => updateBestFor(i, 'description_en', e.target.value)} />
                    <Input placeholder="Description AR" value={item.description_ar} onChange={e => updateBestFor(i, 'description_ar', e.target.value)} dir="rtl" />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Speed</Label>
                  <Select value={form.speed || 'fast'} onValueChange={v => set('speed', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="slow">Slow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Quality</Label>
                  <Select value={form.quality || 'high'} onValueChange={v => set('quality', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="ultra">Ultra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Best For (EN)</Label><Input value={form.best_for_line_en || ''} onChange={e => set('best_for_line_en', e.target.value)} /></div>
                <div><Label className="text-xs">Best For (AR)</Label><Input value={form.best_for_line_ar || ''} onChange={e => set('best_for_line_ar', e.target.value)} dir="rtl" /></div>
              </div>
            </div>

            {/* Comparison */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Comparison Mode</h3>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.comparison_enabled ?? false} onCheckedChange={v => set('comparison_enabled', v)} /> Enable comparison</label>
              {form.comparison_enabled && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {(form.comparison_images || []).map((ci, i) => (
                      <div key={i} className="relative w-32">
                        <img src={ci.url} alt="" className="w-32 h-32 object-cover rounded-lg" />
                        <button onClick={() => set('comparison_images', (form.comparison_images || []).filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"><X size={10} /></button>
                        <Input placeholder="Model name" value={ci.model_name} onChange={e => { const imgs = [...(form.comparison_images || [])]; imgs[i] = { ...imgs[i], model_name: e.target.value }; set('comparison_images', imgs); }} className="mt-1 text-xs h-7" />
                        <Input placeholder="Tag" value={ci.tag} onChange={e => { const imgs = [...(form.comparison_images || [])]; imgs[i] = { ...imgs[i], tag: e.target.value }; set('comparison_images', imgs); }} className="mt-1 text-xs h-7" />
                      </div>
                    ))}
                    <button
                      className="w-32 h-32 border-2 border-dashed border-border/40 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 transition-colors"
                      onClick={() => compFileRef.current?.click()}
                    >
                      <Upload size={20} />
                      <span className="text-[10px] mt-1">Add image</span>
                    </button>
                  </div>
                  <input ref={compFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCompImage(f); }} />
                </div>
              )}
            </div>

            {/* Studio Link */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Studio Model Link</h3>
              <Select value={form.linked_model_id || 'none'} onValueChange={v => set('linked_model_id', v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link</SelectItem>
                  {models.filter(m => m.is_active).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.model_name}</SelectItem>
                  ))}
                  {videoModels.filter(vm => vm.is_active).map(vm => (
                    <SelectItem key={vm.id} value={vm.id}>{vm.display_name} (Video)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={uploading}>{form.id ? 'Save Changes' : 'Create Model'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
