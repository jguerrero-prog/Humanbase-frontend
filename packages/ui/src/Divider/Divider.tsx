import './Divider.css';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  /** Horizontal separates sections and is announced; vertical separates controls in a row and is decorative. */
  orientation?: DividerOrientation;
  className?: string | undefined;
}

/** A 1px border.subtle rule. Space around it comes from the layout it sits in. */
export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  const classes = ['divider', `divider-${orientation}`, className].filter(Boolean).join(' ');
  return orientation === 'vertical' ? <span className={classes} aria-hidden="true" /> : <hr className={classes} />;
}
