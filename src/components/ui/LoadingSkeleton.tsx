interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  className?: string;
}

export function LoadingSkeleton({ count = 1, height = 'h-32', className = '' }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-xl bg-neutral-800 animate-pulse ${height} ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export default LoadingSkeleton;
