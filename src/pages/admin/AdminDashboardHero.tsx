import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Save, Loader2, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const KEYS = [
  'video_hero_video_url',
  'video_hero_poster_url',
  'video_hero_headline1_en',
  'video_hero_headline2_en',
  'video_hero_subtitle_en',
  'video_hero_headline1_ar',
  'video_hero_headline2_ar',
  'video_hero_subtitle_ar',
  'video_hero_overlay_intensity',
  'video_hero_text_align',
  'video_hero_enabled',
  'video_hero_poster_enabled',
] as const;

export default function AdminDashboardHero() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = async (file: File, key: string, setUploading: (v: boolean) => void) => {
    setUploading(true);
    const ext = file.name.split('.').pop() || 'mp4';
    const path = `hero-${key}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('tool-covers').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('tool-covers').getPublicUrl(path);
    update(key, urlData.publicUrl);
    toast.success('Uploaded');
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, val] of Object.entries(values)) {
        const { data: updated } = await supabase.from('platform_config').update({ config_value: val }).eq('config_key', key).select('id');
        if (!updated || updated.length === 0) {
          await supabase.from('platform_config').insert({ config_key: key, config_value: val });
        }
      }
      toast.success('Hero settings saved');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  const overlayVal = parseFloat(values.video_hero_overlay_intensity || '0.40');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Video Hero</h3>
          <p className="text-sm text-muted-foreground">Full-screen cinematic video hero on the homepage</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Enabled</Label>
          <Switch checked={values.video_hero_enabled === 'true'} onCheckedChange={v => update('video_hero_enabled', v ? 'true' : 'false')} />
        </div>
      </div>

      {/* Media */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Media</h4>

        <div>
          <Label className="text-xs">Hero Video URL</Label>
          <div className="flex gap-2">
            <Input value={values.video_hero_video_url || ''} onChange={e => update('video_hero_video_url', e.target.value)} placeholder="https://..." className="flex-1" />
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'video_hero_video_url', setUploadingVideo); e.target.value = ''; }} />
            <Button type="button" variant="outline" size="icon" disabled={uploadingVideo} onClick={() => videoRef.current?.click()}>
              {uploadingVideo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            </Button>
          </div>
          {values.video_hero_video_url && (
            <video src={values.video_hero_video_url} className="mt-2 rounded-lg w-full max-h-48 object-cover" muted autoPlay loop playsInline />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-xs">Enable Poster Fallback</Label>
          <Switch checked={values.video_hero_poster_enabled === 'true'} onCheckedChange={v => update('video_hero_poster_enabled', v ? 'true' : 'false')} />
        </div>

        <div>
          <Label className="text-xs">Poster Image URL</Label>
          <div className="flex gap-2">
            <Input value={values.video_hero_poster_url || ''} onChange={e => update('video_hero_poster_url', e.target.value)} placeholder="https://..." className="flex-1" />
            <input ref={posterRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'video_hero_poster_url', setUploadingPoster); e.target.value = ''; }} />
            <Button type="button" variant="outline" size="icon" disabled={uploadingPoster} onClick={() => posterRef.current?.click()}>
              {uploadingPoster ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            </Button>
          </div>
        </div>
      </section>

      {/* English */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">English Content</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Headline Line 1</Label><Input value={values.video_hero_headline1_en || ''} onChange={e => update('video_hero_headline1_en', e.target.value)} /></div>
          <div><Label className="text-xs">Headline Line 2</Label><Input value={values.video_hero_headline2_en || ''} onChange={e => update('video_hero_headline2_en', e.target.value)} /></div>
        </div>
        <div><Label className="text-xs">Subtitle</Label><Input value={values.video_hero_subtitle_en || ''} onChange={e => update('video_hero_subtitle_en', e.target.value)} /></div>
      </section>

      {/* Arabic */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Arabic Content</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Headline Line 1</Label><Input value={values.video_hero_headline1_ar || ''} onChange={e => update('video_hero_headline1_ar', e.target.value)} dir="rtl" /></div>
          <div><Label className="text-xs">Headline Line 2</Label><Input value={values.video_hero_headline2_ar || ''} onChange={e => update('video_hero_headline2_ar', e.target.value)} dir="rtl" /></div>
        </div>
        <div><Label className="text-xs">Subtitle</Label><Input value={values.video_hero_subtitle_ar || ''} onChange={e => update('video_hero_subtitle_ar', e.target.value)} dir="rtl" /></div>
      </section>

      {/* Display Settings */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Display Settings</h4>
        <div>
          <Label className="text-xs">Overlay Intensity: {Math.round(overlayVal * 100)}%</Label>
          <Slider value={[overlayVal * 100]} onValueChange={v => update('video_hero_overlay_intensity', (v[0] / 100).toFixed(2))} min={0} max={80} step={5} className="mt-2" />
        </div>
        <div>
          <Label className="text-xs">Text Alignment</Label>
          <Select value={values.video_hero_text_align || 'center'} onValueChange={v => update('video_hero_text_align', v)}>
            <SelectTrigger className="w-40 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save Changes
      </Button>
    </div>
  );
}
