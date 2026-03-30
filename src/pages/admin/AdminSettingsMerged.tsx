import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Globe, Shield, Zap, FileText, Bell, Languages, Lock, Clock, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import AdminNotifications from './AdminNotifications';
import AdminTranslations from './AdminTranslations';
import AdminRoles from './AdminRoles';
import BrandThemeTab from '@/components/admin/BrandThemeTab';
import {
  usePricingPlans, useCreditPackages,
  useSavePlan, useDeletePlan, useSavePackage, useDeletePackage,
  type PricingPlan, type PlanFeature, type CreditPackage,
} from '@/hooks/useBillingData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Plan Editor (from AdminBilling) ──
function PlanEditor({ plan, onClose }: { plan: Partial<PricingPlan> | null; onClose: () => void }) {
  const [form, setForm] = useState<any>(plan || { slug: '', name_en: '', name_ar: '', price: 0, price_monthly_usd: 0, price_annual_usd: 0, price_annual_monthly_equivalent: 0, annual_discount_percent: 20, credits_monthly: 0, currency: 'USD', billing_period: 'monthly', included_credits: 0, description_en: '', description_ar: '', badge_en: '', badge_ar: '', cta_label_en: 'Get Started', cta_label_ar: '', cta_action: 'signup', featured: false, active: true, sort_order: 0, is_default: false, visible_logged_out: true, visible_logged_in: true, features: [] });
  const [features, setFeatures] = useState<Array<{en: string; ar: string}>>(plan?.features || []);
  const savePlan = useSavePlan();

  const save = async () => {
    try {
      await savePlan.mutateAsync({ plan: { ...form, features } });
      toast.success('Plan saved');
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{plan?.id ? 'Edit Plan' : 'New Plan'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs">Slug</Label><Input value={form.slug} onChange={e => f('slug', e.target.value)} /></div>
          <div><Label className="text-xs">Price</Label><Input type="number" value={form.price} onChange={e => f('price', +e.target.value)} /></div>
          <div><Label className="text-xs">Name (EN)</Label><Input value={form.name_en} onChange={e => f('name_en', e.target.value)} /></div>
          <div><Label className="text-xs">Name (AR)</Label><Input dir="rtl" value={form.name_ar} onChange={e => f('name_ar', e.target.value)} /></div>
          <div><Label className="text-xs">Description (EN)</Label><Textarea value={form.description_en} onChange={e => f('description_en', e.target.value)} /></div>
          <div><Label className="text-xs">Description (AR)</Label><Textarea dir="rtl" value={form.description_ar} onChange={e => f('description_ar', e.target.value)} /></div>
          <div><Label className="text-xs">Credits</Label><Input type="number" value={form.included_credits} onChange={e => f('included_credits', +e.target.value)} /></div>
          <div><Label className="text-xs">Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => f('sort_order', +e.target.value)} /></div>
          <div className="flex items-center gap-3"><Switch checked={form.featured} onCheckedChange={v => f('featured', v)} /><Label className="text-xs">Featured</Label></div>
          <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => f('active', v)} /><Label className="text-xs">Active</Label></div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">Features</Label>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setFeatures(p => [...p, { en: '', ar: '' }])}>
              <Plus size={12} /> Add Feature
            </Button>
          </div>
          {features.map((feat, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
              <Input placeholder="EN" value={feat.en} onChange={e => { const n = [...features]; n[i] = { ...n[i], en: e.target.value }; setFeatures(n); }} className="text-xs" />
              <Input dir="rtl" placeholder="AR" value={feat.ar} onChange={e => { const n = [...features]; n[i] = { ...n[i], ar: e.target.value }; setFeatures(n); }} className="text-xs" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFeatures(p => p.filter((_, j) => j !== i))}><Trash2 size={12} /></Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={savePlan.isPending}>{savePlan.isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Audit Log Tab ──
function AuditLogTab() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  return (
    <Card className="border-border/40 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Admin Actions (Last 100)</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="border-border/40">
            <TableHead className="text-[11px] uppercase text-muted-foreground">Time</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Action</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Entity</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log: any) => (
            <TableRow key={log.id} className="border-border/20">
              <TableCell className="text-[12px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{log.action}</Badge></TableCell>
              <TableCell className="text-[12px]">{log.entity_type} {log.entity_id ? `#${log.entity_id.substring(0, 8)}` : ''}</TableCell>
              <TableCell className="text-[11px] text-muted-foreground max-w-[200px] truncate">
                {log.new_value && Object.keys(log.new_value).length > 0 ? JSON.stringify(log.new_value).substring(0, 60) + '...' : '—'}
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                {isLoading ? 'Loading...' : 'No audit log entries yet'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

// ── Plans Tab ──
function PlansTab() {
  const { data: plans = [] } = usePricingPlans();
  const deletePlan = useDeletePlan();
  const [editPlan, setEditPlan] = useState<Partial<PricingPlan> | null | 'new'>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage subscription plans — changes reflect on the frontend pricing page immediately.</p>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditPlan('new')}><Plus size={14} /> Add Plan</Button>
      </div>
      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Plan</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Price</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Credits</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p: any) => (
              <TableRow key={p.id} className="border-border/20 hover:bg-muted/20 cursor-pointer" onClick={() => setEditPlan(p)}>
                <TableCell>
                  <div>
                    <p className="text-[13px] font-medium">{p.name_en}</p>
                    <p className="text-[11px] text-muted-foreground">{p.slug}</p>
                  </div>
                </TableCell>
                <TableCell className="text-[13px]">{p.price > 0 ? `$${p.price}/${p.billing_period}` : 'Free'}</TableCell>
                <TableCell className="text-[13px]">{p.included_credits}</TableCell>
                <TableCell><Badge variant={p.active ? 'default' : 'secondary'} className="text-[10px]">{p.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPlan(p)}><Edit size={12} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePlan.mutate(p.id)}><Trash2 size={12} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {editPlan && <PlanEditor plan={editPlan === 'new' ? null : editPlan} onClose={() => setEditPlan(null)} />}
    </div>
  );
}

// ── General Settings Tab ──
function GeneralTab() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Settings size={16} /> Brand Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label className="text-xs">Platform Name</Label><Input defaultValue="Takhayal.ai" className="h-9 text-sm bg-muted/30" /></div>
          <div className="space-y-2"><Label className="text-xs">Tagline</Label><Input defaultValue="Arabic-first Creative AI Studio" className="h-9 text-sm bg-muted/30" /></div>
          <div className="space-y-2"><Label className="text-xs">Support Email</Label><Input defaultValue="support@takhayal.ai" className="h-9 text-sm bg-muted/30" /></div>
          <Button size="sm" className="text-xs">Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap size={16} /> Feature Flags</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: 'Community Uploads', desc: 'Allow users to submit to community', on: true },
            { name: 'Prompt Enhancement', desc: 'AI-enhanced prompts before generation', on: true },
            { name: 'HD Generation', desc: 'Allow HD quality for Pro users', on: true },
            { name: 'Batch Generation', desc: 'Generate multiple images at once', on: false },
            { name: 'API Access', desc: 'External API access for enterprise', on: false },
          ].map(f => (
            <div key={f.name} className="flex items-center justify-between">
              <div><p className="text-[13px] font-medium">{f.name}</p><p className="text-[11px] text-muted-foreground">{f.desc}</p></div>
              <Switch defaultChecked={f.on} className="scale-75" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield size={16} /> System</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><div><p className="text-[13px] font-medium">Maintenance Mode</p><p className="text-[11px] text-muted-foreground">Disable all user-facing features</p></div><Switch className="scale-75" /></div>
          <div className="space-y-2"><Label className="text-xs">Global Generation Limit (daily)</Label><Input defaultValue="100" type="number" className="h-9 text-sm bg-muted/30 w-24" /></div>
          <div className="space-y-2"><Label className="text-xs">Default Free Credits</Label><Input defaultValue="20" type="number" className="h-9 text-sm bg-muted/30 w-24" /></div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText size={16} /> Legal & Policies</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label className="text-xs">Privacy Policy URL</Label><Input defaultValue="https://takhayal.ai/privacy" className="h-9 text-sm bg-muted/30" /></div>
          <div className="space-y-2"><Label className="text-xs">Terms of Service URL</Label><Input defaultValue="https://takhayal.ai/terms" className="h-9 text-sm bg-muted/30" /></div>
          <Button size="sm" className="text-xs">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Settings Page ──
export default function AdminSettingsMerged() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform configuration, plans, communications, localization, roles, and audit log</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-muted/30 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="general" className="text-xs gap-1.5"><Settings size={14} /> General</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs gap-1.5"><FileText size={14} /> Plans</TabsTrigger>
          <TabsTrigger value="communications" className="text-xs gap-1.5"><Bell size={14} /> Communications</TabsTrigger>
          <TabsTrigger value="localization" className="text-xs gap-1.5"><Languages size={14} /> Localization</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs gap-1.5"><Lock size={14} /> Roles</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1.5"><Clock size={14} /> Audit Log</TabsTrigger>
          <TabsTrigger value="brand" className="text-xs gap-1.5"><Palette size={14} /> Brand & Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="plans"><PlansTab /></TabsContent>
        <TabsContent value="communications"><AdminNotifications embedded /></TabsContent>
        <TabsContent value="localization"><AdminTranslations embedded /></TabsContent>
        <TabsContent value="roles"><AdminRoles embedded /></TabsContent>
        <TabsContent value="audit"><AuditLogTab /></TabsContent>
        <TabsContent value="brand"><BrandThemeTab /></TabsContent>
      </Tabs>
    </div>
  );
}
