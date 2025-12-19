// Skeleton loading components for better perceived performance

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="flex items-center gap-1 mt-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-24 mt-3"></div>
        <div className="h-10 bg-gray-200 rounded w-full mt-3"></div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg animate-pulse">
      <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(count)].map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded animate-pulse ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}

export function ImageSkeleton({ aspectRatio = '1:1', className = '' }: { aspectRatio?: string; className?: string }) {
  const ratioClass = aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '16:9' ? 'aspect-video' : '';
  
  return (
    <div className={`${ratioClass} bg-gray-200 rounded-lg animate-pulse ${className}`}></div>
  );
}
