import './Skeleton.css';

export interface SkeletonProps {
  width: string;
  height?: string;
}

export function Skeleton({ width, height = '12px' }: SkeletonProps) {
  return <span className="skeleton" style={{ inlineSize: width, blockSize: height }} aria-hidden="true" />;
}
