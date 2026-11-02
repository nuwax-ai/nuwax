import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { useState, type ReactNode } from 'react';

export default function HomeIcon({
  src,
  className,
  fallback = null,
}: {
  src?: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const { displaySrc } = useAuthProtectedImageSrc(src);
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!displaySrc || displaySrc === failedSrc) return fallback;
  return (
    <img
      src={displaySrc}
      className={className}
      alt=""
      aria-hidden="true"
      onError={() => setFailedSrc(displaySrc)}
    />
  );
}
