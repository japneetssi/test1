import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string; // Enforce alt tag
  fallbackText?: string;
  wrapperClassName?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  wrapperClassName,
  fallbackText,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden inline-flex items-center justify-center", wrapperClassName, className)}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 w-full h-full bg-slate-200 animate-pulse" />
      )}
      
      {hasError ? (
        <div className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500 font-medium">
          {fallbackText || (alt && alt.charAt(0).toUpperCase()) || "IMG"}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full transition-opacity duration-300 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}
