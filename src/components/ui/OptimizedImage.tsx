import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'src'> {
  src?: string | null | undefined;
  alt: string;
  loading?: 'lazy' | 'eager';
  fit?: 'cover' | 'contain';
  thumbnailSrc?: string | null | undefined;
  fallback?: React.ReactNode;
  containerClassName?: string;
}

function DefaultFallback(): React.JSX.Element {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="w-8 h-8 rounded-lg bg-gray-200" />
    </div>
  );
}

interface ImageLoaderProps
  extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    'onError' | 'src' | 'alt' | 'loading' | 'className'
  > {
  resolvedSrc: string;
  alt: string;
  loading: 'lazy' | 'eager';
  fit?: 'cover' | 'contain' | undefined;
  containerClassName?: string | undefined;
  className?: string | undefined;
  fallback?: React.ReactNode | undefined;
}

function ImageLoader({
  resolvedSrc,
  alt,
  loading,
  fit,
  containerClassName,
  className,
  fallback,
  ...imgProps
}: ImageLoaderProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        {fallback ?? <DefaultFallback />}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}

      <img
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        className={cn(
          'w-full h-full',
          fit === 'cover' && 'object-cover',
          fit === 'contain' && 'object-contain',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          'transition-opacity duration-200',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...imgProps}
      />
    </div>
  );
}

/**
 * Optimized image with loading placeholder and error fallback
 */
export default function OptimizedImage({
  src,
  alt,
  loading = 'lazy',
  fit,
  thumbnailSrc,
  fallback,
  containerClassName,
  className,
  ...imgProps
}: OptimizedImageProps): React.JSX.Element {
  const resolvedSrc = thumbnailSrc || src;

  if (!resolvedSrc) {
    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        {fallback ?? <DefaultFallback />}
      </div>
    );
  }

  return (
    <ImageLoader
      key={resolvedSrc}
      resolvedSrc={resolvedSrc}
      alt={alt}
      loading={loading}
      fit={fit}
      containerClassName={containerClassName}
      className={className}
      fallback={fallback}
      {...imgProps}
    />
  );
}

export { OptimizedImage };
export type { OptimizedImageProps };
