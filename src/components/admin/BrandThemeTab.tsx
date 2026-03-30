import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, RotateCcw, Save, Sparkles, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTheme, DEFAULT_THEME, type ThemeColors } from '@/context/ThemeProvider';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ── Presets ──
const PRESETS: Record<string, { label: string; colors: ThemeColors }> = {
  ember: {
    label: 'Ember Dark',
    colors: { ...DEFAULT_THEME },
  },
  midnight: {
    label: 'Midnight Blue',
    colors: {
      'cta-primary': '#2563EB', 'cta-primary-hover': '#1D4ED8', 'cta-primary-text': '#FFFFFF',
      'cta-secondary': '#1E293B', 'cta-secondary-hover': '#334155', 'cta-secondary-text': '#F8FAFC',
      accent: '#2563EB', 'accent-muted': 'rgba(37,99,235,0.12)', 'accent-border': 'rgba(37,99,235,0.4)',
      'nav-active': '#2563EB', 'nav-active-bg': 'rgba(37,99,235,0.08)',
      'sidebar-bg': '#0F172A', 'panel-bg': '#1E293B', 'card-bg': '#1E293B', border: 'rgba(255,255,255,0.08)',
      'text-primary': '#F8FAFC', 'text-secondary': '#64748B', 'text-muted': '#475569',
    },
  },
  forest: {
    label: 'Forest Studio',
    colors: {
      'cta-primary': '#16A34A', 'cta-primary-hover': '#15803D', 'cta-primary-text': '#FFFFFF',
      'cta-secondary': '#14532D', 'cta-secondary-hover': '#166534', 'cta-secondary-text': '#F0FDF4',
      accent: '#16A34A', 'accent-muted': 'rgba(22,163,74,0.12)', 'accent-border': 'rgba(22,163,74,0.4)',
      'nav-active': '#16A34A', 'nav-active-bg': 'rgba(22,163,74,0.08)',
      'sidebar-bg': '#052E16', 'panel-bg': '#14532D', 'card-bg': '#166534', border: 'rgba(255,255,255,0.08)',
      'text-primary': '#F0FDF4', 'text-secondary': '#86EFAC', 'text-muted': '#4ADE80',
    },
  },
  pure: {
    label: 'Pure Black',
    colors: {
      'cta-primary': '#FFFFFF', 'cta-primary-hover': '#E5E5E5', 'cta-primary-text': '#000000',
      'cta-secondary': '#111111', 'cta-secondary-hover': '#1A1A1A', 'cta-secondary-text': '#FFFFFF',
      accent: '#FFFFFF', 'accent-muted': 'rgba(255,255,255,0.08)', 'accent-border': 'rgba(255,255,255,0.2)',
      'nav-active': '#FFFFFF', 'nav-active-bg': 'rgba(255,255,255,0.06)',
      'sidebar-bg': '#000000', 'panel-bg': '#0A0A0A', 'card-bg': '#111111', border: 'rgba(255,255,255,0.08)',
      'text-primary': '#FFFFFF', 'text-secondary': '#555555', 'text-muted': '#333333',
    },
  },
  sand: {
    label: 'Warm Sand',
    colors: {
      'cta-primary': '#B45309', 'cta-primary-hover': '#92400E', 'cta-primary-text': '#FFFFFF',
      'cta-secondary': '#292524', 'cta-secondary-hover': '#44403C', 'cta-secondary-text': '#FAFAF9',
      accent: '#B45309', 'accent-muted': 'rgba(180,83,9,0.12)', 'accent-border': 'rgba(180,83,9,0.4)',
      'nav-active': '#B45309', 'nav-active-bg': 'rgba(180,83,9,0.08)',
      'sidebar-bg': '#1C1917', 'panel-bg': '#292524', 'card-bg': '#44403C', border: '#57534E',
      'text-primary': '#FAFAF9', 'text-secondary': '#A8A29E', 'text-muted': '#78716C',
    },
  },
};

