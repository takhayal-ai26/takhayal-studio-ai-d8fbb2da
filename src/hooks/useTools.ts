import { useToolsDB, ToolView } from '@/hooks/useToolsDB';
import { TOOLS as STATIC_TOOLS, type ToolDef } from '@/data/tools';

/**
 * Legacy compatibility hook — proxies to useToolsDB.
 * Maps DB-backed ToolView into the ToolDef shape expected by older components.
 */
export function useTools() {
  const { tools: dbTools, featuredTools: featuredViews, rawTools } = useToolsDB();

  // Map ToolView → ToolDef shape for backward compat
  const tools: ToolDef[] = dbTools.map(t => {
    const staticTool = STATIC_TOOLS.find(s => s.id === t.slug);
    return {
      id: t.slug,
      name: t.name,
      description: t.description,
      shortDesc: t.shortDesc,
      image: t.image || staticTool?.image || '',
      route: t.route,
      icon: t.icon,
      inputType: t.inputType === 'mixed' ? 'prompt' as const : t.inputType as 'prompt' | 'upload',
      heroTagline: t.heroTitle,
      creditCost: t.creditCost,
      options: staticTool?.options || [],
      examples: staticTool?.examples || [],
    };
  });

  const featuredToolIds = featuredViews.map(t => t.slug);

  return { tools, featuredTools: featuredToolIds, adminTools: rawTools };
}
