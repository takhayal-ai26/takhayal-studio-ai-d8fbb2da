import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Loader2, Upload, X, Link as LinkIcon, Plus, Trash2, Star, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToolsDB, ToolRecord } from '@/hooks/useToolsDB';
import { useToolProviders, ToolProvider } from '@/hooks/useToolProviders';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useModels } from '@/hooks/useModels';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolRecord | null;
}

const ICON_OPTIONS = ['Sparkles', 'ArrowUpCircle', 'Hexagon', 'Scissors', 'Wand2', 'Image', 'Palette', 'Layers'];
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;
const TIER_COLORS: Record<string, string> = {
  legacy: 'bg-muted text-muted-foreground',
  standard: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  advanced: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  premium: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

function emptyTool(): Partial<ToolRecord> {
  return {
    slug: '', route: '/tools/', input_type: 'upload', icon_name: 'Sparkles',
    active: true, featured: false, title_en: '', title_ar: '',
    description_en: '', description_ar: '', short_desc_en: '', short_desc_ar: '',
    hero_title_en: '', hero_title_ar: '', hero_subtitle_en: '', hero_subtitle_ar: '',
    cover_image_url: '', provider_name: 'fal.ai', provider_endpoint: '',
    default_credit_cost: 2, internal_provider_cost_estimate: 0, result_type: 'image', sort_order: 0,
    tool_mode: 'standard', selected_model_id: null,
    default_prompt_en: '', default_prompt_ar: '',
    cta_label_en: 'Generate', cta_label_ar: 'إنشاء',
    upload_label_en: 'Upload Image', upload_label_ar: 'رفع صورة',
    upload_helper_en: 'JPG, PNG up to 10MB', upload_helper_ar: 'JPG، PNG حتى 10 ميغابايت',
    requires_upload: false, auto_run: false, prompt_hidden: false,
  };
}

// ── Provider Card ──
function ProviderCard({ provider, onUpdate, onDelete, onSetDefault }: {
  provider: ToolProvider;
  onUpdate: (id: string, updates: Partial<ToolProvider>) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string, toolId: string) => void;
}) {
  const creditValue = 0.016;
  const revenue = provider.credit_cost * creditValue;
  const margin = revenue - Number(provider.internal_cost_usd);
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-all ${
      !provider.is_active ? 'opacity-50 border-border/20 bg-muted/5' : 'border-border/40 bg-card/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${TIER_COLORS[provider.tier] || TIER_COLORS.standard}`}>
            {provider.tier}
          </Badge>
          <span className="text-[13px] font-medium">{provider.display_name}</span>
          {provider.is_default && (
            <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30 px-1.5 py-0">Default</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Set as default"
            onClick={() => onSetDefault(provider.id, provider.tool_id)}>
            <Star size={12} className={provider.is_default ? 'fill-primary text-primary' : 'text-muted-foreground'} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(provider.id)}>
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground font-mono">{provider.provider_endpoint}</p>
      <p className="text-[11px] text-muted-foreground">{provider.description}</p>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <span className="text-muted-foreground/60">Credits</span>
          <p className="font-medium">{provider.credit_cost}</p>
        </div>
        <div>
          <span className="text-muted-foreground/60">Cost</span>
          <p className="font-medium">${Number(provider.internal_cost_usd).toFixed(3)}</p>
        </div>
        <div>
          <span className="text-muted-foreground/60">Margin</span>
          <p className={`font-medium ${marginPct > 70 ? 'text-green-500' : marginPct > 40 ? 'text-yellow-500' : 'text-destructive'}`}>
            ${margin.toFixed(3)} ({marginPct.toFixed(0)}%)
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/20">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Active</span>
          <Switch checked={provider.is_active} onCheckedChange={v => onUpdate(provider.id, { is_active: v })} className="scale-75" />
        </div>
      </div>
    </div>
  );
}

// ── Add Provider Form ──
function AddProviderForm({ toolId, onDone }: { toolId: string; onDone: () => void }) {
  const { addProvider } = useToolProviders(toolId);
  const [form, setForm] = useState({
    display_name: '', display_name_ar: '', provider_endpoint: '', tier: 'standard',
    description: '', description_ar: '',
    credit_cost: 5, internal_cost_usd: 0.03, is_active: true, is_default: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.display_name || !form.provider_endpoint) {
      toast({ title: 'Missing fields', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      await addProvider.mutateAsync({
        tool_id: toolId,
        provider_name: 'fal.ai',
        ...form,
      });
      toast({ title: 'Provider added' });
      onDone();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const rev = form.credit_cost * 0.016;
  const margin = rev - form.internal_cost_usd;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-xs font-semibold text-primary">Add New Provider</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px]">Display Name (EN)</Label>
          <Input value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} className="h-8 text-xs bg-muted/30 border-border/40" placeholder="e.g. Clarity Upscaler" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Display Name (AR)</Label>
          <Input dir="rtl" value={form.display_name_ar} onChange={e => setForm(p => ({ ...p, display_name_ar: e.target.value }))} className="h-8 text-xs bg-muted/30 border-border/40 text-right" placeholder="مثال: تحسين الدقة" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px]">Endpoint</Label>
          <Input value={form.provider_endpoint} onChange={e => setForm(p => ({ ...p, provider_endpoint: e.target.value }))} className="h-8 text-xs bg-muted/30 border-border/40 font-mono" placeholder="fal-ai/..." />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px]">Tier</Label>
          <Select value={form.tier} onValueChange={v => setForm(p => ({ ...p, tier: v }))}>
            <SelectTrigger className="h-8 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="legacy">Legacy</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Credits</Label>
          <Input type="number" value={form.credit_cost} onChange={e => setForm(p => ({ ...p, credit_cost: parseInt(e.target.value) || 0 }))} className="h-8 text-xs bg-muted/30 border-border/40" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Cost ($)</Label>
          <Input type="number" step="0.001" value={form.internal_cost_usd} onChange={e => setForm(p => ({ ...p, internal_cost_usd: parseFloat(e.target.value) || 0 }))} className="h-8 text-xs bg-muted/30 border-border/40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px]">Description (EN)</Label>
          <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="min-h-[50px] text-xs bg-muted/30 border-border/40" placeholder="English description" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Description (AR)</Label>
          <Textarea dir="rtl" value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} className="min-h-[50px] text-xs bg-muted/30 border-border/40 text-right" placeholder="الوصف بالعربية" />
        </div>
      </div>
      <div className="rounded-lg bg-muted/20 p-2 text-[10px] text-muted-foreground">
        Revenue: ${rev.toFixed(3)} — Cost: ${form.internal_cost_usd.toFixed(3)} →{' '}
        <span className={margin > 0 ? 'text-green-500' : 'text-destructive'}>Margin: ${margin.toFixed(3)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px]">Active</span>
          <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} className="scale-75" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]">Default</span>
          <Switch checked={form.is_default} onCheckedChange={v => setForm(p => ({ ...p, is_default: v }))} className="scale-75" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={onDone}>Cancel</Button>
        <Button size="sm" className="text-xs h-7 gap-1" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 size={10} className="animate-spin" />} Save
        </Button>
      </div>
    </div>
  );
}

