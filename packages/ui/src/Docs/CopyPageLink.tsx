import { Icon } from '../Icon/Icon';
import { useCopy } from '../hooks/useCopy';

/** A badge that copies the address of the page it sits on, without any section anchor, so readers can send it on. */
export function CopyPageLink({ title }: { title: string }) {
  // Pages rendered ahead of time have no window; the badge only copies in the browser.
  const page = typeof window === 'undefined' ? '' : window.location.origin + window.location.pathname;
  const { copied, copy, status } = useCopy(page, `Link to ${title} copied`);
  return (
    <>
      <button type="button" className="docs-copy-link" data-copied={copied || undefined} onClick={() => void copy()}>
        <Icon name={copied ? 'check' : 'link'} size={14} />
        {copied ? 'Copied' : 'Copy link'}{' '}
        <span className="visually-hidden">to {title}</span>
      </button>
      {status}
    </>
  );
}
