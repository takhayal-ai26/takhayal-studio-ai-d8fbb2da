import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, GripVertical, Star, Loader2 } from 'lucide-react';

interface Testimonial {
  id: string;
  name_en: string;
  name_ar: string;
  role_en: string;
  role_ar: string;
  testimonial_en: string;
  testimonial_ar: string;
  avatar_url: string;
  location_en: string;
  location_ar: string;
  company_en: string;
  company_ar: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const EMPTY: Omit<Testimonial, 'id'> = {
  name_en: '', name_ar: '', role_en: '', role_ar: '',
  testimonial_en: '', testimonial_ar: '',
  avatar_url: '', location_en: '', location_ar: '',
  company_en: '', company_ar: '',
  is_active: true, is_featured: false, sort_order: 0,
};

export default function AdminTestimonials({ embedded }: { embedded?: boolean } = {}) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<Omit<Testimonial, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('sort_order');
    setItems((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY, sort_order: items.length + 1 }); setDialogOpen(true); };
  const openEdit = (t: Testimonial) => { setEditing(t); setForm({ ...t }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('testimonials').update(form as any).eq('id', editing.id);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Testimonial updated');
    } else {
      const { error } = await supabase.from('testimonials').insert(form as any);
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
      toast.success('Testimonial created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    toast.success('Deleted');
    fetchAll();
  };

  const toggleActive = async (t: Testimonial) => {
    await supabase.from('testimonials').update({ is_active: !t.is_active } as any).eq('id', t.id);
    fetchAll();
  };

  const toggleFeatured = async (t: Testimonial) => {
    await supabase.from('testimonials').update({ is_featured: !t.is_featured } as any).eq('id', t.id);
    fetchAll();
  };

  const update = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {!embedded && <h1 className="typo-heading-page">Testimonials</h1>}
          <p className="text-sm text-muted-foreground mt-1">Manage customer testimonials shown on the website</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs"><Plus size={14} /> Add Testimonial</Button>
      </div>

      <div className="space-y-2">
        {items.map(t => (
          <div key={t.id} className={`flex items-center gap-3 p-4 rounded-xl bg-card border border-border/30 transition-opacity ${!t.is_active ? 'opacity-50' : ''}`}>
            <GripVertical size={14} className="text-muted-foreground/30 flex-shrink-0" />
            {t.avatar_url ? (
              <img src={t.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {t.name_en.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">{t.name_en}</span>
                <span className="text-xs text-muted-foreground">· {t.role_en}</span>
                {t.is_featured && <Star size={12} className="text-amber-400 fill-amber-400" />}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{t.testimonial_en.slice(0, 80)}...</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFeatured(t)}>
                <Star size={14} className={t.is_featured ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/40'} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                <Edit size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">No testimonials yet. Click "Add Testimonial" to create one.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Name (English)</Label><Input value={form.name_en} onChange={e => update('name_en', e.target.value)} /></div>
              <div><Label className="text-xs">Name (Arabic)</Label><Input value={form.name_ar} onChange={e => update('name_ar', e.target.value)} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Role (English)</Label><Input value={form.role_en} onChange={e => update('role_en', e.target.value)} /></div>
              <div><Label className="text-xs">Role (Arabic)</Label><Input value={form.role_ar} onChange={e => update('role_ar', e.target.value)} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Location (English)</Label><Input value={form.location_en} onChange={e => update('location_en', e.target.value)} /></div>
              <div><Label className="text-xs">Location (Arabic)</Label><Input value={form.location_ar} onChange={e => update('location_ar', e.target.value)} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Company (English)</Label><Input value={form.company_en} onChange={e => update('company_en', e.target.value)} /></div>
              <div><Label className="text-xs">Company (Arabic)</Label><Input value={form.company_ar} onChange={e => update('company_ar', e.target.value)} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Testimonial (English)</Label><Textarea value={form.testimonial_en} onChange={e => update('testimonial_en', e.target.value)} rows={3} /></div>
              <div><Label className="text-xs">Testimonial (Arabic)</Label><Textarea value={form.testimonial_ar} onChange={e => update('testimonial_ar', e.target.value)} dir="rtl" rows={3} /></div>
            </div>
            <div>
              <Label className="text-xs">Avatar URL</Label>
              <Input value={form.avatar_url} onChange={e => update('avatar_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs">Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => update('sort_order', parseInt(e.target.value) || 0)} /></div>
              <div className="flex items-center gap-2 pt-5"><Switch checked={form.is_active} onCheckedChange={v => update('is_active', v)} /><Label className="text-xs">Active</Label></div>
              <div className="flex items-center gap-2 pt-5"><Switch checked={form.is_featured} onCheckedChange={v => update('is_featured', v)} /><Label className="text-xs">Featured</Label></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {editing ? 'Update Testimonial' : 'Create Testimonial'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
