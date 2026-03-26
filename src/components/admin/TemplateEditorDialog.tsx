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
import { AlertTriangle, Loader2, BarChart3, Eye, MousePointerClick } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AdminTemplate, BilingualField, CATEGORIES } from '@/stores/adminTemplatesStore';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AdminTemplate | null;
  onSave: (t: AdminTemplate) => void;
}

const TOOLS = [
  { id: 'generate', label: 'Generate Image' },
  { id: 'upscale', label: 'Upscale Image' },
  { id: 'logo', label: 'Create Logo' },
  { id: 'remove-bg', label: 'Remove Background' },
  { id: 'enhance', label: 'Enhance Image' },
];

const ASPECT_RATIOS = ['1:1', '4:5', '9:16', '16:9', '3:2', '2:3'];
const MODELS = ['SDXL', 'Stable Diffusion 3', 'DALL-E 3', 'Midjourney', 'Flux'];

function emptyBi(): BilingualField { return { en: '', ar: '' }; }

function newTemplate(): AdminTemplate {
  return {
    id: crypto.randomUUID().slice(0, 8),
    title: emptyBi(), shortDescription: emptyBi(), fullPrompt: emptyBi(), ctaLabel: { en: 'Use Template', ar: 'استخدم القالب' },
    category: 'Ads', tags: [], toolId: 'generate', toolType: 'prompt',
    thumbnail: '', previewImages: [], recommendedModel: 'SDXL', recommendedAspectRatio: '1:1',
    creditCost: 2, featured: false, seasonal: false, active: true, slug: '', sortOrder: 0, notes: '',
    featuredOnHome: false, visibleInCategory: true, visibleInToolPage: false, startDate: '', endDate: '',
    analytics: { views: 0, uses: 0, useRate: '0%', lastUsed: '', revenue: '$0' },
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
}

export default function TemplateEditorDialog({ open, onOpenChange, template, onSave }: Props) {
  const [form, setForm] = useState<AdminTemplate>(newTemplate());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [tagInputAr, setTagInputAr] = useState('');
  const isEdit = !!template;

  useEffect(() => {
    if (open) {
      setForm(template ? { ...template, tags: [...template.tags] } : newTemplate());
      setErrors({});
      setTagInput('');
      setTagInputAr('');
    }
  }, [open, template]);

  const setBi = (path: string, lang: 'en' | 'ar', value: string) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let obj: any = next;
      for (let i = 0; i < parts.length - 1; i++) { obj[parts[i]] = { ...obj[parts[i]] }; obj = obj[parts[i]]; }
      obj[parts[parts.length - 1]] = { ...obj[parts[parts.length - 1]], [lang]: value };
      return next;
    });
  };

  const getBi = (path: string): BilingualField => {
    const parts = path.split('.');
    let obj: any = form;
    for (const p of parts) obj = obj?.[p];
    return obj || { en: '', ar: '' };
  };

  const missingAr = ['title', 'shortDescription', 'fullPrompt', 'ctaLabel'].filter(f => !getBi(f).ar);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.en.trim()) e['title'] = 'English title required';
    if (!form.fullPrompt.en.trim()) e['prompt'] = 'English prompt required';
    if (!form.category) e['category'] = 'Category required';
    if (!form.toolId) e['tool'] = 'Tool required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    if (!form.slug) form.slug = form.title.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    onSave(form);
    setSaving(false);
    onOpenChange(false);
    toast({ title: isEdit ? 'Template updated' : 'Template created', description: `"${form.title.en}" saved successfully.` });
  };

  const addTag = () => {
    const en = tagInput.trim();
    const ar = tagInputAr.trim();
    if (en && !form.tags.some(t => t.en === en)) {
      setForm(p => ({ ...p, tags: [...p.tags, { en, ar }] }));
      setTagInput('');
      setTagInputAr('');
    }
  };

  const removeTag = (tag: BilingualTag) => setForm(p => ({ ...p, tags: p.tags.filter(t => t.en !== tag.en) }));

  const BiField = ({ label, path, textarea }: { label: string; path: string; textarea?: boolean }) => {
    const val = getBi(path);
    const Comp = textarea ? Textarea : Input;
    const hasErr = errors[path.split('.')[0]];
    return (
      <div className="space-y-2.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">English</span>
            <Comp value={val.en} onChange={e => setBi(path, 'en', e.target.value)} placeholder={`${label} (EN)`}
              className={`bg-muted/30 text-xs ${hasErr ? 'border-destructive' : 'border-border/40'}`} />
            {hasErr && <p className="text-[10px] text-destructive">{hasErr}</p>}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">العربية</span>
            <Comp dir="rtl" value={val.ar} onChange={e => setBi(path, 'ar', e.target.value)} placeholder={`${label} (AR)`}
              className="bg-muted/30 text-xs text-right border-border/40" />
            {!val.ar && <p className="text-[10px] text-yellow-500 flex items-center gap-1"><AlertTriangle size={10} /> Missing Arabic</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-card border-border/40">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg">{isEdit ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? 'Update template details and translations' : 'Add a new template with bilingual content'}
          </DialogDescription>
          {missingAr.length > 0 && (
            <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30 w-fit mt-1">
              <AlertTriangle size={10} className="mr-1" /> {missingAr.length} Arabic field{missingAr.length > 1 ? 's' : ''} missing
            </Badge>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted/30 mb-4 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="content" className="text-xs">Content & Translations</TabsTrigger>
              <TabsTrigger value="prompt" className="text-xs">Prompt & Generation</TabsTrigger>
              <TabsTrigger value="visibility" className="text-xs">Visibility</TabsTrigger>
              <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
              {isEdit && <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>}
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-4 pb-4">
              <BiField label="Template Title" path="title" />
              <BiField label="Short Description" path="shortDescription" />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Associated Tool</Label>
                  <Select value={form.toolId} onValueChange={v => setForm(p => ({ ...p, toolId: v }))}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>{TOOLS.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Slug</Label>
                  <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                    className="h-9 text-xs bg-muted/30 border-border/40" placeholder="auto-generated" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tags</Label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="h-9 text-xs bg-muted/30 border-border/40 flex-1" placeholder="Add tag and press Enter" />
                  <Button size="sm" variant="outline" className="text-xs h-9" onClick={addTag}>Add</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/20" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Sort Order</Label>
                  <Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="h-9 text-xs bg-muted/30 border-border/40" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Credit Cost</Label>
                  <Input type="number" min={0} value={form.creditCost} onChange={e => setForm(p => ({ ...p, creditCost: parseInt(e.target.value) || 0 }))}
                    className="h-9 text-xs bg-muted/30 border-border/40" />
                </div>
              </div>
            </TabsContent>

            {/* CONTENT & TRANSLATIONS */}
            <TabsContent value="content" className="space-y-4 pb-4">
              <BiField label="Template Title" path="title" />
              <BiField label="Short Description" path="shortDescription" />
              <BiField label="Full Prompt" path="fullPrompt" textarea />
              <BiField label="CTA Label" path="ctaLabel" />
              <div className="space-y-1.5">
                <Label className="text-xs">Internal Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="bg-muted/30 text-xs border-border/40" placeholder="Admin-only notes..." />
              </div>
            </TabsContent>

            {/* PROMPT & GENERATION */}
            <TabsContent value="prompt" className="space-y-4 pb-4">
              <BiField label="Full Prompt" path="fullPrompt" textarea />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Associated Tool</Label>
                  <Select value={form.toolId} onValueChange={v => setForm(p => ({ ...p, toolId: v }))}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>{TOOLS.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Recommended Model</Label>
                  <Select value={form.recommendedModel} onValueChange={v => setForm(p => ({ ...p, recommendedModel: v }))}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>{MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Aspect Ratio</Label>
                  <Select value={form.recommendedAspectRatio} onValueChange={v => setForm(p => ({ ...p, recommendedAspectRatio: v }))}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>{ASPECT_RATIOS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Credit Cost</Label>
                <Input type="number" min={0} value={form.creditCost} onChange={e => setForm(p => ({ ...p, creditCost: parseInt(e.target.value) || 0 }))}
                  className="h-9 text-xs bg-muted/30 border-border/40 w-32" />
              </div>
            </TabsContent>

            {/* VISIBILITY */}
            <TabsContent value="visibility" className="space-y-3 pb-4">
              {[
                { label: 'Active', desc: 'Template is live and usable', key: 'active' as const },
                { label: 'Featured', desc: 'Show in featured section', key: 'featured' as const },
                { label: 'Seasonal', desc: 'Mark as seasonal content', key: 'seasonal' as const },
                { label: 'Featured on Home', desc: 'Show on homepage', key: 'featuredOnHome' as const },
                { label: 'Visible in Category', desc: 'Show in category listings', key: 'visibleInCategory' as const },
                { label: 'Visible in Tool Page', desc: 'Show in tool examples', key: 'visibleInToolPage' as const },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-border/20">
                  <div><Label className="text-xs">{item.label}</Label><p className="text-[10px] text-muted-foreground">{item.desc}</p></div>
                  <Switch checked={form[item.key] as boolean} onCheckedChange={v => setForm(p => ({ ...p, [item.key]: v }))} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date (optional)</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="h-9 text-xs bg-muted/30 border-border/40" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date (optional)</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    className="h-9 text-xs bg-muted/30 border-border/40" />
                </div>
              </div>
            </TabsContent>

            {/* MEDIA */}
            <TabsContent value="media" className="space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Thumbnail URL</Label>
                <Input value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))}
                  className="h-9 text-xs bg-muted/30 border-border/40" placeholder="https://..." />
                {form.thumbnail && (
                  <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-border/40">
                    <img src={form.thumbnail} alt="thumb" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="rounded-lg border-2 border-dashed border-border/40 p-8 text-center">
                <p className="text-xs text-muted-foreground">Media upload will be available with Lovable Cloud storage integration</p>
              </div>
            </TabsContent>

            {/* ANALYTICS */}
            {isEdit && (
              <TabsContent value="analytics" className="space-y-4 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Views', value: form.analytics.views.toLocaleString(), icon: Eye },
                    { label: 'Uses', value: form.analytics.uses.toLocaleString(), icon: MousePointerClick },
                    { label: 'Use Rate', value: form.analytics.useRate, icon: BarChart3 },
                  ].map(s => (
                    <Card key={s.label} className="border-border/40 bg-muted/20">
                      <CardContent className="p-3 flex items-center gap-2.5">
                        <s.icon size={14} className="text-primary" />
                        <div>
                          <p className="text-sm font-bold">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Last used: {form.analytics.lastUsed || 'Never'}</p>
                  <p>Revenue: {form.analytics.revenue}</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
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
