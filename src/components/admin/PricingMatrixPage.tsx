import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pencil, X, ChevronRight, ChevronLeft, Save, AlertTriangle, Filter, Download, RefreshCw, Info, ChevronDown, ChevronUp, Image, Film } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CREDIT_VALUE_USD } from '@/lib/pricing-engine';
import { useSearchParams } from 'react-router-dom';

// ─── Shared ───
interface TierRow {
  id: string;
  model_id: string;
  quality_level: string | null;
  cost_per_run: number;
  credits_charged: number;
  is_active: boolean;
  is_available: boolean;
  is_default: boolean;
  tier_label: string;
  pricing_mode: string;
  resolution_label: string | null;
  actual_pixels: number | null;
}

interface ModelRow {
  id: string;
  model_name: string;
  endpoint_id: string;
  provider_name: string;
  is_active: boolean;
  pricing_mode: string;
}

interface MatrixRow {
  model: ModelRow;
  tiers: { '1K'?: TierRow; '2K'?: TierRow; '4K'?: TierRow };
  category: string;
}

const CREDIT_VALUE = CREDIT_VALUE_USD;

const marginColor = (m: number) =>
  m > 70 ? 'text-emerald-400' : m > 50 ? 'text-foreground' : m > 30 ? 'text-yellow-400' : 'text-red-400';
const marginBg = (m: number) =>
  m < 30 ? 'bg-red-500/5' : '';

function calcMargin(cost: number, credits: number) {
  const rev = credits * CREDIT_VALUE;
  return rev > 0 ? ((rev - cost) / rev) * 100 : 0;
}

function getCategory(endpoint: string): string {
  if (endpoint.includes('clarity') || endpoint.includes('esrgan') || endpoint.includes('flux-vision-upscaler') || endpoint.includes('creative-upscaler')) return 'Upscale';
  if (endpoint.includes('bria') || endpoint.includes('ben')) return 'Remove BG';
  if (endpoint.includes('recraft')) return 'Image Gen + Logo';
  return 'Image Gen';
}

// ─── VIDEO TYPES ───
interface VideoModelRow {
  id: string;
  name: string;
  display_name: string;
  fal_endpoint: string;
  provider: string;
  is_active: boolean;
  supports_audio: boolean;
}

interface VideoPricingRow {
  id: string;
  video_model_id: string;
  duration_seconds: number;
  resolution: string;
  audio_enabled: boolean;
  api_cost_usd: number;
  our_credits: number;
  is_active: boolean;
  is_available: boolean;
}

