import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToolsDB, ToolRecord } from '@/hooks/useToolsDB';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolRecord | null;
}

const ICON_OPTIONS = ['Sparkles', 'ArrowUpCircle', 'Hexagon', 'Scissors', 'Wand2', 'Image', 'Palette', 'Layers'];

function emptyTool(): Partial<ToolRecord> {
  return {
    slug: '',
    route: '/tools/',
    input_type: 'prompt',
    icon_name: 'Sparkles',
    active: true,
    featured: false,
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    short_desc_en: '',
    short_desc_ar: '',
    hero_title_en: '',
    hero_title_ar: '',
    hero_subtitle_en: '',
    hero_subtitle_ar: '',
    cover_image_url: '',
    provider_name: 'fal.ai',
    provider_endpoint: '',
    default_credit_cost: 2,
    internal_provider_cost_estimate: 0,
    result_type: 'image',
    sort_order: 0,
  };
}

export default function AdminToolEditorDialog({ open, onOpenChange, tool }: Props) {
  const [form, setForm] = useState<Partial<ToolRecord>>(emptyTool());
  const [saving, setSaving] = useState(false);
  const { updateTool, addTool } = useToolsDB();
  const isEdit = !!tool;

  useEffect(() => {
    if (open) setForm(tool ? { ...tool } : emptyTool());
  }, [open, tool]);

  const set = (key: keyof ToolRecord, value: any) => setForm(p => ({ ...p, [key]: value }));

  const missingArabic = ['title_ar', 'description_ar', 'short_desc_ar', 'hero_title_ar', 'hero_subtitle_ar']
    .filter(k => !form[k as keyof ToolRecord]);

  const handleSave = async () => {
    if (!form.title_en?.trim()) {
      toast({ title: 'Validation', description: 'English title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (isEdit && tool) {
        const { id, created_at, updated_at, ...updates } = form as ToolRecord;
        await updateTool.mutateAsync({ id: tool.id, updates });
      } else {
        await addTool.mutateAsync(form);
      }
      onOpenChange(false);
      toast({ title: isEdit ? 'Tool updated' : 'Tool added', description: `"${form.title_en}" saved.` });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  const BiField = ({ label, enKey, arKey, textarea }: { label: string; enKey: keyof ToolRecord; arKey: keyof ToolRecord; textarea?: boolean }) => {
    const Comp = textarea ? Textarea : Input;
    return (
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">English</span>
            <Comp value={(form[enKey] as string) || ''} onChange={(e: any) => set(enKey, e.target.value)} placeholder={`${label} (EN)`} className="bg-muted/30 text-xs border-border/40" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">العربية</span>
            <Comp dir="rtl" value={(form[arKey] as string) || ''} onChange={(e: any) => set(arKey, e.target.value)} placeholder={`${label} (AR)`} className="bg-muted/30 text-xs text-right border-border/40" />
            {!(form[arKey] as string) && <p className="text-[10px] text-yellow-500 flex items-center gap-1"><AlertTriangle size={10} /> Missing Arabic</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card border-border/40">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg">{isEdit ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? 'Update tool config, content, and provider settings' : 'Configure a new tool'}
          </DialogDescription>
          {missingArabic.length > 0 && (
            <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30 w-fit mt-1">
              <AlertTriangle size={10} className="mr-1" /> {missingArabic.length} Arabic field{missingArabic.length > 1 ? 's' : ''} missing
            </Badge>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="bg-muted/30 mb-4">
              <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
              <TabsTrigger value="hero" className="text-xs">Hero & CTA</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
              <TabsTrigger value="provider" className="text-xs">Provider</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pb-4">
              <BiField label="Tool Name" enKey="title_en" arKey="title_ar" />
              <BiField label="Short Description" enKey="short_desc_en" arKey="short_desc_ar" />
              <BiField label="Full Description" enKey="description_en" arKey="description_ar" textarea />
            </TabsContent>

            <TabsContent value="hero" className="space-y-4 pb-4">
              <BiField label="Hero Title" enKey="hero_title_en" arKey="hero_title_ar" />
              <BiField label="Hero Subtitle" enKey="hero_subtitle_en" arKey="hero_subtitle_ar" textarea />
              <div className="space-y-1.5">
                <Label className="text-xs">Cover Image URL</Label>
                <Input value={form.cover_image_url || ''} onChange={e => set('cover_image_url', e.target.value)} className="h-9 text-xs bg-muted/30 border-border/40" placeholder="https://..." />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Slug</Label>
                  <Input value={form.slug || ''} onChange={e => set('slug', e.target.value)} className="h-9 text-xs bg-muted/30 border-border/40 font-mono" placeholder="my-tool" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Route</Label>
                  <Input value={form.route || ''} onChange={e => set('route', e.target.value)} className="h-9 text-xs bg-muted/30 border-border/40 font-mono" placeholder="/tools/my-tool" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Input Type</Label>
                  <Select value={form.input_type || 'prompt'} onValueChange={v => set('input_type', v)}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prompt">Prompt</SelectItem>
                      <SelectItem value="upload">Upload</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Icon</Label>
                  <Select value={form.icon_name || 'Sparkles'} onValueChange={v => set('icon_name', v)}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Sort Order</Label>
                  <Input type="number" value={form.sort_order || 0} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} className="h-9 text-xs bg-muted/30 border-border/40" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Result Type</Label>
                  <Select value={form.result_type || 'image'} onValueChange={v => set('result_type', v)}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="images">Multiple Images</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/20">
                <div><Label className="text-xs">Active</Label><p className="text-[10px] text-muted-foreground">Tool is visible and usable</p></div>
                <Switch checked={form.active ?? true} onCheckedChange={v => set('active', v)} />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/20">
                <div><Label className="text-xs">Featured</Label><p className="text-[10px] text-muted-foreground">Show on homepage</p></div>
                <Switch checked={form.featured ?? false} onCheckedChange={v => set('featured', v)} />
              </div>
            </TabsContent>

            <TabsContent value="provider" className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Provider Name</Label>
                  <Input value={form.provider_name || ''} onChange={e => set('provider_name', e.target.value)} className="h-9 text-xs bg-muted/30 border-border/40" placeholder="fal.ai" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Provider Endpoint</Label>
                  <Input value={form.provider_endpoint || ''} onChange={e => set('provider_endpoint', e.target.value)} className="h-9 text-xs bg-muted/30 border-border/40 font-mono" placeholder="fal-ai/esrgan" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">User Credit Cost</Label>
                  <Input type="number" min={0} value={form.default_credit_cost || 0} onChange={e => set('default_credit_cost', parseInt(e.target.value) || 0)} className="h-9 text-xs bg-muted/30 border-border/40" />
                  <p className="text-[10px] text-muted-foreground">Credits charged to user per run</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Internal Provider Cost ($)</Label>
                  <Input type="number" step="0.001" min={0} value={form.internal_provider_cost_estimate || 0} onChange={e => set('internal_provider_cost_estimate', parseFloat(e.target.value) || 0)} className="h-9 text-xs bg-muted/30 border-border/40" />
                  <p className="text-[10px] text-muted-foreground">Estimated cost per API call</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/20 p-3 border border-border/20">
                <p className="text-[11px] text-muted-foreground">
                  <strong>Margin:</strong> Revenue = {form.default_credit_cost || 0} × $0.016 = ${((form.default_credit_cost || 0) * 0.016).toFixed(3)} — Cost = ${Number(form.internal_provider_cost_estimate || 0).toFixed(3)} →{' '}
                  <span className={((form.default_credit_cost || 0) * 0.016 - Number(form.internal_provider_cost_estimate || 0)) > 0 ? 'text-green-500' : 'text-destructive'}>
                    Margin: ${((form.default_credit_cost || 0) * 0.016 - Number(form.internal_provider_cost_estimate || 0)).toFixed(3)}
                  </span>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2 border-t border-border/20">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Tool'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
