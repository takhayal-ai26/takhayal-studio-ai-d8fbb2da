import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Image as ImageIcon, Type, Eye } from 'lucide-react';
import { useHeroConfig } from '@/hooks/useHeroConfig';
import { toast } from 'sonner';

export default function AdminHomeHero() {
  const { config, loading, updateConfig } = useHeroConfig();
  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading) setForm(config); }, [config, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries: [string, string][] = [
        ['hero_enabled', String(form.hero_enabled)],
        ['hero_title_en', form.hero_title_en],
        ['hero_title_ar', form.hero_title_ar],
        ['hero_subtitle_en', form.hero_subtitle_en],
        ['hero_subtitle_ar', form.hero_subtitle_ar],
        ['hero_placeholder_en', form.hero_placeholder_en],
        ['hero_placeholder_ar', form.hero_placeholder_ar],
        ['hero_overlay_opacity', String(form.hero_overlay_opacity)],
        ['hero_text_align', form.hero_text_align],
        ['hero_background_image', form.hero_background_image],
      ];
      for (const [key, value] of entries) {
        await updateConfig(key, value);
      }
      toast.success('Hero settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Home Hero</h2>
          <p className="text-sm text-muted-foreground">Manage the hero section on the landing page</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Enabled</Label>
            <Switch checked={form.hero_enabled} onCheckedChange={v => setForm(f => ({ ...f, hero_enabled: v }))} />
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Background Image */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><ImageIcon size={14} /> Background Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={form.hero_background_image}
              onChange={e => setForm(f => ({ ...f, hero_background_image: e.target.value }))}
              placeholder="Image URL (e.g. https://...)"
              className="text-sm"
            />
            {form.hero_background_image && (
              <div className="rounded-lg overflow-hidden border border-border/40 aspect-video">
                <img src={form.hero_background_image} alt="Hero preview" className="w-full h-full object-cover" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Eye size={14} /> Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Overlay Opacity: {Math.round(form.hero_overlay_opacity * 100)}%</Label>
              <Slider
                value={[form.hero_overlay_opacity]}
                onValueChange={([v]) => setForm(f => ({ ...f, hero_overlay_opacity: v }))}
                min={0} max={1} step={0.05}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Text Alignment</Label>
              <Select value={form.hero_text_align} onValueChange={v => setForm(f => ({ ...f, hero_text_align: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* English Content */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Type size={14} /> English Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input value={form.hero_title_en} onChange={e => setForm(f => ({ ...f, hero_title_en: e.target.value }))} className="text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Subtitle</Label>
              <Input value={form.hero_subtitle_en} onChange={e => setForm(f => ({ ...f, hero_subtitle_en: e.target.value }))} className="text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Prompt Placeholder</Label>
              <Input value={form.hero_placeholder_en} onChange={e => setForm(f => ({ ...f, hero_placeholder_en: e.target.value }))} className="text-sm mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Arabic Content */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Type size={14} /> Arabic Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">العنوان</Label>
              <Input value={form.hero_title_ar} onChange={e => setForm(f => ({ ...f, hero_title_ar: e.target.value }))} className="text-sm mt-1" dir="rtl" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">العنوان الفرعي</Label>
              <Input value={form.hero_subtitle_ar} onChange={e => setForm(f => ({ ...f, hero_subtitle_ar: e.target.value }))} className="text-sm mt-1" dir="rtl" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">نص البحث</Label>
              <Input value={form.hero_placeholder_ar} onChange={e => setForm(f => ({ ...f, hero_placeholder_ar: e.target.value }))} className="text-sm mt-1" dir="rtl" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
