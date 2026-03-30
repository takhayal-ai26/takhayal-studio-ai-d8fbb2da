import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, CreditCard, Zap, TrendingUp, Plus, Edit, Trash2, Copy, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  usePricingPlans, useCreditPackages, usePricingFaqs, useCreditExplanations, usePricingPageContent,
  useSavePlan, useDeletePlan, useSavePackage, useDeletePackage,
  useSaveFaq, useDeleteFaq, useSaveExplanation, useDeleteExplanation, useSavePageContent,
  type PricingPlan, type PlanFeature, type CreditPackage, type PricingFaq, type CreditExplanation, type PricingPageContent,
} from '@/hooks/useBillingData';

// ── Plan Editor ──
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
          <div><Label className="text-xs">Badge (EN)</Label><Input value={form.badge_en} onChange={e => f('badge_en', e.target.value)} /></div>
          <div><Label className="text-xs">Badge (AR)</Label><Input dir="rtl" value={form.badge_ar} onChange={e => f('badge_ar', e.target.value)} /></div>
          <div><Label className="text-xs">CTA (EN)</Label><Input value={form.cta_label_en} onChange={e => f('cta_label_en', e.target.value)} /></div>
          <div><Label className="text-xs">CTA (AR)</Label><Input dir="rtl" value={form.cta_label_ar} onChange={e => f('cta_label_ar', e.target.value)} /></div>
          <div><Label className="text-xs">Currency</Label><Input value={form.currency} onChange={e => f('currency', e.target.value)} /></div>
          <div><Label className="text-xs">Billing Period</Label><Input value={form.billing_period} onChange={e => f('billing_period', e.target.value)} /></div>
          <div><Label className="text-xs">Credits</Label><Input type="number" value={form.included_credits} onChange={e => f('included_credits', +e.target.value)} /></div>
          <div><Label className="text-xs">Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => f('sort_order', +e.target.value)} /></div>
          <div className="flex items-center gap-3"><Switch checked={form.featured} onCheckedChange={v => f('featured', v)} /><Label className="text-xs">Featured</Label></div>
          <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => f('active', v)} /><Label className="text-xs">Active</Label></div>
          <div className="flex items-center gap-3"><Switch checked={form.is_default} onCheckedChange={v => f('is_default', v)} /><Label className="text-xs">Default Plan</Label></div>
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

