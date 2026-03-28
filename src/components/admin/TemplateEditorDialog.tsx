import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DBTemplate {
  id?: string;
  title_en: string;
  title_ar: string;
  category: string;
  cover_image_url: string;
  ratio: string;
  prompt: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  show_on_studio: boolean;
  studio_sort_order: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DBTemplate | null;
  onSave: (t: DBTemplate) => void;
  categories: string[];
}

const ASPECT_RATIOS = ['1:1', '4:5', '9:16', '16:9', '3:2', '2:3'];

function emptyTemplate(): DBTemplate {
  return {
    title_en: '',
    title_ar: '',
    category: '',
    cover_image_url: '',
    ratio: '1:1',
    prompt: '',
    active: true,
    featured: false,
    sort_order: 0,
    show_on_studio: false,
    studio_sort_order: 0,
  };
}

export default function TemplateEditorDialog({ open, onOpenChange, template, onSave, categories }: Props) {
  const [form, setForm] = useState<DBTemplate>(emptyTemplate());
  const [saving, setSaving] = useState(false);
  const isEdit = !!template?.id;

  useEffect(() => {
    if (open) {
      setForm(template ? { ...template } : emptyTemplate());
    }
  }, [open, template]);

  const handleSave = async () => {
    if (!form.title_en.trim()) {
      toast({ title: 'Error', description: 'English title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 200));
    onSave(form);
    setSaving(false);
    onOpenChange(false);
    toast({ title: isEdit ? 'Template updated' : 'Template created' });
  };

  const set = (key: keyof DBTemplate, value: any) => setForm(p => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card border-border/40">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg">{isEdit ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? 'Update template details' : 'Add a new template to the gallery'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-5 pb-4">
            {/* Title EN/AR */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title (English)</Label>
                <Input value={form.title_en} onChange={e => set('title_en', e.target.value)} className="h-9 text-sm bg-muted/30 border-border/40" placeholder="Template title" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Title (Arabic)</Label>
                <Input dir="rtl" value={form.title_ar} onChange={e => set('title_ar', e.target.value)} className="h-9 text-sm bg-muted/30 border-border/40 text-right" placeholder="عنوان القالب" />
              </div>
            </div>

            {/* Category + Ratio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => set('category', v)}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Aspect Ratio</Label>
                <Select value={form.ratio} onValueChange={v => set('ratio', v)}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASPECT_RATIOS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Cover Image URL */}
            <div className="space-y-1.5">
              <Label className="text-xs">Cover Image URL</Label>
              <Input value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} className="h-9 text-sm bg-muted/30 border-border/40" placeholder="https://..." />
              {form.cover_image_url && (
                <div className="mt-2 w-24 rounded-lg overflow-hidden border border-border/40" style={{ aspectRatio: form.ratio.replace(':', '/') }}>
                  <img src={form.cover_image_url} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Prompt (internal) */}
            <div className="space-y-1.5">
              <Label className="text-xs">Prompt <span className="text-muted-foreground">(internal — not shown on card)</span></Label>
              <Textarea value={form.prompt} onChange={e => set('prompt', e.target.value)} className="bg-muted/30 text-sm border-border/40 min-h-[80px]" placeholder="Generation prompt..." />
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5 w-32">
              <Label className="text-xs">Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} className="h-9 text-sm bg-muted/30 border-border/40" />
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <div><Label className="text-xs">Active</Label><p className="text-[10px] text-muted-foreground">Template is visible on the gallery</p></div>
                <Switch checked={form.active} onCheckedChange={v => set('active', v)} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <div><Label className="text-xs">Featured</Label><p className="text-[10px] text-muted-foreground">Show in featured section</p></div>
                <Switch checked={form.featured} onCheckedChange={v => set('featured', v)} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <div><Label className="text-xs">Show on Studio</Label><p className="text-[10px] text-muted-foreground">Display as featured template on the Studio page (max 3)</p></div>
                <Switch checked={form.show_on_studio} onCheckedChange={v => set('show_on_studio', v)} />
              </div>
              {form.show_on_studio && (
                <div className="space-y-1.5 w-32">
                  <Label className="text-xs">Studio Order</Label>
                  <Input type="number" value={form.studio_sort_order} onChange={e => set('studio_sort_order', parseInt(e.target.value) || 0)} className="h-9 text-sm bg-muted/30 border-border/40" />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2 border-t border-border/20">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
