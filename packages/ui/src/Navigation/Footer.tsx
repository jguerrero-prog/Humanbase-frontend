import { useEffect, useRef, type RefObject } from 'react';
import { Accordion, AccordionItem } from '../Accordion/Accordion';
import { Button } from '../Button/Button';
import { Logo } from '../Logo/Logo';
import { TextInput } from '../TextInput/TextInput';
import type { NavLink } from './types';
import './Navigation.css';
import { useLinkHref } from '../hooks/useLinkHref';

export interface FooterGroup {
  heading: string;
  links: readonly NavLink[];
}

export interface FooterProps {
  description: string;
  groups: readonly FooterGroup[];
  legal: string;
  dataVersion: string;
  mailingListAction?: string;
  onDisplaySettings?: () => void;
}

const mailingListId = 'mailing-list';
/** Links to the footer's sign-up; following one moves focus into its email field. */
export const mailingListHref = `#${mailingListId}`;

function useFocusFromLinks(field: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    if (window.location.hash === mailingListHref) field.current?.focus();
    const focusField = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (link?.hash === mailingListHref && link.pathname === window.location.pathname) field.current?.focus();
    };
    document.addEventListener('click', focusField);
    return () => document.removeEventListener('click', focusField);
  }, [field]);
}

function LinkList({ links }: { links: readonly NavLink[] }) {
  const linkHref = useLinkHref();
  return (
    <ul className="footer-links">
      {links.map((link) => (
        <li key={link.href}>
          <a href={linkHref(link.href)}>{link.label}</a>
        </li>
      ))}
    </ul>
  );
}

export function Footer({ description, groups, legal, dataVersion, mailingListAction = '/subscribe', onDisplaySettings }: FooterProps) {
  const email = useRef<HTMLInputElement>(null);
  useFocusFromLinks(email);
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-about">
            <Logo />
            <p>{description}</p>
            <form className="footer-mailing-list" action={mailingListAction} method="post">
              <TextInput ref={email} id={mailingListId} label="Release notes by email" type="email" name="email" autoComplete="email" placeholder="Email address" size="small" />
              <Button type="submit" variant="secondary" size="small">
                Subscribe
              </Button>
            </form>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <div className="footer-groups">
              {groups.map((group) => (
                <section key={group.heading}>
                  <h2>{group.heading}</h2>
                  <LinkList links={group.links} />
                </section>
              ))}
            </div>
            <Accordion size="compact" className="footer-accordion">
              {groups.map((group) => (
                <AccordionItem key={group.heading} title={group.heading} headingLevel={2}>
                  <LinkList links={group.links} />
                </AccordionItem>
              ))}
            </Accordion>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>{legal}</p>
          <p>{dataVersion}</p>
          <button type="button" className="footer-settings" onClick={onDisplaySettings}>
            Display settings
          </button>
        </div>
      </div>
    </footer>
  );
}