const COLOR_GROUPS = [
  {
    title: 'Primary CTA',
    desc: 'Controls all main action buttons — Generate, Sign Up, Buy Credits, etc.',
    keys: [
      { key: 'cta-primary' as keyof ThemeColors, label: 'Primary fill' },
      { key: 'cta-primary-hover' as keyof ThemeColors, label: 'Hover state' },
      { key: 'cta-primary-text' as keyof ThemeColors, label: 'Text on CTA' },
    ],
  },
  {
    title: 'Secondary Buttons',
    desc: 'Outlined and ghost buttons — Download, Regenerate, Cancel, etc.',
    keys: [
      { key: 'cta-secondary' as keyof ThemeColors, label: 'Secondary fill' },
      { key: 'cta-secondary-hover' as keyof ThemeColors, label: 'Secondary hover' },
      { key: 'cta-secondary-text' as keyof ThemeColors, label: 'Secondary text' },
    ],
  },
  {
    title: 'Accent & Highlights',
    desc: 'Active states, selected items, badges, tags, borders on focus.',
    keys: [
      { key: 'accent' as keyof ThemeColors, label: 'Accent color' },
      { key: 'accent-muted' as keyof ThemeColors, label: 'Accent muted bg' },
      { key: 'accent-border' as keyof ThemeColors, label: 'Accent border' },
    ],
  },
  {
    title: 'Navigation',
    desc: 'Sidebar active item color and background highlight.',
    keys: [
      { key: 'nav-active' as keyof ThemeColors, label: 'Active nav color' },
      { key: 'nav-active-bg' as keyof ThemeColors, label: 'Active nav bg' },
    ],
  },
  {
    title: 'Surfaces',
    desc: 'Background colors for panels, cards, and inputs.',
    keys: [
      { key: 'sidebar-bg' as keyof ThemeColors, label: 'Sidebar bg' },
      { key: 'panel-bg' as keyof ThemeColors, label: 'Panel bg' },
      { key: 'card-bg' as keyof ThemeColors, label: 'Card bg' },
      { key: 'border' as keyof ThemeColors, label: 'Border color' },
    ],
  },
  {
    title: 'Typography',
    desc: 'Text colors across the entire app.',
    keys: [
      { key: 'text-primary' as keyof ThemeColors, label: 'Primary text' },
      { key: 'text-secondary' as keyof ThemeColors, label: 'Secondary text' },
      { key: 'text-muted' as keyof ThemeColors, label: 'Muted text' },
    ],
  },
];

// Reverse map: css key -> db key
const CSS_TO_DB: Record<string, string> = {};
const DB_KEYS: Record<string, string> = {
  'cta-primary': 'theme_cta_primary',
  'cta-primary-hover': 'theme_cta_primary_hover',
  'cta-primary-text': 'theme_cta_primary_text',
  'cta-secondary': 'theme_cta_secondary',
  'cta-secondary-hover': 'theme_cta_secondary_hover',
  'cta-secondary-text': 'theme_cta_secondary_text',
  accent: 'theme_accent',
  'accent-muted': 'theme_accent_muted',
  'accent-border': 'theme_accent_border',
  'nav-active': 'theme_nav_active',
  'nav-active-bg': 'theme_nav_active_bg',
  'sidebar-bg': 'theme_sidebar_bg',
  'panel-bg': 'theme_panel_bg',
  'card-bg': 'theme_card_bg',
  border: 'theme_border',
  'text-primary': 'theme_text_primary',
  'text-secondary': 'theme_text_secondary',
  'text-muted': 'theme_text_muted',
};

