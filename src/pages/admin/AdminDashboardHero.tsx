import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Save, Loader2, Upload } from 'lucide-react';

const KEYS = [
  'dashboard_home_hero_image',
  'dashboard_home_hero_focal_point',
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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `dashboard-hero-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('tool-covers').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('tool-covers').getPublicUrl(path);
    update('dashboard_home_hero_image', urlData.publicUrl);
    toast.success('Image uploaded');
    setUploading(false);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('platform_config').select('config_key, config_value').in('config_key', [...KEYS]);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.config_key] = r.config_value; });
      // Ensure focal point key exists if not in DB yet
      if (!map.dashboard_home_hero_focal_point) map.dashboard_home_hero_focal_point = '50 50';
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
          <div className="flex gap-2">
            <Input value={values.dashboard_home_hero_image || ''} onChange={e => update('dashboard_home_hero_image', e.target.value)} placeholder="https://..." className="flex-1" />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = ''; }} />
            <Button type="button" variant="outline" size="icon" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            </Button>
          </div>
          {values.dashboard_home_hero_image && (
            <img src={values.dashboard_home_hero_image} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover w-full" />
          )}
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
