import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill';
  style?: React.CSSProperties;
}

/**
 * Reusable image with WebP-first <picture> wrapping and graceful fallback
 * to the original src on error. Always sets decoding="async" for off-main-thread
 * decoding. Use loading="eager" only for above-the-fold images.
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  objectFit = 'cover',
  style,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  // Generate WebP src if original is jpg/jpeg/png
  const webpSrc = src.match(/\.(jpg|jpeg|png)$/i)
    ? src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    : null;

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      setImgSrc(src);
    }
  };

  return (
    <picture>
      {webpSrc && !failed && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        onError={handleError}
        style={{
          objectFit,
          ...style,
        }}
      />
    </picture>
  );
}
