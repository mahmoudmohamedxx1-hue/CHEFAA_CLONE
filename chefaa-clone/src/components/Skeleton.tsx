import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  circle = false 
}) => {
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1rem',
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${
        circle ? 'rounded-full' : 'rounded'
      } ${className}`}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <Skeleton height="200px" className="mb-3" />
      <Skeleton width="60%" className="mb-2" />
      <Skeleton width="100%" height="3rem" className="mb-2" />
      <Skeleton width="40%" className="mb-3" />
      <Skeleton height="2.5rem" />
    </div>
  );
};

export const ProductListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const CategoryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
      <Skeleton circle width="64px" height="64px" className="mx-auto mb-3" />
      <Skeleton width="80%" className="mx-auto" />
    </div>
  );
};

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Image Skeleton */}
          <div>
            <Skeleton height="400px" className="rounded-lg" />
          </div>

          {/* Details Skeleton */}
          <div>
            <Skeleton width="40%" height="1.5rem" className="mb-2" />
            <Skeleton width="80%" height="2rem" className="mb-4" />
            <Skeleton width="100%" height="4rem" className="mb-4" />
            <Skeleton width="30%" height="2rem" className="mb-6" />
            
            <div className="space-y-3">
              <Skeleton height="3rem" />
              <Skeleton height="3rem" />
            </div>
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="bg-white rounded-lg p-6">
          <Skeleton width="200px" height="1.5rem" className="mb-4" />
          <Skeleton width="100%" height="1rem" className="mb-2" />
          <Skeleton width="100%" height="1rem" className="mb-2" />
          <Skeleton width="80%" height="1rem" />
        </div>
      </div>
    </div>
  );
};

export const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-base p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="200px" height="1.5rem" className="mb-2" />
          <Skeleton width="150px" height="1rem" />
        </div>
        <Skeleton width="100px" height="2rem" />
      </div>
      <Skeleton width="100%" height="3rem" className="mb-3" />
      <div className="flex gap-3">
        <Skeleton height="2.5rem" className="flex-1" />
        <Skeleton height="2.5rem" width="120px" />
      </div>
    </div>
  );
};

export const SearchResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton height="3rem" className="flex-1" />
        <Skeleton width="120px" height="3rem" />
      </div>
      <ProductListSkeleton count={12} />
    </div>
  );
};
