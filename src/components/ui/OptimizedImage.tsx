import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  mobileSrc?: string;
  webpSrc?: string;
  mobileWebpSrc?: string;
  placeholderSrc?: string;
  width?: number;
  height?: number;
  lazyLoad?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  mobileSrc,
  webpSrc,
  mobileWebpSrc,
  placeholderSrc,
  width,
  height,
  lazyLoad = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  // Use intersection observer for lazy loading
  useEffect(() => {
    if (!lazyLoad) return;

    const imgEl = document.querySelector(
      `[data-src="${src}"]`,
    ) as HTMLImageElement;
    if (!imgEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement;
            if (target.dataset.src) {
              target.src = target.dataset.src;
              delete target.dataset.src;
            }
            observer.unobserve(target);
          }
        });
      },
      { rootMargin: '200px' },
    );

    observer.observe(imgEl);

    return () => {
      if (imgEl) observer.unobserve(imgEl);
    };
  }, [src, lazyLoad]);

  return (
    <picture>
      {/* WebP for mobile */}
      {mobileWebpSrc && (
        <source
          srcSet={lazyLoad ? undefined : mobileWebpSrc}
          data-srcset={lazyLoad ? mobileWebpSrc : undefined}
          media="(max-width: 768px)"
          type="image/webp"
        />
      )}

      {/* WebP for desktop */}
      {webpSrc && (
        <source
          srcSet={lazyLoad ? undefined : webpSrc}
          data-srcset={lazyLoad ? webpSrc : undefined}
          type="image/webp"
        />
      )}

      {/* JPEG/PNG for mobile */}
      {mobileSrc && (
        <source
          srcSet={lazyLoad ? undefined : mobileSrc}
          data-srcset={lazyLoad ? mobileSrc : undefined}
          media="(max-width: 768px)"
        />
      )}

      {/* Main image */}
      <img
        src={
          lazyLoad
            ? placeholderSrc ||
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'
            : src
        }
        data-src={lazyLoad ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={lazyLoad ? 'lazy' : 'eager'}
        onLoad={() => setLoaded(true)}
        className={cn(
          'transition-opacity duration-300',
          !loaded && lazyLoad ? 'opacity-0' : 'opacity-100',
          className,
        )}
        {...props}
      />
    </picture>
  );
}
