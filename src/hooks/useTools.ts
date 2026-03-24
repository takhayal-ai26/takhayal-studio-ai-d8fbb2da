import { useAdminToolsStore, AdminTool } from '@/stores/adminToolsStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers, type LucideIcon } from 'lucide-react';
import { TOOLS as STATIC_TOOLS, type ToolDef } from '@/data/tools';

const iconLookup: Record<string, LucideIcon> = {
  Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers,
};

/**
 * Returns tools data merged from admin store, respecting active/featured state
 * and bilingual content based on current language.
 */
export function useTools() {
  const { tools: adminTools } = useAdminToolsStore();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Merge admin data with static tool definitions (for images, options, examples)
  const tools: ToolDef[] = adminTools
    .filter(t => t.active)
    .map(adminTool => {
      const staticTool = STATIC_TOOLS.find(s => s.id === adminTool.id);
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
        image: adminTool.coverImage || staticTool?.image || '',
        options: staticTool?.options || [],
        examples: staticTool?.examples || [],
      };
    });

  const featuredTools = adminTools
    .filter(t => t.active && t.featured)
    .map(t => t.id);

  return { tools, featuredTools, adminTools };
}