// ═══════════════════════════════════════════
// VIDEO PRICING TABLE
// ═══════════════════════════════════════════
function VideoPricingTable() {
  const [models, setModels] = useState<VideoModelRow[]>([]);
  const [pricing, setPricing] = useState<VideoPricingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, Partial<VideoPricingRow>>>({});
  const [editStep, setEditStep] = useState<'edit' | 'review'>('edit');

  const load = useCallback(async () => {
    setLoading(true);
    const [mRes, pRes] = await Promise.all([
      supabase.from('video_models' as any).select('id, name, display_name, fal_endpoint, provider, is_active, supports_audio').order('sort_order'),
      supabase.from('video_model_pricing' as any).select('*').order('duration_seconds').order('resolution').order('audio_enabled'),
    ]);
    setModels((mRes.data as any[]) || []);
    setPricing((pRes.data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    return models.map(m => ({
      model: m,
      tiers: pricing.filter(p => p.video_model_id === m.id),
    }));
  }, [models, pricing]);

  const startEdit = (modelId: string) => {
    const tiers = pricing.filter(p => p.video_model_id === modelId);
    const vals: Record<string, Partial<VideoPricingRow>> = {};
    for (const t of tiers) {
      vals[t.id] = { api_cost_usd: t.api_cost_usd, our_credits: t.our_credits, is_active: t.is_active, is_available: t.is_available };
    }
    setEditValues(vals);
    setEditingId(modelId);
    setEditStep('edit');
    setExpandedModel(modelId);
  };

  const cancelEdit = () => { setEditingId(null); setEditStep('edit'); };

  const saveChanges = async () => {
    if (!editingId) return;
    try {
      const tiers = pricing.filter(p => p.video_model_id === editingId);
      for (const t of tiers) {
        const ev = editValues[t.id];
        if (!ev) continue;
        const changed = ev.api_cost_usd !== t.api_cost_usd || ev.our_credits !== t.our_credits || ev.is_active !== t.is_active || ev.is_available !== t.is_available;
        if (changed) {
          await supabase.from('video_model_pricing' as any).update({
            api_cost_usd: ev.api_cost_usd,
            our_credits: ev.our_credits,
            is_active: ev.is_active,
            is_available: ev.is_available,
            updated_at: new Date().toISOString(),
          }).eq('id', t.id);
          await supabase.from('admin_audit_log').insert({
            action: 'video_pricing_update',
            entity_type: 'video_model_pricing',
            entity_id: t.id,
            old_value: { api_cost_usd: t.api_cost_usd, our_credits: t.our_credits, is_active: t.is_active, is_available: t.is_available },
            new_value: ev,
          } as any);
        }
      }
      toast({ title: 'Video pricing updated', description: `${models.find(m => m.id === editingId)?.display_name} pricing saved.` });
      cancelEdit();
      await load();
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
  };

  const hasChanges = useMemo(() => {
    if (!editingId) return false;
    const tiers = pricing.filter(p => p.video_model_id === editingId);
    for (const t of tiers) {
      const ev = editValues[t.id];
      if (!ev) continue;
      if (ev.api_cost_usd !== t.api_cost_usd || ev.our_credits !== t.our_credits || ev.is_active !== t.is_active || ev.is_available !== t.is_available) return true;
    }
    return false;
  }, [editingId, editValues, pricing]);

  const exportCSV = () => {
    const rows = ['Model,Provider,Duration,Resolution,Audio,API Cost,Credits,Revenue,Margin %,Active'];
    for (const g of grouped) {
      for (const t of g.tiers) {
        const rev = t.our_credits * CREDIT_VALUE;
        const margin = rev > 0 ? ((rev - t.api_cost_usd) / rev * 100) : 0;
        rows.push([g.model.display_name, g.model.provider, `${t.duration_seconds}s`, t.resolution, t.audio_enabled ? 'Yes' : 'No', t.api_cost_usd, t.our_credits, rev.toFixed(4), margin.toFixed(0) + '%', t.is_active ? 'Yes' : 'No'].join(','));
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'video-pricing-matrix.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Loading video pricing…</div>;

  const totalTiers = pricing.length;
  const activeModels = models.filter(m => m.is_active).length;
  const allMargins = pricing.map(p => calcMargin(p.api_cost_usd, p.our_credits));
  const avgMargin = allMargins.length > 0 ? allMargins.reduce((a, b) => a + b, 0) / allMargins.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Video Pricing Matrix</h2>
          <p className="text-[11px] text-muted-foreground">{models.length} models · {totalTiers} tiers · 1 credit = ${CREDIT_VALUE}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={exportCSV}>
            <Download size={12} />CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={load}>
            <RefreshCw size={12} />Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex items-center gap-2">
        <Info size={13} className="text-blue-400 flex-shrink-0" />
        <span className="text-[11px] text-blue-300">Video models are priced by duration × resolution × audio. Click the edit icon to modify. Changes require review before saving.</span>
      </div>

      <div className="rounded-xl border border-border/20 bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Model</th>
                <th className="text-left px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Provider</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Category</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">FAL API Cost</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Duration</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Resolution</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Audio</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Our Credits</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Revenue</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold">Margin %</th>
                <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold" colSpan={2}>Status</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(g => {
                const isExpanded = expandedModel === g.model.id;
                const isEditing = editingId === g.model.id;
                const cheapest = g.tiers.reduce((min, t) => t.our_credits < min ? t.our_credits : min, Infinity);
                const mostExpensive = g.tiers.reduce((max, t) => t.our_credits > max ? t.our_credits : max, 0);

                return (
                  <React.Fragment key={g.model.id}>
                    {/* Summary row */}
                    <tr
                      className={`border-b border-border/10 cursor-pointer transition-colors group ${!g.model.is_active ? 'opacity-40' : 'hover:bg-muted/5'} ${isEditing ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''}`}
                      onClick={() => !isEditing && setExpandedModel(isExpanded ? null : g.model.id)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                          <div>
                            <p className="text-[12px] font-semibold text-foreground">{g.model.display_name}</p>
                            <p className="text-[9px] text-muted-foreground/50 font-mono truncate max-w-[180px]">{g.model.fal_endpoint}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-[11px] text-muted-foreground">{g.model.provider}</td>
                      <td className="px-2 py-2.5 text-center">
                        <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20">Video</Badge>
                      </td>
                      <td className="px-2 py-2.5 text-center text-[11px] text-muted-foreground">{g.tiers.length} tiers</td>
                      <td className="px-2 py-2.5 text-center text-[11px] text-muted-foreground">
                        {[...new Set(g.tiers.map(t => `${t.duration_seconds}s`))].join(', ')}
                      </td>
                      <td className="px-2 py-2.5 text-center text-[11px] text-muted-foreground">
                        {[...new Set(g.tiers.map(t => t.resolution))].join(', ')}
                      </td>
                      <td className="px-2 py-2.5 text-center text-[11px]">
                        {g.model.supports_audio ? (
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center text-[11px] font-semibold">
                        {cheapest === mostExpensive ? cheapest : `${cheapest}–${mostExpensive}`}
                      </td>
                      <td className="px-2 py-2.5 text-center text-[11px] text-emerald-400">
                        ${(cheapest * CREDIT_VALUE).toFixed(2)}–${(mostExpensive * CREDIT_VALUE).toFixed(2)}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {(() => {
                          const margins = g.tiers.map(t => calcMargin(t.api_cost_usd, t.our_credits));
                          const avg = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
                          return <span className={`text-[11px] font-semibold ${marginColor(avg)}`}>{avg.toFixed(0)}%</span>;
                        })()}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {g.model.is_active ? (
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] bg-muted/20 text-muted-foreground border-border/20">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-1 py-2.5 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); startEdit(g.model.id); }}
                          className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-muted/20 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Pencil size={12} />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded tier rows */}
                    {isExpanded && !isEditing && g.tiers.map(t => {
                      const rev = t.our_credits * CREDIT_VALUE;
                      const margin = calcMargin(t.api_cost_usd, t.our_credits);
                      return (
                        <tr key={t.id} className={`border-b border-border/5 bg-muted/[0.02] ${!t.is_active ? 'opacity-40' : ''}`}>
                          <td className="px-3 py-2 pl-10 text-[11px] text-muted-foreground"></td>
                          <td className="px-2 py-2 text-[11px] text-muted-foreground"></td>
                          <td className="px-2 py-2 text-center"></td>
                          <td className="px-2 py-2 text-center text-[11px] font-mono">${Number(t.api_cost_usd).toFixed(2)}</td>
                          <td className="px-2 py-2 text-center text-[11px]">{t.duration_seconds}s</td>
                          <td className="px-2 py-2 text-center text-[11px]">{t.resolution}</td>
                          <td className="px-2 py-2 text-center text-[11px]">
                            {t.audio_enabled ? (
                              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">On</Badge>
                            ) : (
                              <span className="text-muted-foreground/40">Off</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center text-[11px] font-semibold">{t.our_credits}</td>
                          <td className="px-2 py-2 text-center text-[11px] text-emerald-400">${rev.toFixed(4)}</td>
                          <td className="px-2 py-2 text-center">
                            <span className={`text-[11px] font-semibold ${marginColor(margin)} ${marginBg(margin)}`}>{margin.toFixed(0)}%</span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {t.is_active ? (
                              <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[8px] bg-muted/20 text-muted-foreground border-border/20">Off</Badge>
                            )}
                          </td>
                          <td></td>
                        </tr>
                      );
                    })}

                    {/* Edit panel */}
                    {isEditing && editStep === 'edit' && (
                      <tr className="border-b border-amber-500/20 bg-amber-500/[0.03]">
                        <td colSpan={12} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">Editing: {g.model.display_name}</p>
                              <button onClick={cancelEdit} className="p-1 rounded hover:bg-muted/20"><X size={14} /></button>
                            </div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/10">
                                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-medium">Duration</th>
                                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-medium">Resolution</th>
                                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-medium">Audio</th>
                                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-medium">API Cost ($)</th>
                                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-medium">Our Credits</th>
                                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-medium">Revenue</th>
                                  <th className="text-left py-1.5 text-[10px] text-muted-foreground font-medium">Margin</th>
                                  <th className="text-center py-1.5 text-[10px] text-muted-foreground font-medium">Active</th>
                                  <th className="text-center py-1.5 text-[10px] text-muted-foreground font-medium">Available</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.tiers.map(t => {
                                  const ev = editValues[t.id] || { api_cost_usd: t.api_cost_usd, our_credits: t.our_credits, is_active: t.is_active, is_available: t.is_available };
                                  const rev = (ev.our_credits || 0) * CREDIT_VALUE;
                                  const margin = calcMargin(ev.api_cost_usd || 0, ev.our_credits || 0);
                                  const isLow = margin < 30;
                                  const isLosing = rev < (ev.api_cost_usd || 0);
                                  return (
                                    <tr key={t.id} className="border-b border-border/5">
                                      <td className="py-2 text-[11px] font-semibold">{t.duration_seconds}s</td>
                                      <td className="py-2 text-[11px]">{t.resolution}</td>
                                      <td className="py-2 text-[11px]">
                                        {t.audio_enabled ? (
                                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">On</Badge>
                                        ) : <span className="text-muted-foreground/50">Off</span>}
                                      </td>
                                      <td className="py-2">
                                        <Input
                                          type="number" step="0.01" className="h-7 w-24 text-[11px]"
                                          value={ev.api_cost_usd}
                                          onChange={e => setEditValues(p => ({ ...p, [t.id]: { ...p[t.id], api_cost_usd: Number(e.target.value) } }))}
                                        />
                                      </td>
                                      <td className="py-2">
                                        <Input
                                          type="number" min={1} max={9999} className="h-7 w-20 text-[11px]"
                                          value={ev.our_credits}
                                          onChange={e => setEditValues(p => ({ ...p, [t.id]: { ...p[t.id], our_credits: Math.max(1, Number(e.target.value)) } }))}
                                        />
                                      </td>
                                      <td className="py-2 text-[11px] text-emerald-400">${rev.toFixed(4)}</td>
                                      <td className="py-2">
                                        <span className={`text-[12px] font-semibold ${marginColor(margin)}`}>{margin.toFixed(0)}%</span>
                                        {isLow && <span className="ml-1.5 text-red-400 text-[10px]">⚠ Low</span>}
                                        {isLosing && <span className="ml-1.5 text-red-400 text-[10px]">⚠ Loss</span>}
                                      </td>
                                      <td className="py-2 text-center">
                                        <Switch checked={ev.is_active !== false} onCheckedChange={v => setEditValues(p => ({ ...p, [t.id]: { ...p[t.id], is_active: v } }))} className="scale-75" />
                                      </td>
                                      <td className="py-2 text-center">
                                        <Switch checked={ev.is_available !== false} onCheckedChange={v => setEditValues(p => ({ ...p, [t.id]: { ...p[t.id], is_available: v } }))} className="scale-75" />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-[11px]">Cancel</Button>
                              <Button size="sm" className="text-[11px] gap-1.5" disabled={!hasChanges} onClick={() => setEditStep('review')}>
                                Review Changes <ChevronRight size={12} />
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {isEditing && editStep === 'review' && (
                      <tr className="border-b border-amber-500/20 bg-amber-500/[0.03]">
                        <td colSpan={12} className="p-4">
                          <div className="space-y-4">
                            <p className="text-sm font-semibold">Review Changes — {g.model.display_name}</p>
                            <div className="space-y-1.5">
                              {g.tiers.map(t => {
                                const ev = editValues[t.id];
                                if (!ev) return null;
                                const changed = ev.api_cost_usd !== t.api_cost_usd || ev.our_credits !== t.our_credits || ev.is_active !== t.is_active || ev.is_available !== t.is_available;
                                if (!changed) return null;
                                return (
                                  <div key={t.id} className="flex items-center gap-2 text-[11px]">
                                    <Badge variant="outline" className="text-[9px]">{t.duration_seconds}s · {t.resolution}{t.audio_enabled ? ' · 🔊' : ''}</Badge>
                                    {ev.api_cost_usd !== t.api_cost_usd && (
                                      <span>Cost: <span className="text-red-400 line-through">${Number(t.api_cost_usd).toFixed(2)}</span> → <span className="text-emerald-400 font-semibold">${Number(ev.api_cost_usd!).toFixed(2)}</span></span>
                                    )}
                                    {ev.our_credits !== t.our_credits && (
                                      <span>Credits: <span className="text-red-400 line-through">{t.our_credits}</span> → <span className="text-emerald-400 font-semibold">{ev.our_credits}</span></span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 flex items-start gap-2">
                              <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-[10px] text-amber-300">This change affects ALL future video generations. Already-started generations use old pricing.</p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setEditStep('edit')} className="text-[11px] gap-1">
                                <ChevronLeft size={12} />Back to Edit
                              </Button>
                              <Button size="sm" className="text-[11px] gap-1.5 bg-emerald-600 hover:bg-emerald-500" onClick={saveChanges}>
                                <Save size={12} />Save Changes
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary bar */}
      <div className="rounded-xl border border-border/10 bg-card/30 p-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Active models: <strong className="text-foreground">{activeModels}</strong></span>
        <span>Total tiers: <strong className="text-foreground">{totalTiers}</strong></span>
        <span>Avg margin: <strong className={marginColor(avgMargin)}>{avgMargin.toFixed(0)}%</strong></span>
        <span>Revenue per 1,000 credits: <strong className="text-foreground">${(1000 * CREDIT_VALUE).toFixed(2)}</strong></span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN COMPONENT — with Image/Video toggle
// ═══════════════════════════════════════════
export default function PricingMatrixPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'image';

  const [models, setModels] = useState<ModelRow[]>([]);
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editStep, setEditStep] = useState<'edit' | 'review'>('edit');
  const [editValues, setEditValues] = useState<Record<string, { cost: number; credits: number }>>({});
  const [editActive, setEditActive] = useState<Record<string, boolean>>({});
  const [editAvailable, setEditAvailable] = useState<Record<string, boolean>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, { cost: number; credits: number }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [mRes, tRes] = await Promise.all([
      supabase.from('models').select('id, model_name, endpoint_id, provider_name, is_active, pricing_mode'),
      supabase.from('model_pricing_tiers').select('id, model_id, quality_level, cost_per_run, credits_charged, is_active, is_available, is_default, tier_label, pricing_mode, resolution_label, actual_pixels'),
    ]);
    setModels((mRes.data as any[]) || []);
    setTiers((tRes.data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (tab === 'image') load(); }, [load, tab]);

  const matrix: MatrixRow[] = useMemo(() => {
    return models
      .map(m => {
        const mTiers = tiers.filter(t => t.model_id === m.id);
        const tierMap: MatrixRow['tiers'] = {};
        for (const t of mTiers) {
          if (t.quality_level === '1K') tierMap['1K'] = t;
          else if (t.quality_level === '2K') tierMap['2K'] = t;
          else if (t.quality_level === '4K') tierMap['4K'] = t;
        }
        return { model: m, tiers: tierMap, category: getCategory(m.endpoint_id) };
      })
      .filter(r => {
        if (filter === 'all') return true;
        if (filter === 'active') return r.model.is_active;
        if (filter === 'inactive') return !r.model.is_active;
        if (filter === 'image_gen') return r.category.includes('Image Gen');
        if (filter === 'tools') return !r.category.includes('Image Gen');
        if (filter === 'low_margin') {
          const t1k = r.tiers['1K'];
          return t1k && calcMargin(t1k.cost_per_run, t1k.credits_charged) < 50;
        }
        if (filter === 'high_margin') {
          const t1k = r.tiers['1K'];
          return t1k && calcMargin(t1k.cost_per_run, t1k.credits_charged) > 70;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.model.is_active !== b.model.is_active) return a.model.is_active ? -1 : 1;
        return a.model.model_name.localeCompare(b.model.model_name);
      });
  }, [models, tiers, filter]);

  const startEdit = (modelId: string) => {
    const mTiers = tiers.filter(t => t.model_id === modelId);
    const vals: Record<string, { cost: number; credits: number }> = {};
    const orig: Record<string, { cost: number; credits: number }> = {};
    const active: Record<string, boolean> = {};
    const avail: Record<string, boolean> = {};
    for (const t of mTiers) {
      const key = t.quality_level || t.id;
      vals[key] = { cost: t.cost_per_run, credits: t.credits_charged };
      orig[key] = { cost: t.cost_per_run, credits: t.credits_charged };
      active[key] = t.is_active;
      avail[key] = t.is_available !== false;
    }
    setEditValues(vals);
    setOriginalValues(orig);
    setEditActive(active);
    setEditAvailable(avail);
    setEditingModelId(modelId);
    setEditStep('edit');
  };

  const cancelEdit = () => {
    setEditingModelId(null);
    setEditStep('edit');
  };

  const hasChanges = useMemo(() => {
    for (const key of Object.keys(editValues)) {
      const o = originalValues[key];
      const n = editValues[key];
      if (!o || o.cost !== n.cost || o.credits !== n.credits) return true;
    }
    return false;
  }, [editValues, originalValues]);

  const changedFields = useMemo(() => {
    const changes: Array<{ tier: string; field: string; old: number; new_: number }> = [];
    for (const key of Object.keys(editValues)) {
      const o = originalValues[key];
      const n = editValues[key];
      if (!o) continue;
      if (o.cost !== n.cost) changes.push({ tier: key, field: 'Cost', old: o.cost, new_: n.cost });
      if (o.credits !== n.credits) changes.push({ tier: key, field: 'Credits', old: o.credits, new_: n.credits });
    }
    return changes;
  }, [editValues, originalValues]);

  const saveChanges = async () => {
    if (!editingModelId) return;
    const mTiers = tiers.filter(t => t.model_id === editingModelId);
    try {
      for (const t of mTiers) {
        const key = t.quality_level || t.id;
        const val = editValues[key];
        if (!val) continue;
        const act = editActive[key];
        const avail = editAvailable[key];
        if (val.cost !== t.cost_per_run || val.credits !== t.credits_charged || act !== t.is_active || avail !== (t.is_available !== false)) {
          await supabase.from('model_pricing_tiers').update({
            cost_per_run: val.cost,
            credits_charged: val.credits,
            is_active: act,
            is_available: avail,
            updated_at: new Date().toISOString(),
          } as any).eq('id', t.id);
          await supabase.from('admin_audit_log').insert({
            action: 'pricing_update',
            entity_type: 'model_pricing_tier',
            entity_id: t.id,
            old_value: { cost: t.cost_per_run, credits: t.credits_charged, is_active: t.is_active, is_available: t.is_available },
            new_value: { cost: val.cost, credits: val.credits, is_active: act, is_available: avail },
          } as any);
        }
      }
      toast({ title: 'Pricing updated', description: `${models.find(m => m.id === editingModelId)?.model_name} pricing saved. Changes live immediately.` });
      cancelEdit();
      await load();
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    }
  };

  const exportCSV = () => {
    const rows = ['Model,Provider,Category,1K Cost,1K Credits,1K Margin,2K Cost,2K Credits,2K Margin,4K Cost,4K Credits,4K Margin,Active'];
    for (const r of matrix) {
      const line = [
        r.model.model_name, r.model.provider_name, r.category,
        ...(r.tiers['1K'] ? [r.tiers['1K'].cost_per_run, r.tiers['1K'].credits_charged, calcMargin(r.tiers['1K'].cost_per_run, r.tiers['1K'].credits_charged).toFixed(0) + '%'] : ['', '', '']),
        ...(r.tiers['2K'] ? [r.tiers['2K'].cost_per_run, r.tiers['2K'].credits_charged, calcMargin(r.tiers['2K'].cost_per_run, r.tiers['2K'].credits_charged).toFixed(0) + '%'] : ['', '', '']),
        ...(r.tiers['4K'] ? [r.tiers['4K'].cost_per_run, r.tiers['4K'].credits_charged, calcMargin(r.tiers['4K'].cost_per_run, r.tiers['4K'].credits_charged).toFixed(0) + '%'] : ['', '', '']),
        r.model.is_active ? 'Yes' : 'No',
      ].join(',');
      rows.push(line);
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pricing-matrix.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const activeModelsCount = matrix.filter(r => r.model.is_active).length;
  const allMargins = matrix.filter(r => r.tiers['1K']).map(r => calcMargin(r.tiers['1K']!.cost_per_run, r.tiers['1K']!.credits_charged));
  const avgMargin = allMargins.length > 0 ? allMargins.reduce((a, b) => a + b, 0) / allMargins.length : 0;
  const highestMargin = matrix.reduce((best, r) => {
    const m1k = r.tiers['1K'] ? calcMargin(r.tiers['1K'].cost_per_run, r.tiers['1K'].credits_charged) : 0;
    return m1k > best.margin ? { name: r.model.model_name, margin: m1k } : best;
  }, { name: '', margin: 0 });
  const lowestMargin = matrix.reduce((worst, r) => {
    const m1k = r.tiers['1K'] ? calcMargin(r.tiers['1K'].cost_per_run, r.tiers['1K'].credits_charged) : 100;
    return m1k < worst.margin ? { name: r.model.model_name, margin: m1k } : worst;
  }, { name: '', margin: 100 });

  const editModel = editingModelId ? models.find(m => m.id === editingModelId) : null;

  return (
    <div className="space-y-4">
      {/* ── Image / Video Toggle ── */}
      <div className="flex items-center gap-1 rounded-lg border border-border/20 bg-muted/10 p-1 w-fit">
        <button
          onClick={() => setSearchParams({ tab: 'image' })}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-all ${tab === 'image' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Image size={14} />Image Models
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'video' })}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-all ${tab === 'video' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Film size={14} />Video Models
        </button>
      </div>

      {/* ── Video tab ── */}
      {tab === 'video' && <VideoPricingTable />}

      {/* ── Image tab (existing) ── */}
      {tab === 'image' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Loading pricing matrix…</div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Pricing Matrix</h2>
                  <p className="text-[11px] text-muted-foreground">{matrix.length} models · 1 credit = ${CREDIT_VALUE}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="h-8 w-[160px] text-[11px]"><Filter size={12} className="mr-1.5" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                      <SelectItem value="image_gen">Image Gen</SelectItem>
                      <SelectItem value="tools">Tools Only</SelectItem>
                      <SelectItem value="low_margin">Low Margin (&lt;50%)</SelectItem>
                      <SelectItem value="high_margin">High Margin (&gt;70%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={exportCSV}>
                    <Download size={12} />CSV
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={load}>
                    <RefreshCw size={12} />Refresh
                  </Button>
                </div>
              </div>

              {/* Info banner */}
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex items-center gap-2">
                <Info size={13} className="text-blue-400 flex-shrink-0" />
                <span className="text-[11px] text-blue-300">Click the edit icon on any row to modify pricing. Changes require review before saving.</span>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-border/20 bg-card/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/20">
                        <th className="text-left px-3 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold" colSpan={3}>Model</th>
                        <th className="text-center px-2 py-2.5 text-[10px] uppercase text-blue-400 bg-blue-500/5 font-semibold border-l border-border/10" colSpan={3}>1K</th>
                        <th className="text-center px-2 py-2.5 text-[10px] uppercase text-purple-400 bg-purple-500/5 font-semibold border-l border-border/10" colSpan={3}>2K</th>
                        <th className="text-center px-2 py-2.5 text-[10px] uppercase text-amber-400 bg-amber-500/5 font-semibold border-l border-border/10" colSpan={3}>4K</th>
                        <th className="text-center px-2 py-2.5 text-[10px] uppercase text-muted-foreground bg-muted/5 font-semibold border-l border-border/10" colSpan={2}>Status</th>
                      </tr>
                      <tr className="border-b border-border/10 bg-muted/3">
                        <th className="text-left px-3 py-1.5 text-[9px] text-muted-foreground font-medium">Name</th>
                        <th className="text-left px-2 py-1.5 text-[9px] text-muted-foreground font-medium">Provider</th>
                        <th className="text-left px-2 py-1.5 text-[9px] text-muted-foreground font-medium">Category</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-blue-400/60 font-medium border-l border-border/10">Cost</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-blue-400/60 font-medium">Cr</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-blue-400/60 font-medium">%</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-purple-400/60 font-medium border-l border-border/10">Cost</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-purple-400/60 font-medium">Cr</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-purple-400/60 font-medium">%</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-amber-400/60 font-medium border-l border-border/10">Cost</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-amber-400/60 font-medium">Cr</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-amber-400/60 font-medium">%</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-muted-foreground font-medium border-l border-border/10">Active</th>
                        <th className="text-center px-2 py-1.5 text-[9px] text-muted-foreground font-medium w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map(r => {
                        const isEditing = editingModelId === r.model.id;
                        const renderTierCells = (tier: TierRow | undefined) => {
                          if (!tier || !tier.is_active) {
                            return (
                              <>
                                <td className="px-2 py-2.5 text-center text-muted-foreground/30 text-[11px] border-l border-border/10">—</td>
                                <td className="px-2 py-2.5 text-center text-muted-foreground/30 text-[11px]">—</td>
                                <td className="px-2 py-2.5 text-center text-muted-foreground/30 text-[11px]">—</td>
                              </>
                            );
                          }
                          const margin = calcMargin(tier.cost_per_run, tier.credits_charged);
                          return (
                            <>
                              <td className="px-2 py-2.5 text-[11px] text-center font-mono border-l border-border/10">${tier.cost_per_run.toFixed(3)}</td>
                              <td className="px-2 py-2.5 text-[11px] text-center font-semibold">{tier.credits_charged}</td>
                              <td className={`px-2 py-2.5 text-[11px] text-center font-semibold ${marginColor(margin)} ${marginBg(margin)}`}>{margin.toFixed(0)}%</td>
                            </>
                          );
                        };

                        return (
                          <React.Fragment key={r.model.id}>
                            <tr
                              className={`border-b border-border/5 transition-colors group ${!r.model.is_active ? 'opacity-40' : 'hover:bg-muted/5'} ${isEditing ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''}`}
                            >
                              <td className="px-3 py-2.5">
                                <p className="text-[12px] font-semibold text-foreground">{r.model.model_name}</p>
                                <p className="text-[9px] text-muted-foreground/50 font-mono truncate max-w-[140px]">{r.model.endpoint_id}</p>
                              </td>
                              <td className="px-2 py-2.5 text-[11px] text-muted-foreground">{r.model.provider_name}</td>
                              <td className="px-2 py-2.5">
                                <Badge variant="outline" className="text-[9px]">{r.category}</Badge>
                              </td>
                              {renderTierCells(r.tiers['1K'])}
                              {renderTierCells(r.tiers['2K'])}
                              {renderTierCells(r.tiers['4K'])}
                              <td className="px-2 py-2.5 text-center border-l border-border/10">
                                {r.model.is_active ? (
                                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] bg-muted/20 text-muted-foreground border-border/20">Inactive</Badge>
                                )}
                              </td>
                              <td className="px-1 py-2.5 text-center">
                                <button
                                  onClick={() => startEdit(r.model.id)}
                                  className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-muted/20 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Pencil size={12} />
                                </button>
                              </td>
                            </tr>
                            {/* Edit panel */}
                            {isEditing && editStep === 'edit' && (
                              <tr className="border-b border-amber-500/20 bg-amber-500/[0.03]">
                                <td colSpan={14} className="p-4">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold">Editing: {editModel?.model_name}</p>
                                      <button onClick={cancelEdit} className="p-1 rounded hover:bg-muted/20"><X size={14} /></button>
                                    </div>
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-border/10">
                                          <th className="text-left py-1.5 text-[10px] text-muted-foreground">Resolution</th>
                                          <th className="text-left py-1.5 text-[10px] text-muted-foreground">API Cost ($)</th>
                                          <th className="text-left py-1.5 text-[10px] text-muted-foreground">Credits</th>
                                          <th className="text-left py-1.5 text-[10px] text-muted-foreground">Revenue</th>
                                          <th className="text-left py-1.5 text-[10px] text-muted-foreground">Margin</th>
                                          <th className="text-center py-1.5 text-[10px] text-muted-foreground">Active</th>
                                          <th className="text-center py-1.5 text-[10px] text-muted-foreground">Available</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {['1K', '2K', '4K'].map(q => {
                                          const tier = tiers.find(t => t.model_id === editingModelId && t.quality_level === q);
                                          if (!tier) return (
                                            <tr key={q} className="opacity-30">
                                              <td className="py-2">{q}</td>
                                              <td colSpan={6} className="py-2 text-muted-foreground">No tier configured</td>
                                            </tr>
                                          );
                                          const val = editValues[q] || { cost: tier.cost_per_run, credits: tier.credits_charged };
                                          const margin = calcMargin(val.cost, val.credits);
                                          const revenue = val.credits * CREDIT_VALUE;
                                          const isLow = margin < 30;
                                          const isLosing = revenue < val.cost;
                                          return (
                                            <tr key={q} className="border-b border-border/5">
                                              <td className="py-2 font-semibold">{tier.resolution_label || q}</td>
                                              <td className="py-2">
                                                <Input type="number" step="0.001" className="h-7 w-24 text-[11px]" value={val.cost}
                                                  onChange={e => setEditValues(p => ({ ...p, [q]: { ...p[q], cost: Number(e.target.value) } }))} />
                                              </td>
                                              <td className="py-2">
                                                <Input type="number" min={1} max={999} className="h-7 w-16 text-[11px]" value={val.credits}
                                                  onChange={e => setEditValues(p => ({ ...p, [q]: { ...p[q], credits: Math.max(1, Math.min(999, Number(e.target.value))) } }))} />
                                              </td>
                                              <td className="py-2 text-[11px] text-emerald-400">${revenue.toFixed(4)}</td>
                                              <td className="py-2">
                                                <span className={`text-[12px] font-semibold ${marginColor(margin)}`}>{margin.toFixed(0)}%</span>
                                                {isLow && <span className="ml-1.5 text-red-400 text-[10px]">⚠ Low</span>}
                                                {isLosing && <span className="ml-1.5 text-red-400 text-[10px]">⚠ Loss</span>}
                                              </td>
                                              <td className="py-2 text-center">
                                                <Switch checked={editActive[q] !== false} onCheckedChange={v => setEditActive(p => ({ ...p, [q]: v }))} className="scale-75" />
                                              </td>
                                              <td className="py-2 text-center">
                                                <Switch checked={editAvailable[q] !== false} onCheckedChange={v => setEditAvailable(p => ({ ...p, [q]: v }))} className="scale-75" />
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                    <div className="flex items-center justify-end gap-2">
                                      <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-[11px]">Cancel</Button>
                                      <Button size="sm" className="text-[11px] gap-1.5" disabled={!hasChanges} onClick={() => setEditStep('review')}>
                                        Review Changes <ChevronRight size={12} />
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                            {isEditing && editStep === 'review' && (
                              <tr className="border-b border-amber-500/20 bg-amber-500/[0.03]">
                                <td colSpan={14} className="p-4">
                                  <div className="space-y-4">
                                    <p className="text-sm font-semibold">Review Changes — {editModel?.model_name}</p>
                                    {changedFields.length === 0 ? (
                                      <p className="text-[11px] text-muted-foreground">No changes detected.</p>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {changedFields.map((c, i) => (
                                          <div key={i} className="flex items-center gap-2 text-[11px]">
                                            <Badge variant="outline" className="text-[9px]">{c.tier}</Badge>
                                            <span className="text-muted-foreground">{c.field}:</span>
                                            <span className="text-red-400 line-through">{c.field === 'Cost' ? `$${c.old.toFixed(3)}` : c.old}</span>
                                            <span>→</span>
                                            <span className="text-emerald-400 font-semibold">{c.field === 'Cost' ? `$${c.new_.toFixed(3)}` : c.new_}</span>
                                            {c.field === 'Credits' && (
                                              <span className="text-muted-foreground/50">
                                                ({calcMargin(editValues[c.tier]?.cost || 0, c.old).toFixed(0)}% → {calcMargin(editValues[c.tier]?.cost || 0, c.new_).toFixed(0)}%)
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 flex items-start gap-2">
                                      <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                      <p className="text-[10px] text-amber-300">This change affects ALL future generations. Already-started generations use old pricing.</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => setEditStep('edit')} className="text-[11px] gap-1">
                                        <ChevronLeft size={12} />Back to Edit
                                      </Button>
                                      <Button size="sm" className="text-[11px] gap-1.5 bg-emerald-600 hover:bg-emerald-500" onClick={saveChanges}>
                                        <Save size={12} />Save Changes
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary bar */}
              <div className="rounded-xl border border-border/10 bg-card/30 p-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Active models: <strong className="text-foreground">{activeModelsCount}</strong></span>
                <span>Avg margin: <strong className={marginColor(avgMargin)}>{avgMargin.toFixed(0)}%</strong></span>
                <span>Highest: <strong className="text-emerald-400">{highestMargin.name} ({highestMargin.margin.toFixed(0)}%)</strong></span>
                <span>Lowest: <strong className="text-red-400">{lowestMargin.name} ({lowestMargin.margin.toFixed(0)}%)</strong></span>
                <span>Revenue per 1,000 credits: <strong className="text-foreground">${(1000 * CREDIT_VALUE).toFixed(2)}</strong></span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
