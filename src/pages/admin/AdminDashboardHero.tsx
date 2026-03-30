import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

const KEYS = [
  'dashboard_home_hero_image',
  'dashboard_home_title_en',
  'dashboard_home_title_ar',
  'dashboard_home_subtitle_en',
  'dashboard_home_subtitle_ar',
  'dashboard_home_prompt_placeholder_en',
  'dashboard_home_prompt_placeholder_ar',
  'dashboard_home_enabled',
  'dashboard_home_overlay_strength',
] as const;

export default function AdminDashboardHero() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('platform_config').select('config_key, config_value').in('config_key', [...KEYS]);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.config_key] = r.config_value; });
      setValues(map);
      setLoading(false);
    })();
  }, []);

  const update = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, val] of Object.entries(values)) {
        await supabase.from('platform_config').update({ config_value: val }).eq('config_key', key);
      }
      toast.success('Dashboard hero settings saved');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  const overlayVal = parseFloat(values.dashboard_home_overlay_strength || '0.55');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dashboard Home Hero</h3>
          <p className="text-sm text-muted-foreground">Controls the hero section on the authenticated /home page</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Enabled</Label>
          <Switch
            checked={values.dashboard_home_enabled === 'true'}
            onCheckedChange={v => update('dashboard_home_enabled', v ? 'true' : 'false')}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs">Hero Background Image URL</Label>
          <Input value={values.dashboard_home_hero_image || ''} onChange={e => update('dashboard_home_hero_image', e.target.value)} placeholder="https://..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Title (English)</Label>
            <Input value={values.dashboard_home_title_en || ''} onChange={e => update('dashboard_home_title_en', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Title (Arabic)</Label>
            <Input value={values.dashboard_home_title_ar || ''} onChange={e => update('dashboard_home_title_ar', e.target.value)} dir="rtl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Subtitle (English)</Label>
            <Input value={values.dashboard_home_subtitle_en || ''} onChange={e => update('dashboard_home_subtitle_en', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Subtitle (Arabic)</Label>
            <Input value={values.dashboard_home_subtitle_ar || ''} onChange={e => update('dashboard_home_subtitle_ar', e.target.value)} dir="rtl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Prompt Placeholder (English)</Label>
            <Input value={values.dashboard_home_prompt_placeholder_en || ''} onChange={e => update('dashboard_home_prompt_placeholder_en', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Prompt Placeholder (Arabic)</Label>
            <Input value={values.dashboard_home_prompt_placeholder_ar || ''} onChange={e => update('dashboard_home_prompt_placeholder_ar', e.target.value)} dir="rtl" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Overlay Strength: {Math.round(overlayVal * 100)}%</Label>
          <Slider
            value={[overlayVal * 100]}
            onValueChange={v => update('dashboard_home_overlay_strength', (v[0] / 100).toFixed(2))}
            min={0} max={100} step={5}
            className="mt-2"
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save Changes
      </Button>
    </div>
  );
}
