import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface PromoBanner {
  id: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  badge_en: string;
  badge_ar: string;
  cta_label_en: string;
  cta_label_ar: string;
  cta_action_type: string;
  cta_url: string;
  audience: string;
  active: boolean;
  dismissible: boolean;
  dismissal_days: number;
  start_date: string | null;
  end_date: string | null;
  background_style: string;
  text_color: string;
  sort_order: number;
}

const empty: Omit<PromoBanner, 'id'> = {
  title_en: '', title_ar: '', subtitle_en: '', subtitle_ar: '',
  badge_en: '', badge_ar: '', cta_label_en: '', cta_label_ar: '',
  cta_action_type: 'open_signup_modal', cta_url: '', audience: 'logged_out_only',
  active: true, dismissible: true, dismissal_days: 7,
  start_date: null, end_date: null, background_style: 'brand_orange',
  text_color: '#FFFFFF', sort_order: 0,
};

export default function PromoBannerEditor() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [editing, setEditing] = useState<PromoBanner | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('promo_banners').select('*').order('sort_order');
    if (data) setBanners(data as unknown as PromoBanner[]);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing({ id: '', ...empty } as PromoBanner);
    setIsNew(true);
    setOpen(true);
  };

  const openEdit = (b: PromoBanner) => {
    setEditing({ ...b });
    setIsNew(false);
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    if (isNew) {
      const { error } = await supabase.from('promo_banners').insert(rest as any);
      if (error) { toast.error(error.message); return; }
      toast.success('Banner created');
    } else {
      const { error } = await supabase.from('promo_banners').update(rest as any).eq('id', id);
      if (error) { toast.error(error.message); return; }
      toast.success('Banner updated');
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('promo_banners').delete().eq('id', id);
    toast.success('Banner deleted');
    load();
  };

  const toggleActive = async (b: PromoBanner) => {
    await supabase.from('promo_banners').update({ active: !b.active } as any).eq('id', b.id);
    load();
  };

  const set = (key: keyof PromoBanner, val: any) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: val });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Promo Banners</h2>
          <p className="text-xs text-muted-foreground">Public promotional banners for guest / logged-out users</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openNew}><Plus size={14} /> New Banner</Button>
      </div>

      <Card className="bg-card/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Banner</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Audience</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Dates</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map(b => (
              <TableRow key={b.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10"><Megaphone size={14} className="text-primary" /></div>
                    <div>
                      <p className="text-[13px] font-medium">{b.title_en || '(untitled)'}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">{b.subtitle_en}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{b.audience.replace(/_/g, ' ')}</Badge></TableCell>
                <TableCell><Switch checked={b.active} onCheckedChange={() => toggleActive(b)} className="scale-75" /></TableCell>
                <TableCell className="text-[12px] text-muted-foreground">
                  {b.start_date ? formatDate(b.start_date) : '—'} → {b.end_date ? formatDate(b.end_date) : '∞'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Edit size={12} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(b.id)}><Trash2 size={12} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {banners.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">No promo banners yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isNew ? 'Create' : 'Edit'} Promo Banner</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4">
              {/* Content */}
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Title (EN)</Label><Input value={editing.title_en} onChange={e => set('title_en', e.target.value)} /></div>
                <div><Label className="text-xs">Title (AR)</Label><Input dir="rtl" value={editing.title_ar} onChange={e => set('title_ar', e.target.value)} /></div>
                <div><Label className="text-xs">Subtitle (EN)</Label><Input value={editing.subtitle_en} onChange={e => set('subtitle_en', e.target.value)} /></div>
                <div><Label className="text-xs">Subtitle (AR)</Label><Input dir="rtl" value={editing.subtitle_ar} onChange={e => set('subtitle_ar', e.target.value)} /></div>
                <div><Label className="text-xs">Badge (EN)</Label><Input value={editing.badge_en} onChange={e => set('badge_en', e.target.value)} /></div>
                <div><Label className="text-xs">Badge (AR)</Label><Input dir="rtl" value={editing.badge_ar} onChange={e => set('badge_ar', e.target.value)} /></div>
                <div><Label className="text-xs">CTA Label (EN)</Label><Input value={editing.cta_label_en} onChange={e => set('cta_label_en', e.target.value)} /></div>
                <div><Label className="text-xs">CTA Label (AR)</Label><Input dir="rtl" value={editing.cta_label_ar} onChange={e => set('cta_label_ar', e.target.value)} /></div>
              </div>

              {/* Action */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">CTA Action</Label>
                  <Select value={editing.cta_action_type} onValueChange={v => set('cta_action_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_signup_modal">Open Signup Modal</SelectItem>
                      <SelectItem value="navigate_to_signup">Navigate to Signup</SelectItem>
                      <SelectItem value="navigate_to_pricing">Navigate to Pricing</SelectItem>
                      <SelectItem value="custom_url">Custom URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Audience</Label>
                  <Select value={editing.audience} onValueChange={v => set('audience', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="logged_out_only">Logged Out Only</SelectItem>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="logged_in_only">Logged In Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editing.cta_action_type === 'custom_url' && (
                <div><Label className="text-xs">Custom URL</Label><Input value={editing.cta_url} onChange={e => set('cta_url', e.target.value)} placeholder="https://..." /></div>
              )}

              {/* Style */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Background Style</Label>
                  <Select value={editing.background_style} onValueChange={v => set('background_style', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand_orange">Brand Orange</SelectItem>
                      <SelectItem value="brand_lime">Brand Lime</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Dismissal Days</Label>
                  <Input type="number" value={editing.dismissal_days} onChange={e => set('dismissal_days', parseInt(e.target.value) || 7)} />
                </div>
                <div>
                  <Label className="text-xs">Sort Order</Label>
                  <Input type="number" value={editing.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date (optional)</Label>
                  <Input type="datetime-local" value={editing.start_date?.slice(0, 16) || ''} onChange={e => set('start_date', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                </div>
                <div>
                  <Label className="text-xs">End Date (optional)</Label>
                  <Input type="datetime-local" value={editing.end_date?.slice(0, 16) || ''} onChange={e => set('end_date', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={v => set('active', v)} /> Active</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.dismissible} onCheckedChange={v => set('dismissible', v)} /> Dismissible</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save}>{isNew ? 'Create' : 'Save'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
