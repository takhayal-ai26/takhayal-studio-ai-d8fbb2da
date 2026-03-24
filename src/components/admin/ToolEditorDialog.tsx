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
import { AdminTool, BilingualField } from '@/stores/adminToolsStore';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: AdminTool | null; // null = add mode
  onSave: (tool: AdminTool) => void;
}

const ICON_OPTIONS = ['Sparkles', 'ArrowUpCircle', 'Hexagon', 'Scissors', 'Wand2', 'Image', 'Palette', 'Layers'];

function emptyBilingual(): BilingualField {
  return { en: '', ar: '' };
}

function newTool(): AdminTool {
  return {
    id: crypto.randomUUID().slice(0, 8),
    name: emptyBilingual(),
    description: emptyBilingual(),
    shortDesc: emptyBilingual(),
    hero: { title: emptyBilingual(), subtitle: emptyBilingual() },
    cta: { label: { en: 'Generate', ar: 'إنشاء' } },
    creditCost: 1,
    inputType: 'prompt',
    active: true,
    featured: false,
    iconName: 'Sparkles',
    coverImage: '',
    route: '/tools/',
    analytics: { visits: 0, conversions: 0, generations: 0, revenue: '$0' },
  };
}

export default function ToolEditorDialog({ open, onOpenChange, tool, onSave }: Props) {
  const [form, setForm] = useState<AdminTool>(newTool());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!tool;

  useEffect(() => {
    if (open) {
      setForm(tool ? { ...tool } : newTool());
      setErrors({});
    }
  }, [open, tool]);

  const setBi = (path: string, lang: 'en' | 'ar', value: string) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let obj: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = { ...obj[parts[i]] };
        obj = obj[parts[i]];
      }
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

  const missingArabic = () => {
    const fields = ['name', 'description', 'shortDesc', 'hero.title', 'hero.subtitle', 'cta.label'];
    return fields.filter(f => !getBi(f).ar);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.en.trim()) e['name.en'] = 'English name is required';
    if (form.creditCost < 0) e['creditCost'] = 'Credit cost must be ≥ 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 400));
    onSave(form);
    setSaving(false);
    onOpenChange(false);
    toast({
      title: isEdit ? 'Tool updated successfully' : 'Tool added successfully',
      description: isEdit ? `"${form.name.en}" has been updated.` : `"${form.name.en}" has been added.`,
    });
  };

  const missing = missingArabic();

  const BiField = ({ label, path, textarea }: { label: string; path: string; textarea?: boolean }) => {
    const val = getBi(path);
    const Comp = textarea ? Textarea : Input;
    return (
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">English</span>
            <Comp
              value={val.en}
              onChange={e => setBi(path, 'en', e.target.value)}
              placeholder={`${label} (EN)`}
              className={`bg-muted/30 text-xs ${errors[`${path}.en`] ? 'border-destructive' : 'border-border/40'}`}
            />
            {errors[`${path}.en`] && <p className="text-[10px] text-destructive">{errors[`${path}.en`]}</p>}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">العربية</span>
            <Comp
              dir="rtl"
              value={val.ar}
              onChange={e => setBi(path, 'ar', e.target.value)}
              placeholder={`${label} (AR)`}
              className="bg-muted/30 text-xs text-right border-border/40"
            />
            {!val.ar && <p className="text-[10px] text-yellow-500 flex items-center gap-1"><AlertTriangle size={10} /> Missing Arabic</p>}
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
            {isEdit ? 'Update tool details and translations' : 'Configure a new tool with bilingual content'}
          </DialogDescription>
          {missing.length > 0 && (
            <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30 w-fit mt-1">
              <AlertTriangle size={10} className="mr-1" />
              {missing.length} Arabic field{missing.length > 1 ? 's' : ''} missing
            </Badge>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="bg-muted/30 mb-4">
              <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
              <TabsTrigger value="hero" className="text-xs">Hero & CTA</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pb-4">
              <BiField label="Tool Name" path="name" />
              <BiField label="Short Description" path="shortDesc" />
              <BiField label="Full Description" path="description" textarea />
            </TabsContent>

            <TabsContent value="hero" className="space-y-4 pb-4">
              <BiField label="Hero Title" path="hero.title" />
              <BiField label="Hero Subtitle" path="hero.subtitle" textarea />
              <BiField label="CTA Button Label" path="cta.label" />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Input Type</Label>
                  <Select value={form.inputType} onValueChange={v => setForm(p => ({ ...p, inputType: v as any }))}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prompt">Prompt</SelectItem>
                      <SelectItem value="upload">Upload</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Credit Cost</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.creditCost}
                    onChange={e => setForm(p => ({ ...p, creditCost: parseInt(e.target.value) || 0 }))}
                    className={`h-9 text-xs bg-muted/30 ${errors.creditCost ? 'border-destructive' : 'border-border/40'}`}
                  />
                  {errors.creditCost && <p className="text-[10px] text-destructive">{errors.creditCost}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Icon</Label>
                  <Select value={form.iconName} onValueChange={v => setForm(p => ({ ...p, iconName: v }))}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Route</Label>
                  <Input
                    value={form.route}
                    onChange={e => setForm(p => ({ ...p, route: e.target.value }))}
                    className="h-9 text-xs bg-muted/30 border-border/40"
                    placeholder="/tools/my-tool"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border/20">
                <div>
                  <Label className="text-xs">Active</Label>
                  <p className="text-[10px] text-muted-foreground">Tool is visible and usable</p>
                </div>
                <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border/20">
                <div>
                  <Label className="text-xs">Featured</Label>
                  <p className="text-[10px] text-muted-foreground">Show on homepage and featured sections</p>
                </div>
                <Switch checked={form.featured} onCheckedChange={v => setForm(p => ({ ...p, featured: v }))} />
              </div>

              {/* Future-ready fields */}
              <div className="border-t border-border/20 pt-3 space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Integration (Future)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Provider</Label>
                    <Input
                      value={form.provider || ''}
                      onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                      className="h-9 text-xs bg-muted/20 border-border/20"
                      placeholder="e.g. OpenAI"
                      disabled
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">API Endpoint</Label>
                    <Input
                      value={form.apiEndpoint || ''}
                      onChange={e => setForm(p => ({ ...p, apiEndpoint: e.target.value }))}
                      className="h-9 text-xs bg-muted/20 border-border/20"
                      placeholder="e.g. /api/generate"
                      disabled
                    />
                  </div>
                </div>
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
