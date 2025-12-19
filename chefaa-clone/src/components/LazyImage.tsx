import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  lowQualitySrc?: string;
}

/**
 * Lazy loading image component with progressive loading
 * Implements Intersection Observer for performance
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  threshold = 0.01,
  rootMargin = '50px',
  onLoad,
  onError,
  lowQualitySrc,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            // Disconnect after loading
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing
    if (imgRef.current && observerRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, threshold, rootMargin]);

  const loadImage = () => {
    // Load low quality image first if provided
    if (lowQualitySrc && !imageLoaded) {
      const lowQualityImg = new Image();
      lowQualityImg.src = lowQualitySrc;
      lowQualityImg.onload = () => {
        setImageSrc(lowQualitySrc);
      };
    }

    // Load full quality image
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setImageError(true);
      onError?.();
    };
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${imageLoaded ? 'loaded' : 'loading'} ${imageError ? 'error' : ''}`}
      style={{
        transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
        opacity: imageLoaded ? 1 : 0.6,
        filter: imageLoaded ? 'blur(0)' : 'blur(5px)',
      }}
      {...props}
    />
  );
};

/**
 * Background image lazy loader
 */
interface LazyBackgroundProps {
  src: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyBackground: React.FC<LazyBackgroundProps> = ({
  src,
  children,
  className = '',
  style = {},
  placeholder = 'linear-gradient(to right, #f0f0f0, #e0e0e0)',
  threshold = 0.01,
  rootMargin = '50px',
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string>(placeholder);
  const [loaded, setLoaded] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setBackgroundImage(`url(${src})`);
              setLoaded(true);
            };
            if (divRef.current) {
              observer.unobserve(divRef.current);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    if (divRef.current) {
      observer.observe(divRef.current);
    }

    return () => observer.disconnect();
  }, [src, threshold, rootMargin]);

  return (
    <div
      ref={divRef}
      className={`${className} ${loaded ? 'loaded' : 'loading'}`}
      style={{
        ...style,
        backgroundImage,
        transition: 'background-image 0.3s ease-in-out',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Picture element with responsive images and lazy loading
 */
interface ResponsiveLazyImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
  webpSrc?: string;
  threshold?: number;
  rootMargin?: string;
}

export const ResponsiveLazyImage: React.FC<ResponsiveLazyImageProps> = ({
  src,
  srcSet,
  sizes,
  alt,
  className = '',
  webpSrc,
  threshold = 0.01,
  rootMargin = '50px',
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const pictureRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            if (pictureRef.current) {
              observer.unobserve(pictureRef.current);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    if (pictureRef.current) {
      observer.observe(pictureRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  if (!shouldLoad) {
    return (
      <picture ref={pictureRef as any} className={className}>
        <img
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E"
          alt={alt}
          className={className}
        />
      </picture>
    );
  }

  return (
    <picture ref={pictureRef as any} className={className}>
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      {srcSet && <source srcSet={srcSet} sizes={sizes} />}
      <img src={src} alt={alt} className={className} loading="lazy" />
    </picture>
  );
};
