import { describe, expect, it } from 'vitest';
import { filterToolsByMedia, getToolMediaType, getToolRoute } from './tool-routing';

describe('tool media routing', () => {
  const tools = [
    { slug: 'generate', mediaType: 'image', route: '/tools/generate' },
    { slug: 'product-video', mediaType: 'video', route: '/tools/product-video' },
    { slug: 'legacy-video', resultType: 'video', route: '/tools/legacy-video' },
  ];

  it('filters tools by image or video media type', () => {
    expect(filterToolsByMedia(tools, 'image').map(tool => tool.slug)).toEqual(['generate']);
    expect(filterToolsByMedia(tools, 'video').map(tool => tool.slug)).toEqual(['product-video', 'legacy-video']);
  });

  it('falls back to result type when media type is missing', () => {
    expect(getToolMediaType({ resultType: 'video' })).toBe('video');
    expect(getToolMediaType({ result_type: 'video' })).toBe('video');
    expect(getToolMediaType({ resultType: 'image' })).toBe('image');
  });

  it('routes video tools through the video tools flow', () => {
    expect(getToolRoute({ slug: 'product-video', mediaType: 'video', route: '/tools/product-video' })).toBe('/video/product-video');
    expect(getToolRoute({ slug: 'generate', mediaType: 'image', route: '/tools/generate' })).toBe('/tools/generate');
  });
});
