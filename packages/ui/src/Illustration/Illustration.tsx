import { illustrations, type IllustrationName } from './illustrations';

const files = import.meta.glob<string>('./art/*.svg', { eager: true, query: '?url', import: 'default' });

export interface IllustrationProps {
  name: IllustrationName;
  className?: string;
  loading?: 'eager' | 'lazy';
}

/** A decorative illustration from the Humanbase library, at its artboard size unless CSS scales it. */
export function Illustration({ name, className, loading = 'lazy' }: IllustrationProps) {
  const { width, height } = illustrations[name];
  return <img className={className} src={files[`./art/${name}.svg`]} alt="" width={width} height={height} loading={loading} decoding="async" data-illustration={name} />;
}
