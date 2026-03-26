import { useAdminToolsStore, AdminTool } from '@/stores/adminToolsStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers, type LucideIcon } from 'lucide-react';
import { TOOLS as STATIC_TOOLS, type ToolDef } from '@/data/tools';
import { useAdminMediaStore } from '@/stores/adminMediaStore';

const iconLookup: Record<string, LucideIcon> = {
  Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers,
};

// Map tool IDs to media asset names for thumbnails
const toolMediaMap: Record<string, string> = {
  'generate': 'generate.jpg',
  'upscale': 'upscale.jpg',
  'logo': 'logo.jpg',
  'remove-bg': 'remove-bg.jpg',
  'enhance': 'enhance.jpg',
};

/**
 * Returns tools data merged from admin store, respecting active/featured state
 * and bilingual content based on current language.
 * Images are resolved from the Media Library store.
 */
export function useTools() {
  const { tools: adminTools } = useAdminToolsStore();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const mediaAssets = useAdminMediaStore(s => s.assets);

  const getMediaUrl = (name: string): string =>
    mediaAssets.find(a => a.name === name)?.url || '';

  // Merge admin data with static tool definitions (for options, examples)
  const tools: ToolDef[] = adminTools
    .filter(t => t.active)
    .map(adminTool => {
      const staticTool = STATIC_TOOLS.find(s => s.id === adminTool.id);
      const mediaImage = toolMediaMap[adminTool.id] ? getMediaUrl(toolMediaMap[adminTool.id]) : '';
      return {
        id: adminTool.id,
        name: isAr && adminTool.name.ar ? adminTool.name.ar : adminTool.name.en,
        description: isAr && adminTool.description.ar ? adminTool.description.ar : adminTool.description.en,
        shortDesc: isAr && adminTool.shortDesc.ar ? adminTool.shortDesc.ar : adminTool.shortDesc.en,
        heroTagline: isAr && adminTool.hero.title.ar ? adminTool.hero.title.ar : adminTool.hero.title.en,
        creditCost: adminTool.creditCost,
        inputType: adminTool.inputType === 'mixed' ? 'prompt' as const : adminTool.inputType,
        route: adminTool.route,
        icon: iconLookup[adminTool.iconName] || Sparkles,
        image: adminTool.coverImage || mediaImage || staticTool?.image || '',
        options: staticTool?.options || [],
        examples: staticTool?.examples || [],
      };
    });

  const featuredTools = adminTools
    .filter(t => t.active && t.featured)
    .map(t => t.id);

  return { tools, featuredTools, adminTools };
}