// ── Analytics Tab ──
function ToolAnalyticsTab({ toolSlug }: { toolSlug: string }) {
  const { data: runs = [] } = useQuery({
    queryKey: ['tool-runs-analytics', toolSlug],
    queryFn: async () => {
      const { data } = await supabase.from('tool_runs').select('*').eq('tool_slug', toolSlug).order('created_at', { ascending: false }).limit(500);
      return data || [];
    },
  });

  const totalRuns = runs.length;
  const completed = runs.filter((r: any) => r.status === 'completed');
  const totalRevenue = completed.reduce((s: number, r: any) => s + (Number(r.revenue) || 0), 0);
  const totalCost = completed.reduce((s: number, r: any) => s + (Number(r.estimated_provider_cost) || 0), 0);
  const profit = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // Group by provider
  const byProvider: Record<string, { runs: number; cost: number; revenue: number }> = {};
  completed.forEach((r: any) => {
    const ep = r.provider_endpoint || 'unknown';
    if (!byProvider[ep]) byProvider[ep] = { runs: 0, cost: 0, revenue: 0 };
    byProvider[ep].runs++;
    byProvider[ep].cost += Number(r.estimated_provider_cost) || 0;
    byProvider[ep].revenue += Number(r.revenue) || 0;
  });

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Runs', value: totalRuns },
          { label: 'Revenue', value: `$${totalRevenue.toFixed(3)}` },
          { label: 'API Cost', value: `$${totalCost.toFixed(3)}` },
          { label: 'Margin', value: `${marginPct.toFixed(0)}%` },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-muted/20 border border-border/20 p-3">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className="text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold mb-2">Runs by Provider</p>
        <div className="rounded-lg border border-border/20 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-muted/20"><th className="text-left p-2">Provider</th><th className="p-2 text-right">Runs</th><th className="p-2 text-right">Cost</th><th className="p-2 text-right">Revenue</th><th className="p-2 text-right">Margin</th></tr></thead>
            <tbody>
              {Object.entries(byProvider).map(([ep, d]) => {
                const m = d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue * 100) : 0;
                return (
                  <tr key={ep} className="border-t border-border/10">
                    <td className="p-2 font-mono text-[10px]">{ep}</td>
                    <td className="p-2 text-right">{d.runs}</td>
                    <td className="p-2 text-right">${d.cost.toFixed(3)}</td>
                    <td className="p-2 text-right">${d.revenue.toFixed(3)}</td>
                    <td className={`p-2 text-right font-medium ${m > 70 ? 'text-green-500' : m > 40 ? 'text-yellow-500' : 'text-destructive'}`}>{m.toFixed(0)}%</td>
                  </tr>
                );
              })}
              {Object.keys(byProvider).length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No run data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Dialog ──
export default function AdminToolEditorDialog({ open, onOpenChange, tool }: Props) {
  const [form, setForm] = useState<Partial<ToolRecord>>(emptyTool());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateTool, addTool } = useToolsDB();
  const { providers, updateProvider, deleteProvider, setDefault } = useToolProviders(tool?.id);
  const { activeModels } = useModels();
  const isEdit = !!tool;

  useEffect(() => {
    if (open) {
      setForm(tool ? { ...tool } : emptyTool());
      setUrlMode(false);
      setShowAddProvider(false);
    }
  }, [open, tool]);

  const set = (key: keyof ToolRecord, value: any) => setForm(p => ({ ...p, [key]: value }));

  const missingArabic = ['title_ar', 'description_ar', 'short_desc_ar', 'hero_title_ar', 'hero_subtitle_ar']
    .filter(k => !form[k as keyof ToolRecord]);

  const uploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Only JPG, PNG, and WEBP are accepted', variant: 'destructive' }); return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: 'File too large', description: 'Maximum file size is 10MB', variant: 'destructive' }); return;
    }
    setUploading(true);
    const slug = form.slug || 'tool';
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('tool-covers').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('tool-covers').getPublicUrl(path);
    set('cover_image_url', urlData.publicUrl);
    toast({ title: 'Image uploaded' });
    setUploading(false);
  }, [form.slug]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) uploadFile(file); if (e.target) e.target.value = '';
  };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) uploadFile(file); };
  const handleRemoveImage = () => set('cover_image_url', '');

  const handleSave = async () => {
    if (!form.title_en?.trim()) { toast({ title: 'Validation', description: 'English title is required', variant: 'destructive' }); return; }
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

  const handleProviderUpdate = (id: string, updates: Partial<ToolProvider>) => {
    updateProvider.mutate({ id, updates });
  };
  const handleProviderDelete = (id: string) => {
    deleteProvider.mutate(id, { onSuccess: () => toast({ title: 'Provider removed' }) });
  };
  const handleSetDefault = (providerId: string, toolId: string) => {
    setDefault.mutate({ providerId, toolId });
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

  const coverUrl = form.cover_image_url || '';
  const activeProviderCount = providers.filter(p => p.is_active).length;
  const defaultProviderName = providers.find(p => p.is_default)?.display_name || '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card border-border/40">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg">{isEdit ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? `${activeProviderCount} active provider${activeProviderCount !== 1 ? 's' : ''} • Default: ${defaultProviderName}` : 'Configure a new tool'}
          </DialogDescription>
          {missingArabic.length > 0 && (
            <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30 w-fit mt-1">
              <AlertTriangle size={10} className="mr-1" /> {missingArabic.length} Arabic field{missingArabic.length > 1 ? 's' : ''} missing
            </Badge>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="bg-muted/30 mb-4 flex-wrap">
              <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
              <TabsTrigger value="hero" className="text-xs">Hero & CTA</TabsTrigger>
              <TabsTrigger value="guided" className="text-xs">Guided Mode</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
              <TabsTrigger value="provider" className="text-xs">Providers ({providers.length})</TabsTrigger>
              {isEdit && <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>}
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 pb-4">
              <BiField label="Tool Name" enKey="title_en" arKey="title_ar" />
              <BiField label="Short Description" enKey="short_desc_en" arKey="short_desc_ar" />
              <BiField label="Full Description" enKey="description_en" arKey="description_ar" textarea />
            </TabsContent>

            {/* Hero Tab */}
            <TabsContent value="hero" className="space-y-4 pb-4">
              <BiField label="Hero Title" enKey="hero_title_en" arKey="hero_title_ar" />
              <BiField label="Hero Subtitle" enKey="hero_subtitle_en" arKey="hero_subtitle_ar" textarea />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cover Image</Label>
                  <button type="button" onClick={() => setUrlMode(!urlMode)} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    <LinkIcon size={10} /> {urlMode ? 'Switch to Upload' : 'Paste URL instead'}
                  </button>
                </div>
                {coverUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border/40 bg-muted/10">
                    <img src={coverUrl} alt="Cover preview" className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium hover:bg-black/80 transition-colors">Replace</button>
                      <button type="button" onClick={handleRemoveImage} className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-destructive/80 transition-colors"><X size={12} /></button>
                    </div>
                  </div>
                ) : urlMode ? (
                  <div className="space-y-2">
                    <Input value={coverUrl} onChange={e => set('cover_image_url', e.target.value)} className="h-9 text-xs bg-muted/30 border-border/40 font-mono" placeholder="https://example.com/image.jpg" />
                  </div>
                ) : (
                  <div onClick={() => !uploading && fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                    className={`relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
                      uploading ? 'border-primary/50 bg-primary/5' : 'border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-muted/20'
                    }`}>
                    {uploading ? (<><Loader2 size={24} className="animate-spin text-primary" /><span className="text-[12px] text-primary font-medium">Uploading...</span></>) : (
                      <><div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center"><Upload size={20} className="text-muted-foreground" /></div>
                      <span className="text-[12px] text-muted-foreground font-medium">Click to upload or drag & drop</span>
                      <span className="text-[10px] text-muted-foreground/60">JPG, PNG, WEBP • Max 10MB</span></>
                    )}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Slug</Label><Input value={form.slug || ''} onChange={e => set('slug', e.target.value)} className="h-9 text-xs bg-muted/30 border-border/40 font-mono" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Route</Label><Input value={form.route || ''} onChange={e => set('route', e.target.value)} className="h-9 text-xs bg-muted/30 border-border/40 font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Input Type</Label>
                  <Select value={form.input_type || 'prompt'} onValueChange={v => set('input_type', v)}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="prompt">Prompt</SelectItem><SelectItem value="upload">Upload</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Icon</Label>
                  <Select value={form.icon_name || 'Sparkles'} onValueChange={v => set('icon_name', v)}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent>{ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Sort Order</Label><Input type="number" value={form.sort_order || 0} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} className="h-9 text-xs bg-muted/30 border-border/40" /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Result Type</Label>
                  <Select value={form.result_type || 'image'} onValueChange={v => set('result_type', v)}>
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="image">Image</SelectItem><SelectItem value="images">Multiple Images</SelectItem><SelectItem value="file">File</SelectItem></SelectContent>
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

            {/* Providers Tab */}
            <TabsContent value="provider" className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">AI Providers for this tool</p>
                {isEdit && !showAddProvider && (
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => setShowAddProvider(true)}>
                    <Plus size={12} /> Add Provider
                  </Button>
                )}
              </div>

              {showAddProvider && tool && (
                <AddProviderForm toolId={tool.id} onDone={() => setShowAddProvider(false)} />
              )}

              {isEdit ? (
                providers.length > 0 ? (
                  <div className="space-y-3">
                    {providers.map(p => (
                      <ProviderCard key={p.id} provider={p} onUpdate={handleProviderUpdate} onDelete={handleProviderDelete} onSetDefault={handleSetDefault} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">No providers configured. Add one above.</div>
                )
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">Save the tool first, then add providers.</div>
              )}

              {/* Legacy single provider fields */}
              {isEdit && (
                <div className="border-t border-border/20 pt-4 mt-4">
                  <p className="text-[10px] text-muted-foreground mb-2">Legacy fallback (used if no providers configured)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-[10px]">Provider Name</Label><Input value={form.provider_name || ''} onChange={e => set('provider_name', e.target.value)} className="h-8 text-xs bg-muted/20 border-border/20" /></div>
                    <div className="space-y-1"><Label className="text-[10px]">Endpoint</Label><Input value={form.provider_endpoint || ''} onChange={e => set('provider_endpoint', e.target.value)} className="h-8 text-xs bg-muted/20 border-border/20 font-mono" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="space-y-1"><Label className="text-[10px]">Credit Cost</Label><Input type="number" value={form.default_credit_cost || 0} onChange={e => set('default_credit_cost', parseInt(e.target.value) || 0)} className="h-8 text-xs bg-muted/20 border-border/20" /></div>
                    <div className="space-y-1"><Label className="text-[10px]">Internal Cost ($)</Label><Input type="number" step="0.001" value={form.internal_provider_cost_estimate || 0} onChange={e => set('internal_provider_cost_estimate', parseFloat(e.target.value) || 0)} className="h-8 text-xs bg-muted/20 border-border/20" /></div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            {isEdit && (
              <TabsContent value="analytics">
                <ToolAnalyticsTab toolSlug={tool!.slug} />
              </TabsContent>
            )}
          </Tabs>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2 border-t border-border/20">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={handleSave} disabled={saving || uploading}>
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Tool'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