function ColorSwatch({ color, label, onChange }: { color: string; label: string; onChange: (v: string) => void }) {
  const isRgba = color.startsWith('rgba');
  const displayColor = color;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <label className="relative cursor-pointer">
        <div
          className="w-8 h-8 rounded-full border-2 border-border/60 shadow-sm"
          style={{ backgroundColor: displayColor }}
        />
        {!isRgba && (
          <input
            type="color"
            value={color}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
      </label>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-muted-foreground">{label}</p>
      </div>
      <Input
        value={color}
        onChange={e => onChange(e.target.value)}
        className="h-7 w-32 text-[11px] font-mono bg-muted/30"
      />
    </div>
  );
}

export default function BrandThemeTab() {
  const { colors: liveColors, setColors: setLiveColors, applyToDOM } = useTheme();
  const [draft, setDraft] = useState<ThemeColors>({ ...liveColors });
  const [savedColors, setSavedColors] = useState<ThemeColors>({ ...liveColors });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    setDraft({ ...liveColors });
    setSavedColors({ ...liveColors });
  }, []);

  const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
    setDraft(prev => {
      const next = { ...prev, [key]: value };
      applyToDOM(next); // live preview
      setDirty(true);
      return next;
    });
  }, [applyToDOM]);

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setDraft({ ...preset.colors });
    applyToDOM(preset.colors);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const oldColors = { ...savedColors };
      // Upsert each theme value
      for (const [cssKey, value] of Object.entries(draft)) {
        const dbKey = DB_KEYS[cssKey];
        if (!dbKey) continue;
        await (supabase as any)
          .from('platform_config')
          .update({ config_value: value, updated_at: new Date().toISOString() })
          .eq('config_key', dbKey);
      }

      // Log to audit
      await supabase.from('admin_audit_log').insert({
        action: 'theme_update',
        entity_type: 'platform_config',
        entity_id: 'theme',
        old_value: oldColors as any,
        new_value: draft as any,
      });

      setLiveColors(draft);
      setSavedColors({ ...draft });
      setDirty(false);
      toast.success('Theme saved. Changes are live across the entire app.');
    } catch (e: any) {
      toast.error('Failed to save theme: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft({ ...savedColors });
    applyToDOM(savedColors);
    setDirty(false);
  };

  const handleReset = () => {
    if (!confirm('Reset all colors to default? This cannot be undone.')) return;
    setDraft({ ...DEFAULT_THEME });
    applyToDOM(DEFAULT_THEME);
    setDirty(true);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('action', 'theme_update')
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory(data || []);
    setHistoryOpen(true);
  };

  const restoreFromHistory = (entry: any) => {
    if (entry.new_value) {
      const restored = { ...DEFAULT_THEME, ...entry.new_value } as ThemeColors;
      setDraft(restored);
      applyToDOM(restored);
      setDirty(true);
      setHistoryOpen(false);
      toast.info('Theme restored from history. Click Save to apply.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className="text-xs gap-2 h-8"
            onClick={() => applyPreset(key)}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors['cta-primary'] }} />
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left: Color Editors */}
        <div className="space-y-4">
          {COLOR_GROUPS.map(group => (
            <Card key={group.title} className="border-border/40 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette size={14} /> {group.title}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">{group.desc}</p>
              </CardHeader>
              <CardContent className="space-y-0 pt-0">
                {group.keys.map(({ key, label }) => (
                  <ColorSwatch
                    key={key}
                    color={draft[key]}
                    label={label}
                    onChange={v => updateColor(key, v)}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <Card className="border-border/40 bg-card/50 sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles size={14} /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: draft.border }}>
                {/* Sidebar preview */}
                <div className="p-3 space-y-1.5" style={{ backgroundColor: draft['sidebar-bg'] }}>
                  <div className="flex items-center gap-2 px-2 py-1 rounded text-[12px] font-medium"
                    style={{ backgroundColor: draft['nav-active-bg'], color: draft['nav-active'] }}>
                    ● Studio
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 text-[12px]"
                    style={{ color: draft['text-secondary'] }}>
                    ○ Gallery
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 text-[12px]"
                    style={{ color: draft['text-secondary'] }}>
                    ○ Credits
                  </div>
                </div>

                {/* Panel preview */}
                <div className="p-3 space-y-3" style={{ backgroundColor: draft['panel-bg'] }}>
                  <div className="rounded border px-3 py-2 text-[11px]"
                    style={{ borderColor: draft.border, color: draft['text-muted'], backgroundColor: draft['card-bg'] }}>
                    Prompt textarea...
                  </div>

                  <button className="w-full rounded-md px-3 py-2 text-[12px] font-medium transition-colors"
                    style={{ backgroundColor: draft['cta-primary'], color: draft['cta-primary-text'] }}>
                    Generate · 2 credits
                  </button>

                  <button className="w-full rounded-md px-3 py-2 text-[12px] font-medium border transition-colors"
                    style={{ backgroundColor: draft['cta-secondary'], color: draft['cta-secondary-text'], borderColor: draft.border }}>
                    Download
                  </button>

                  <div className="rounded p-2.5" style={{ backgroundColor: draft['card-bg'] }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: draft['text-primary'] }}>Flux Schnell</span>
                      <Badge className="text-[9px] h-4" style={{ backgroundColor: draft['accent-muted'], color: draft.accent, border: 'none' }}>Fast</Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[12px] font-medium" style={{ color: draft['text-primary'] }}>Heading</p>
                    <p className="text-[11px]" style={{ color: draft['text-secondary'] }}>Subtitle text</p>
                    <p className="text-[10px]" style={{ color: draft['text-muted'] }}>Hint / muted text</p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                Changes are previewed live but not saved until you click Save Theme.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/40 -mx-6 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleReset}>
            <RotateCcw size={12} /> Reset to Default
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={loadHistory}>
            <History size={12} /> View History
          </Button>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleDiscard}>
              Discard Changes
            </Button>
          )}
          <Button size="sm" className="text-xs gap-1.5" onClick={handleSave} disabled={!dirty || saving}>
            <Save size={12} /> {saving ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-sm">Theme Change History</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No theme changes recorded yet.</p>}
            {history.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/20">
                <div>
                  <p className="text-[12px] font-medium">{new Date(entry.created_at).toLocaleString()}</p>
                  <div className="flex gap-1 mt-1">
                    {entry.new_value && Object.entries(entry.new_value).slice(0, 4).map(([k, v]: any) => (
                      <div key={k} className="w-4 h-4 rounded-full border border-border/40" style={{ backgroundColor: v }} />
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => restoreFromHistory(entry)}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
