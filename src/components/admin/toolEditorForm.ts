import type { ToolRecord } from '@/hooks/useToolsDB';
import type { ToolMediaType } from '@/lib/tool-routing';

export type ToolEditorValidation = {
  title: string;
  description: string;
  variant: 'destructive';
};

export function defaultRouteFor(mediaType: ToolMediaType, slug?: string) {
  const cleanSlug = slug?.trim();
  if (!cleanSlug) return mediaType === 'video' ? '/video/' : '/tools/';
  return mediaType === 'video' ? `/video/${cleanSlug}` : `/tools/${cleanSlug}`;
}

export function shouldRefreshRoute(route?: string) {
  const cleanRoute = route?.trim();
  if (!cleanRoute) return true;
  return /^\/(tools|video)\/?([^/]+)?\/?$/.test(cleanRoute);
}

export function applyToolMediaType(form: Partial<ToolRecord>, value: ToolMediaType): Partial<ToolRecord> {
  return {
    ...form,
    media_type: value,
    result_type: value === 'video' ? 'video' : (form.result_type === 'video' ? 'image' : form.result_type),
    tool_mode: value === 'video' ? 'video' : (form.tool_mode === 'video' ? 'standard' : form.tool_mode),
    input_type: value === 'video' ? 'prompt' : form.input_type,
    icon_name: value === 'video' && form.icon_name === 'Sparkles' ? 'Film' : form.icon_name,
    route: shouldRefreshRoute(form.route) ? defaultRouteFor(value, form.slug) : form.route,
    selected_model_id: value === 'video' ? null : form.selected_model_id,
    selected_video_model_id: value === 'image' ? null : form.selected_video_model_id,
  };
}

export function applyToolSlug(form: Partial<ToolRecord>, slug: string): Partial<ToolRecord> {
  return {
    ...form,
    slug,
    route: shouldRefreshRoute(form.route) ? defaultRouteFor((form.media_type || 'image') as ToolMediaType, slug) : form.route,
  };
}

export function validateToolFormBeforeSave(form: Partial<ToolRecord>): ToolEditorValidation | null {
  if (!form.title_en?.trim()) {
    return { title: 'Validation', description: 'English title is required', variant: 'destructive' };
  }
  if (!form.slug?.trim()) {
    return { title: 'Validation', description: 'Slug is required', variant: 'destructive' };
  }
  return null;
}

export function normalizeToolFormBeforeSave(form: Partial<ToolRecord>): Partial<ToolRecord> {
  const normalizedMediaType = (form.media_type || 'image') as ToolMediaType;
  const normalizedSlug = form.slug?.trim() || '';
  const trimmedRoute = form.route?.trim();

  return {
    ...form,
    slug: normalizedSlug,
    media_type: normalizedMediaType,
    result_type: normalizedMediaType === 'video' ? 'video' : (form.result_type || 'image'),
    tool_mode: normalizedMediaType === 'video' ? 'video' : (form.tool_mode || 'standard'),
    route: shouldRefreshRoute(trimmedRoute) ? defaultRouteFor(normalizedMediaType, normalizedSlug) : trimmedRoute,
    selected_model_id: normalizedMediaType === 'video' ? null : form.selected_model_id,
    selected_video_model_id: normalizedMediaType === 'image' ? null : form.selected_video_model_id,
  };
}
