/**
 * Image Optimization Utilities
 * Provides WebP conversion, lazy loading, and responsive images
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  lazy?: boolean;
  priority?: boolean;
}

/**
 * Generate optimized image URLs with multiple formats
 */
export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;

  // If it's already a placeholder or external CDN, return as-is
  if (src.includes('placehold.co') || src.includes('cdn.')) {
    return src;
  }

  // Build query parameters for image optimization
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality) params.append('q', quality.toString());
  if (format) params.append('f', format);

  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(src: string, widths: number[] = [320, 640, 1024, 1920]): string {
  return widths
    .map((width) => {
      const optimized = getOptimizedImageUrl(src, { width, format: 'webp' });
      return `${optimized} ${width}w`;
    })
    .join(', ');
}

/**
 * Get appropriate sizes attribute for responsive images
 */
export function getImageSizes(breakpoints: Record<string, string> = {}): string {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    ...breakpoints,
  };

  const sizes = Object.entries(defaultBreakpoints)
    .map(([media, size]) => `${media} ${size}`)
    .join(', ');

  return `${sizes}, 33vw`;
}

/**
 * Optimized Image Component
 */
import React, { useState, useEffect } from 'react';
import { useImagePreload, useIntersectionObserver } from '../hooks/usePerformance';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: string;
  widths?: number[];
}

export function OptimizedImage({
  src,
  alt,
  priority = false,
  aspectRatio,
  widths,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(priority ? src : '');
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.01,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (priority || isVisible) {
      setImageSrc(src);
    }
  }, [src, priority, isVisible]);

  const srcSet = widths ? generateSrcSet(src, widths) : undefined;
  const sizes = widths ? getImageSizes() : undefined;

  return (
    <div ref={ref as any} className={`relative overflow-hidden ${className}`}>
      {aspectRatio && (
        <div style={{ paddingBottom: `${(1 / parseFloat(aspectRatio)) * 100}%` }} />
      )}
      {imageSrc && (
        <img
          src={getOptimizedImageUrl(imageSrc, { quality: 85, format: 'webp' })}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={aspectRatio ? 'absolute inset-0 w-full h-full object-cover' : ''}
          {...props}
        />
      )}
      {!imageSrc && (
        <div
          className={`${
            aspectRatio ? 'absolute inset-0' : 'w-full h-full'
          } bg-gray-200 animate-pulse`}
        />
      )}
    </div>
  );
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = getOptimizedImageUrl(src, { format: 'webp' });
  link.fetchPriority = priority;
  document.head.appendChild(link);
}

/**
 * Batch preload multiple images
 */
export function batchPreloadImages(images: string[], priority: 'high' | 'low' = 'low') {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      images.forEach((src) => preloadImage(src, priority));
    });
  } else {
    images.forEach((src) => preloadImage(src, priority));
  }
}

/**
 * Clear image cache
 */
export function clearImageCache() {
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes('image')) {
          caches.delete(name);
        }
      });
    });
  }
}
