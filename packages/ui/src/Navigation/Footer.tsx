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
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-about">
            <Logo />
            <p>{description}</p>
            <form className="footer-mailing-list" action={mailingListAction} method="post">
              <TextInput label="Release notes by email" type="email" name="email" autoComplete="email" placeholder="Email address" size="small" />
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
