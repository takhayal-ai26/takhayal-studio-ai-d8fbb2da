/**
 * Image optimization helpers.
 *
 * Quality preservation rules:
 * - Never compress below quality 75 for photos
 * - Never resize above the display size
 * - Always keep the original URL available as fallback
 * - Full-size views (lightbox, model detail hero) use original URL
 * - Only thumbnails / card previews use optimized URLs
 */

/**
 * Returns a Supabase-transformed image URL with width + WebP format.
 * Non-Supabase URLs are returned unchanged.
 */
export function getOptimizedImageUrl(
  url: string,
  width: number,
  quality: number = 80
): string {
  if (!url) return url;
  // Only transform Supabase storage URLs
  if (!url.includes('supabase.co/storage')) return url;

  const safeQuality = Math.max(75, Math.min(100, quality));
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&quality=${safeQuality}&format=webp`;
}
