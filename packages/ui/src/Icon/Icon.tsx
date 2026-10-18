import icons from './icons.json';

export type IconName = keyof typeof icons;
export type IconSize = 16 | 20 | 24;

interface IconDrawing {
  kind: 'interface' | 'science';
  paths: string[];
}

const strokeInPixels: Record<IconDrawing['kind'], Record<IconSize, number>> = {
  interface: { 16: 1.5, 20: 1.75, 24: 2 },
  science: { 16: 1.25, 20: 1.25, 24: 1.5 },
};

export const iconNames = Object.keys(icons) as IconName[];

interface IconProps {
  name: IconName;
  size?: IconSize;
  label?: string;
  className?: string;
}

export function Icon({ name, size = 24, label, className }: IconProps) {
  const drawing = icons[name] as IconDrawing;
  const strokeWidth = (strokeInPixels[drawing.kind][size] * 24) / size;

  return (
    <svg
      className={['icon', className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {drawing.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
