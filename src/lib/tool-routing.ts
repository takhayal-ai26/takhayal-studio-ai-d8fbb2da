export type ToolMediaType = 'image' | 'video';

type ToolRoutingInput = {
  slug?: string;
  route?: string;
  mediaType?: string | null;
  media_type?: string | null;
  resultType?: string | null;
  result_type?: string | null;
};

export function getToolMediaType(tool: ToolRoutingInput): ToolMediaType {
  const mediaType = tool.mediaType || tool.media_type;
  if (mediaType === 'video') return 'video';
  if (mediaType === 'image') return 'image';

  const resultType = tool.resultType || tool.result_type;
  return resultType === 'video' ? 'video' : 'image';
}

export function filterToolsByMedia<T extends ToolRoutingInput>(tools: T[], mediaType: ToolMediaType): T[] {
  return tools.filter(tool => getToolMediaType(tool) === mediaType);
}

export function getToolRoute(tool: ToolRoutingInput): string {
  const slug = tool.slug || '';
  if (getToolMediaType(tool) === 'video') return `/video/${slug}`;
  return tool.route || `/tools/${slug}`;
}