// ── Package Editor ──
function PackageEditor({ pkg, onClose }: { pkg: Partial<CreditPackage> | null; onClose: () => void }) {
  const [form, setForm] = useState<any>(pkg || { name_en: '', name_ar: '', credits: 0, price: 0, currency: 'USD', badge_en: '', badge_ar: '', description_en: '', description_ar: '', cta_label_en: 'Buy', cta_label_ar: 'شراء', featured: false, active: true, sort_order: 0 });
  const savePkg = useSavePackage();
  const save = async () => { try { await savePkg.mutateAsync(form); toast.success('Package saved'); onClose(); } catch (e: any) { toast.error(e.message); } };
  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{pkg?.id ? 'Edit Package' : 'New Package'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Name (EN)</Label><Input value={form.name_en} onChange={e => f('name_en', e.target.value)} /></div>
          <div><Label className="text-xs">Name (AR)</Label><Input dir="rtl" value={form.name_ar} onChange={e => f('name_ar', e.target.value)} /></div>
          <div><Label className="text-xs">Credits</Label><Input type="number" value={form.credits} onChange={e => f('credits', +e.target.value)} /></div>
          <div><Label className="text-xs">Price</Label><Input type="number" step="0.01" value={form.price} onChange={e => f('price', +e.target.value)} /></div>
          <div><Label className="text-xs">Badge (EN)</Label><Input value={form.badge_en} onChange={e => f('badge_en', e.target.value)} /></div>
          <div><Label className="text-xs">Badge (AR)</Label><Input dir="rtl" value={form.badge_ar} onChange={e => f('badge_ar', e.target.value)} /></div>
          <div className="flex items-center gap-3"><Switch checked={form.featured} onCheckedChange={v => f('featured', v)} /><Label className="text-xs">Featured</Label></div>
          <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => f('active', v)} /><Label className="text-xs">Active</Label></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={savePkg.isPending}>{savePkg.isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── FAQ Editor ──
function FaqEditor({ faq, onClose }: { faq: Partial<PricingFaq> | null; onClose: () => void }) {
  const [form, setForm] = useState<any>(faq || { question_en: '', question_ar: '', answer_en: '', answer_ar: '', sort_order: 0, active: true });
  const saveFaq = useSaveFaq();
  const save = async () => { try { await saveFaq.mutateAsync(form); toast.success('FAQ saved'); onClose(); } catch (e: any) { toast.error(e.message); } };
  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{faq?.id ? 'Edit FAQ' : 'New FAQ'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Question (EN)</Label><Input value={form.question_en} onChange={e => f('question_en', e.target.value)} /></div>
          <div><Label className="text-xs">Question (AR)</Label><Input dir="rtl" value={form.question_ar} onChange={e => f('question_ar', e.target.value)} /></div>
          <div><Label className="text-xs">Answer (EN)</Label><Textarea value={form.answer_en} onChange={e => f('answer_en', e.target.value)} /></div>
          <div><Label className="text-xs">Answer (AR)</Label><Textarea dir="rtl" value={form.answer_ar} onChange={e => f('answer_ar', e.target.value)} /></div>
          <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => f('active', v)} /><Label className="text-xs">Active</Label></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{saveFaq.isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Credit Explanation Editor ──
function ExplanationEditor({ item, onClose }: { item: Partial<CreditExplanation> | null; onClose: () => void }) {
  const [form, setForm] = useState<any>(item || { title_en: '', title_ar: '', subtitle_en: '', subtitle_ar: '', icon: 'Image', sort_order: 0, active: true });
  const saveEx = useSaveExplanation();
  const save = async () => { try { await saveEx.mutateAsync(form); toast.success('Saved'); onClose(); } catch (e: any) { toast.error(e.message); } };
  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item?.id ? 'Edit' : 'New'} Credit Explanation</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Title (EN)</Label><Input value={form.title_en} onChange={e => f('title_en', e.target.value)} /></div>
          <div><Label className="text-xs">Title (AR)</Label><Input dir="rtl" value={form.title_ar} onChange={e => f('title_ar', e.target.value)} /></div>
          <div><Label className="text-xs">Subtitle (EN)</Label><Input value={form.subtitle_en} onChange={e => f('subtitle_en', e.target.value)} /></div>
          <div><Label className="text-xs">Subtitle (AR)</Label><Input dir="rtl" value={form.subtitle_ar} onChange={e => f('subtitle_ar', e.target.value)} /></div>
          <div><Label className="text-xs">Icon (lucide name)</Label><Input value={form.icon} onChange={e => f('icon', e.target.value)} /></div>
          <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => f('active', v)} /><Label className="text-xs">Active</Label></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{saveEx.isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page Content Editor ──
function PageContentEditor({ item, onClose }: { item: Partial<PricingPageContent> | null; onClose: () => void }) {
  const [form, setForm] = useState<any>(item || { section_key: '', field_key: '', value_en: '', value_ar: '', sort_order: 0, active: true, metadata_json: {} });
  const savePc = useSavePageContent();
  const save = async () => { try { await savePc.mutateAsync(form); toast.success('Saved'); onClose(); } catch (e: any) { toast.error(e.message); } };
  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item?.id ? 'Edit' : 'New'} Page Content</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Section Key</Label><Input value={form.section_key} onChange={e => f('section_key', e.target.value)} /></div>
            <div><Label className="text-xs">Field Key</Label><Input value={form.field_key} onChange={e => f('field_key', e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Value (EN)</Label><Input value={form.value_en} onChange={e => f('value_en', e.target.value)} /></div>
          <div><Label className="text-xs">Value (AR)</Label><Input dir="rtl" value={form.value_ar} onChange={e => f('value_ar', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{savePc.isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──
export default function AdminBilling({ embedded }: { embedded?: boolean } = {}) {
  const { data: plans = [], isLoading: loadingPlans } = usePricingPlans();
  const { data: packages = [], isLoading: loadingPkgs } = useCreditPackages();
  const { data: faqs = [] } = usePricingFaqs();
  const { data: explanations = [] } = useCreditExplanations();
  const { data: pageContent = [] } = usePricingPageContent();

  const deletePlan = useDeletePlan();
  const deletePkg = useDeletePackage();
  const deleteFaq = useDeleteFaq();
  const deleteEx = useDeleteExplanation();

  const [editPlan, setEditPlan] = useState<Partial<PricingPlan> | null | 'new'>(null);
  const [editPkg, setEditPkg] = useState<Partial<CreditPackage> | null | 'new'>(null);
  const [editFaq, setEditFaq] = useState<Partial<PricingFaq> | null | 'new'>(null);
  const [editEx, setEditEx] = useState<Partial<CreditExplanation> | null | 'new'>(null);
  const [editPc, setEditPc] = useState<Partial<PricingPageContent> | null | 'new'>(null);

  const totalPaid = plans.filter(p => p.price > 0).reduce((s, p) => s + p.price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Credits</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage plans, packages, pricing page content, FAQs, and credit explanations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Plans', value: plans.length, icon: DollarSign },
          { label: 'Packages', value: packages.length, icon: CreditCard },
          { label: 'FAQs', value: faqs.length, icon: Zap },
          { label: 'Credit Cards', value: explanations.length, icon: TrendingUp },
        ].map(s => (
          <Card key={s.label} className="border-border/40 bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><s.icon size={16} className="text-primary" /></div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="plans" className="text-xs">Plans</TabsTrigger>
          <TabsTrigger value="packages" className="text-xs">Credit Packages</TabsTrigger>
          <TabsTrigger value="faqs" className="text-xs">FAQs</TabsTrigger>
          <TabsTrigger value="explanations" className="text-xs">Credit Explanations</TabsTrigger>
          <TabsTrigger value="page-content" className="text-xs">Page Content</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Pricing Plans</CardTitle>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditPlan('new')}><Plus size={14} /> Add Plan</Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Plan</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Price</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Credits</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Features</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(p => (
                  <TableRow key={p.id} className="border-border/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{p.name_en}</span>
                        {p.featured && <Badge className="text-[9px]">Featured</Badge>}
                        {p.is_default && <Badge variant="outline" className="text-[9px]">Default</Badge>}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{p.name_ar}</span>
                    </TableCell>
                    <TableCell className="text-[13px] font-medium text-primary">${p.price}/{p.billing_period}</TableCell>
                    <TableCell className="text-[13px]">{p.included_credits}</TableCell>
                    <TableCell className="text-[13px]">{p.features?.length || 0}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${p.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>{p.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPlan(p)}><Edit size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPlan({ ...p, id: undefined, slug: p.slug + '-copy', name_en: p.name_en + ' Copy' } as any)}><Copy size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete this plan?')) deletePlan.mutate(p.id); }}><Trash2 size={12} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Credit Packages</CardTitle>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditPkg('new')}><Plus size={14} /> Add Package</Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Package</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Credits</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Price</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Badge</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map(p => (
                  <TableRow key={p.id} className="border-border/20">
                    <TableCell>
                      <span className="text-[13px] font-medium">{p.name_en}</span>
                      <br /><span className="text-[11px] text-muted-foreground">{p.name_ar}</span>
                    </TableCell>
                    <TableCell className="text-[13px]">{p.credits}</TableCell>
                    <TableCell className="text-[13px] font-medium text-primary">${p.price}</TableCell>
                    <TableCell>{p.badge_en && <Badge variant="outline" className="text-[10px]">{p.badge_en}</Badge>}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${p.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>{p.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPkg(p)}><Edit size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete?')) deletePkg.mutate(p.id); }}><Trash2 size={12} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Pricing FAQs</CardTitle>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditFaq('new')}><Plus size={14} /> Add FAQ</Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Question (EN)</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Question (AR)</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map(f => (
                  <TableRow key={f.id} className="border-border/20">
                    <TableCell className="text-[13px]">{f.question_en}</TableCell>
                    <TableCell className="text-[13px]" dir="rtl">{f.question_ar}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${f.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>{f.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditFaq(f)}><Edit size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete?')) deleteFaq.mutate(f.id); }}><Trash2 size={12} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Credit Explanations Tab */}
        <TabsContent value="explanations">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Credit Usage Explanations</CardTitle>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditEx('new')}><Plus size={14} /> Add Card</Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Title (EN)</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Subtitle (EN)</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Icon</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {explanations.map(ex => (
                  <TableRow key={ex.id} className="border-border/20">
                    <TableCell className="text-[13px] font-medium">{ex.title_en}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{ex.subtitle_en}</TableCell>
                    <TableCell className="text-[13px]">{ex.icon}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${ex.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>{ex.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditEx(ex)}><Edit size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete?')) deleteEx.mutate(ex.id); }}><Trash2 size={12} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Page Content Tab */}
        <TabsContent value="page-content">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Pricing Page Content</CardTitle>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditPc('new')}><Plus size={14} /> Add Content</Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Section</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Field</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Value (EN)</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Value (AR)</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageContent.map(pc => (
                  <TableRow key={pc.id} className="border-border/20">
                    <TableCell className="text-[13px] font-medium">{pc.section_key}</TableCell>
                    <TableCell className="text-[13px]">{pc.field_key}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground truncate max-w-[200px]">{pc.value_en}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground truncate max-w-[200px]" dir="rtl">{pc.value_ar}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPc(pc)}><Edit size={12} /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Editors */}
      {editPlan && <PlanEditor plan={editPlan === 'new' ? null : editPlan} onClose={() => setEditPlan(null)} />}
      {editPkg && <PackageEditor pkg={editPkg === 'new' ? null : editPkg} onClose={() => setEditPkg(null)} />}
      {editFaq && <FaqEditor faq={editFaq === 'new' ? null : editFaq} onClose={() => setEditFaq(null)} />}
      {editEx && <ExplanationEditor item={editEx === 'new' ? null : editEx} onClose={() => setEditEx(null)} />}
      {editPc && <PageContentEditor item={editPc === 'new' ? null : editPc} onClose={() => setEditPc(null)} />}
    </div>
  );
}
