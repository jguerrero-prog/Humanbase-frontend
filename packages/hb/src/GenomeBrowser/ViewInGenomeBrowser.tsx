import { useLinkHref, type ButtonVariant } from '@humanbase/ui';
import { GenomeBrowserLink } from '../content/genomeBrowser';

export interface ViewInGenomeBrowserProps {
  /** From GenomeBrowserLink; nothing renders while the preview is off. */
  href: string | undefined;
  /** Drawn as a button of this kind; left out, a plain link, as in a table row. */
  variant?: ButtonVariant | undefined;
  /** Read after the label by screen readers, where several links share it, such as "for IL1B". */
  context?: string | undefined;
}

export function ViewInGenomeBrowser({ href, variant, context }: ViewInGenomeBrowserProps) {
  const linkHref = useLinkHref();
  if (!href) return null;
  return (
    <a className={variant && `button button-${variant} button-medium`} href={linkHref(href)}>
      {GenomeBrowserLink.label}
      {context && <span className="visually-hidden"> {context}</span>}
    </a>
  );
}
