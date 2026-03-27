import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import type { PricingTier } from '@/hooks/usePricingTiers';

interface Props {
  modelId: string;
  modelName: string;
  tiers: PricingTier[];
  creditValueUsd: number;
  onAdd: (tier: Omit<PricingTier, 'id'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<PricingTier>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRICING_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  per_megapixel: { label: 'Per MP', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  flat_per_image: { label: 'Flat', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  quality_tier: { label: 'Quality', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  size_locked: { label: 'Locked', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  manual_pending: { label: 'Manual', color: 'bg-muted/30 text-muted-foreground border-border/20' },
};

export function PricingMatrixCard({ modelId, modelName, tiers, creditValueUsd, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [newTier, setNewTier] = useState({ label: '', quality: '', resolution: '', cost: 0, credits: 2, pricingMode: 'flat_per_image' });

  const handleAdd = async () => {
    await onAdd({
      model_id: modelId,
      tier_label: newTier.label || `${newTier.quality} Native`,
      quality_level: newTier.quality || null,
      resolution_key: newTier.resolution || null,
      aspect_ratio: null,
      width: null, height: null, megapixels: null,
      cost_per_run: newTier.cost,
      credits_charged: newTier.credits,
      pricing_mode: newTier.pricingMode,
      is_default: tiers.length === 0,
      notes: null,
    });
    setAdding(false);
    setNewTier({ label: '', quality: '', resolution: '', cost: 0, credits: 2, pricingMode: 'flat_per_image' });
  };

  return (
    <div className="rounded-xl border border-border/10 bg-card/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/10 flex items-center justify-between bg-muted/5">
        <div>
          <p className="text-sm font-semibold text-foreground">{modelName}</p>
          <p className="text-[10px] text-muted-foreground">Pricing tiers · {tiers.length} configured</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => setAdding(!adding)}>
          <Plus size={12} /> Add Tier
        </Button>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/10 bg-muted/5">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Tier</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Quality</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Pricing Type</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Provider Cost</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Credits</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Revenue</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Margin</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Margin %</th>
            <th className="px-3 py-2 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {tiers.map(t => {
            const revenue = t.credits_charged * creditValueUsd;
            const margin = revenue - t.cost_per_run;
            const marginPct = revenue > 0 ? (margin / revenue * 100) : 0;
            const typeInfo = PRICING_TYPE_LABELS[t.pricing_mode] || PRICING_TYPE_LABELS.flat_per_image;
            return (
              <tr key={t.id} className="border-b border-border/5 hover:bg-muted/5">
                <td className="px-3 py-2 font-medium text-foreground">
                  {t.tier_label}
                  {t.is_default && <Badge variant="outline" className="ml-1.5 text-[8px] py-0 px-1">Default</Badge>}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{t.quality_level || '-'}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className={`text-[9px] py-0 px-1.5 ${typeInfo.color}`}>
                    {typeInfo.label}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <Input type="number" step="0.001" className="w-20 h-6 text-[11px]" value={t.cost_per_run}
                    onChange={e => onUpdate(t.id, { cost_per_run: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-2">
                  <Input type="number" className="w-14 h-6 text-[11px]" value={t.credits_charged}
                    onChange={e => onUpdate(t.id, { credits_charged: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-2 text-emerald-400">${revenue.toFixed(4)}</td>
                <td className="px-3 py-2">
                  <span className={margin >= 0 ? 'text-emerald-400' : 'text-red-400'}>${margin.toFixed(4)}</span>
                </td>
                <td className="px-3 py-2">
                  <Badge variant={marginPct < 0 ? 'destructive' : marginPct < 20 ? 'secondary' : 'default'} className="text-[9px]">
                    {marginPct.toFixed(1)}%
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(t.id)}>
                    <Trash2 size={11} className="text-muted-foreground hover:text-destructive" />
                  </Button>
                </td>
              </tr>
            );
          })}
          {tiers.length === 0 && (
            <tr><td colSpan={9} className="text-center py-4 text-muted-foreground text-[11px]">No pricing tiers. Click "Add Tier" to configure.</td></tr>
          )}
          {adding && (
            <tr className="bg-primary/5">
              <td className="px-3 py-2"><Input className="h-6 text-[11px] w-24" placeholder="Label" value={newTier.label} onChange={e => setNewTier(p => ({ ...p, label: e.target.value }))} /></td>
              <td className="px-3 py-2"><Input className="h-6 text-[11px] w-14" placeholder="1K" value={newTier.quality} onChange={e => setNewTier(p => ({ ...p, quality: e.target.value }))} /></td>
              <td className="px-3 py-2">
                <select className="h-6 text-[10px] bg-background border border-border/20 rounded px-1" value={newTier.pricingMode} onChange={e => setNewTier(p => ({ ...p, pricingMode: e.target.value }))}>
                  <option value="flat_per_image">Flat</option>
                  <option value="per_megapixel">Per MP</option>
                  <option value="quality_tier">Quality</option>
                  <option value="size_locked">Locked</option>
                </select>
              </td>
              <td className="px-3 py-2"><Input type="number" step="0.001" className="h-6 text-[11px] w-20" value={newTier.cost} onChange={e => setNewTier(p => ({ ...p, cost: Number(e.target.value) }))} /></td>
              <td className="px-3 py-2"><Input type="number" className="h-6 text-[11px] w-14" value={newTier.credits} onChange={e => setNewTier(p => ({ ...p, credits: Number(e.target.value) }))} /></td>
              <td colSpan={3}></td>
              <td className="px-3 py-2"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAdd}><Save size={11} className="text-primary" /></Button></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
