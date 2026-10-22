import { useEffect, type RefObject } from 'react';
import { useNavigate } from 'react-router';
import { appBase } from '../routes';

/** Opens plain links under a path, such as /docs/, through the router, so moving between those pages doesn't reload the app. */
export function useRouterLinks(container: RefObject<HTMLElement | null>, under: string): void {
  const navigate = useNavigate();
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      const path = url.pathname.startsWith(appBase) ? url.pathname.slice(appBase.length) : '';
      if (url.origin !== window.location.origin || !path.startsWith(under)) return;
      event.preventDefault();
      void navigate(path + url.hash);
    };
    element.addEventListener('click', onClick);
    return () => element.removeEventListener('click', onClick);
  }, [container, navigate, under]);
}
