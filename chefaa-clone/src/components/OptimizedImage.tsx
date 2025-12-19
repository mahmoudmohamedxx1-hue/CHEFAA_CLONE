import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  priority = false 
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    skip: priority, // Skip lazy loading for priority images
  });

  // Convert image path to WebP if available
  const getWebPPath = (path: string) => {
    if (!path) return path;
    
    // Only convert if it's a local image
    if (path.startsWith('/images/') || path.startsWith('images/')) {
      const pathParts = path.split('.');
      if (pathParts.length > 1) {
        const extension = pathParts[pathParts.length - 1].toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(extension)) {
          pathParts[pathParts.length - 1] = 'webp';
          return pathParts.join('.');
        }
      }
    }
    return path;
  };

  useEffect(() => {
    if (priority || inView) {
      const webpSrc = getWebPPath(src);
      const img = new Image();
      
      // Try WebP first
      img.src = webpSrc;
      img.onload = () => {
        setImageSrc(webpSrc);
        setImageLoading(false);
      };
      
      // Fallback to original if WebP fails
      img.onerror = () => {
        const fallbackImg = new Image();
        fallbackImg.src = src;
        fallbackImg.onload = () => {
          setImageSrc(src);
          setImageLoading(false);
        };
        fallbackImg.onerror = () => {
          setImageSrc(src); // Use original even if it fails
          setImageLoading(false);
        };
      };
    }
  }, [src, inView, priority]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      )}
      {imageSrc && (
        <picture>
          <source srcSet={getWebPPath(src)} type="image/webp" />
          <img
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            } ${className}`}
            loading={priority ? 'eager' : 'lazy'}
          />
        </picture>
      )}
    </div>
  );
}
