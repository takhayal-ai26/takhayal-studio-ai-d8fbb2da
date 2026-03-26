import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, X, Clock, DollarSign, Layers, Maximize, Settings2, Sparkles, ArrowUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ModelRecord } from '@/hooks/useModels';

interface Props {
  model: ModelRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<ModelRecord>) => Promise<void>;
}

export function ModelDetailDrawer({ model, open, onOpenChange, onSave }: Props) {
  const [form, setForm] = useState<Partial<ModelRecord>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (model) {
      setForm({
        model_name: model.model_name,
        speed: model.speed,
        cost_per_run: model.cost_per_run,
        best_for: model.best_for,
        input_type: model.input_type,
        default_ratio: model.default_ratio,
        default_resolution: model.default_resolution,
        max_resolution: model.max_resolution,
        is_active: model.is_active,
        is_default: model.is_default,
        notes: model.notes,
        supported_ratios: model.supported_ratios,
        supported_sizes: model.supported_sizes,
        supported_quality_tiers: model.supported_quality_tiers,
        upscale_strategy: model.upscale_strategy,
        supports_native_high_res: model.supports_native_high_res,
      });
    }
  }, [model]);

  if (!model) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const overrideKeys: string[] = [];
      if (form.cost_per_run !== model.cost_per_run) overrideKeys.push('cost_per_run');
      if (form.speed !== model.speed) overrideKeys.push('speed');
      if (form.best_for !== model.best_for) overrideKeys.push('best_for');
      if (form.default_ratio !== model.default_ratio) overrideKeys.push('default_ratio');
      if (form.default_resolution !== model.default_resolution) overrideKeys.push('default_resolution');
      if (form.upscale_strategy !== model.upscale_strategy) overrideKeys.push('upscale_strategy');

      const existingOverrides = model.admin_overrides || {};
      const newOverrides = { ...existingOverrides };
      overrideKeys.forEach(k => { newOverrides[k] = true; });

      await onSave(model.id, { ...form, admin_overrides: newOverrides });
      toast({ title: 'Model Updated', description: `${model.model_name} saved successfully` });
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save model', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Settings2 size={18} className="text-primary" />
            {model.model_name}
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">{model.endpoint_id}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5"><Sparkles size={12} /> Basic Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Provider</Label>
                <p className="text-sm font-medium">{model.provider_name}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Input Type</Label>
                <Select value={form.input_type} onValueChange={v => setForm(f => ({ ...f, input_type: v as any }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image_size">image_size</SelectItem>
                    <SelectItem value="aspect_ratio">aspect_ratio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label className="text-xs">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_default} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} />
                <Label className="text-xs">Default</Label>
              </div>
            </div>
          </section>

          <Separator />

          {/* Pricing & Performance */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5"><DollarSign size={12} /> Pricing & Speed</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Cost / Run</Label>
                <Input type="number" step="0.001" value={form.cost_per_run ?? ''} onChange={e => setForm(f => ({ ...f, cost_per_run: parseFloat(e.target.value) || 0 }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> Speed</Label>
                <Input value={form.speed ?? ''} onChange={e => setForm(f => ({ ...f, speed: e.target.value }))} className="h-8 text-xs" />
              </div>
            </div>
            {model.last_sync_at && (
              <p className="text-[10px] text-muted-foreground">Last synced: {new Date(model.last_sync_at).toLocaleString()}</p>
            )}
          </section>

          <Separator />

          {/* Upscale & Resolution Strategy */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5"><ArrowUp size={12} /> Resolution Strategy</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Upscale Strategy</Label>
                <Select value={form.upscale_strategy || 'esrgan'} onValueChange={v => setForm(f => ({ ...f, upscale_strategy: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="esrgan">ESRGAN (fast, cheap)</SelectItem>
                    <SelectItem value="creative">Creative Upscaler (premium)</SelectItem>
                    <SelectItem value="none">No upscaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Native High-Res</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={form.supports_native_high_res} onCheckedChange={v => setForm(f => ({ ...f, supports_native_high_res: v }))} />
                  <span className="text-[11px] text-muted-foreground">{form.supports_native_high_res ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              {form.supports_native_high_res
                ? 'This model can output high-res natively. Upscaling is optional.'
                : 'Higher quality (2K/4K) is achieved through the upscale pipeline after 1K generation.'}
            </p>
          </section>

          <Separator />

          {/* Capabilities */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5"><Layers size={12} /> Capabilities</h3>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Supported Ratios</Label>
              <div className="flex flex-wrap gap-1">
                {(form.supported_ratios || []).map(r => (
                  <Badge key={r} variant="outline" className="text-[10px] bg-muted/20">
                    {r}
                    <button className="ml-1 hover:text-destructive" onClick={() => setForm(f => ({ ...f, supported_ratios: (f.supported_ratios || []).filter(x => x !== r) }))}><X size={8} /></button>
                  </Badge>
                ))}
              </div>
              <Input placeholder="Add ratio (e.g. 21:9) and press Enter" className="h-7 text-[11px] mt-1"
                onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { const v = (e.target as HTMLInputElement).value.trim(); setForm(f => ({ ...f, supported_ratios: [...(f.supported_ratios || []), v] })); (e.target as HTMLInputElement).value = ''; } }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Supported Sizes (image_size models)</Label>
              <div className="flex flex-wrap gap-1">
                {(form.supported_sizes || []).map(s => (
                  <Badge key={s} variant="outline" className="text-[10px] bg-muted/20">
                    {s}
                    <button className="ml-1 hover:text-destructive" onClick={() => setForm(f => ({ ...f, supported_sizes: (f.supported_sizes || []).filter(x => x !== s) }))}><X size={8} /></button>
                  </Badge>
                ))}
              </div>
              <Input placeholder="Add size preset (e.g. square_hd)" className="h-7 text-[11px] mt-1"
                onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { const v = (e.target as HTMLInputElement).value.trim(); setForm(f => ({ ...f, supported_sizes: [...(f.supported_sizes || []), v] })); (e.target as HTMLInputElement).value = ''; } }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Supported Quality Tiers</Label>
              <div className="flex flex-wrap gap-1">
                {(form.supported_quality_tiers || []).map((q: string) => (
                  <Badge key={q} variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary">
                    {q}
                    <button className="ml-1 hover:text-destructive" onClick={() => setForm(f => ({ ...f, supported_quality_tiers: (f.supported_quality_tiers || []).filter((x: string) => x !== q) }))}><X size={8} /></button>
                  </Badge>
                ))}
              </div>
              <Input placeholder="Add tier (e.g. 4K) and press Enter" className="h-7 text-[11px] mt-1"
                onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { const v = (e.target as HTMLInputElement).value.trim(); setForm(f => ({ ...f, supported_quality_tiers: [...(f.supported_quality_tiers || []), v] })); (e.target as HTMLInputElement).value = ''; } }} />
            </div>
          </section>

          <Separator />

          {/* Defaults */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5"><Maximize size={12} /> Defaults & Limits</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Default Ratio</Label>
                <Input value={form.default_ratio ?? ''} onChange={e => setForm(f => ({ ...f, default_ratio: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Default Res</Label>
                <Input value={form.default_resolution ?? ''} onChange={e => setForm(f => ({ ...f, default_resolution: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Max Res</Label>
                <Input value={form.max_resolution ?? ''} onChange={e => setForm(f => ({ ...f, max_resolution: e.target.value }))} className="h-8 text-xs" />
              </div>
            </div>
          </section>

          <Separator />

          {/* Best For & Notes */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Best For & Notes</h3>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Best For</Label>
              <Textarea value={form.best_for ?? ''} onChange={e => setForm(f => ({ ...f, best_for: e.target.value }))} className="text-xs min-h-[60px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Admin Notes</Label>
              <Textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-xs min-h-[60px]" placeholder="Internal notes..." />
            </div>
          </section>

          {/* Admin Overrides indicator */}
          {Object.keys(model.admin_overrides || {}).length > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
              <p className="text-[11px] text-primary font-medium mb-1">Admin Overrides Active</p>
              <p className="text-[10px] text-muted-foreground">
                These fields are manually managed and won't be overwritten by sync:
                {' '}{Object.keys(model.admin_overrides).join(', ')}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1 gap-1.5" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
