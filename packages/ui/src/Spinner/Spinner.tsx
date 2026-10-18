import './Spinner.css';

interface SpinnerProps {
  size: 14 | 16 | 20;
}

export function Spinner({ size }: SpinnerProps) {
  return (
    <svg className="spinner" viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path d="M8 1.12a6.88 6.88 0 1 1-6.88 6.88" />
    </svg>
  );
}
