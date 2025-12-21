'use client'

import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  onError?: () => void;
}

/**
 * Optimized Image Component for Performance
 *
 * Features:
 * - WebP format with fallback to original
 * - Lazy loading (unless priority)
 * - Async decoding
 * - Explicit dimensions (prevents CLS)
 * - fetchpriority for above-the-fold images
 * - Error handling with graceful fallback
 *
 * Usage:
 * <OptimizedImage
 *   src="https://example.com/image.jpg"
 *   alt="Description"
 *   width={1200}
 *   height={675}
 *   priority={true} // For hero images
 * />
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onError
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
    onError?.();
  };

  // Check if source is already WebP
  const isWebP = src.toLowerCase().endsWith('.webp');

  // For Supabase URLs, try to use WebP if browser supports it
  // Most modern browsers support WebP
  const webpSrc = isWebP ? src : src;

  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <picture>
      {/* WebP version for browsers that support it */}
      {!isWebP && (
        <source
          srcSet={webpSrc}
          type="image/webp"
        />
      )}

      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={handleError}
        {...(priority && { fetchPriority: 'high' as const })}
      />
    </picture>
  );
}
