import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/display';

const SmartImage = ({ src, alt, className, imageClassName, fallbackText }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(!src);
  }, [src]);

  const initials = getInitials(fallbackText || alt || 'Zaykaa');

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!hasError ? (
        <>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={cn(
              'h-full w-full object-cover transition duration-700',
              isLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
              imageClassName
            )}
          />
          {!isLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 via-white to-slate-200 dark:from-white/5 dark:via-white/10 dark:to-white/5" />
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/90 via-orange-500 to-red-500 text-3xl font-semibold text-white">
          {initials}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
    </div>
  );
};

export default SmartImage;
