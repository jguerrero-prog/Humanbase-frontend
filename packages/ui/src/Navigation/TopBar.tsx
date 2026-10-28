import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Accordion, AccordionItem } from '../Accordion/Accordion';
import { Icon } from '../Icon/Icon';
import { activeJobCount, JobsMenu, type JobsMenuSummary } from '../Jobs/JobsMenu';
import { Logo } from '../Logo/Logo';
import { SearchField } from '../SearchField/SearchField';
import { NavLinkContent, sectionHasImages } from './NavLinkContent';
import { NavMenu } from './NavMenu';
import type { NavSection } from './types';
import './Navigation.css';
import { useLinkHref } from '../hooks/useLinkHref';

export interface TopBarProps {
  sections: readonly NavSection[];
  current?: string;
  jobs?: JobsMenuSummary;
  homeHref?: string;
  /** The search, such as gene search with its destinations; a plain field when left out. */
  searchField?: ReactNode;
  /** Leave the search out where the page has its own, such as the homepage hero. */
  search?: boolean;
  openSection?: string;
  menuOpen?: boolean;
  scrolled?: boolean;
  className?: string;
}

/** The top bar search's label and placeholder. */
export const topBarSearchLabel = 'Search genes';

function useScrolled(forced: boolean | undefined) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (forced !== undefined) return;
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [forced]);
  return forced ?? scrolled;
}

export function TopBar({ sections, current, jobs, homeHref = '/', searchField, search = true, openSection, menuOpen, scrolled, className }: TopBarProps) {
  const linkHref = useLinkHref();
  const [ownOpen, setOpen] = useState<string>();
  const open = openSection ?? ownOpen;
  const [phoneMenu, setPhoneMenu] = useState(menuOpen ?? false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (searchOpen) searchArea.current?.querySelector('input')?.focus();
  }, [searchOpen]);
  const isScrolled = useScrolled(scrolled);

  const running = jobs ? activeJobCount(jobs.jobs) : 0;

  return (
    <header className={['top-bar', className].filter(Boolean).join(' ')} data-scrolled={isScrolled || undefined}>
      <div className="top-bar-inner" data-search={searchOpen || undefined}>
        <a className="top-bar-home" href={linkHref(homeHref)}>
          <Logo surface="green" />
        </a>
        <nav className="top-bar-sections" aria-label="Main">
          {sections.map((section) => (
            <NavMenu
              key={section.label}
              section={section}
              current={section.label === current}
              open={open === section.label}
              onOpenChange={(next) => setOpen(next ? section.label : undefined)}
            />
          ))}
        </nav>
        {search && (
          <>
            <div ref={searchArea} className="top-bar-search" role="search">
              {searchField ?? <SearchField size="medium" label={topBarSearchLabel} placeholder={topBarSearchLabel} />}
            </div>
            <button type="button" className="top-bar-icon-button top-bar-search-button" aria-label="Search" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}>
              <Icon name={searchOpen ? 'x' : 'search'} size={20} />
            </button>
          </>
        )}
        {jobs && <JobsMenu {...jobs} />}
        <button type="button" className="top-bar-icon-button top-bar-menu-button" aria-label={phoneMenu ? 'Close' : 'Menu'} aria-expanded={phoneMenu} onClick={() => setPhoneMenu(!phoneMenu)}>
          <Icon name={phoneMenu ? 'x' : 'menu'} size={20} />
        </button>
      </div>
      {phoneMenu && (
        <nav className="phone-menu" aria-label="Main">
          <Accordion>
            {sections.map((section) =>
              section.columns ? (
                <AccordionItem key={section.label} title={section.label} summary={section.label === current ? 'Current' : undefined} defaultOpen={section.label === current}>
                  <ul className="phone-menu-links">
                    {section.columns.flat().flatMap((group) =>
                      group.links.map((link) => (
                        <li key={link.href}>
                          <a href={linkHref(link.href)} onClick={() => setPhoneMenu(false)}>
                            <NavLinkContent link={link} reserveImage={sectionHasImages(section)} />
                          </a>
                        </li>
                      )),
                    )}
                  </ul>
                </AccordionItem>
              ) : (
                <a key={section.label} className="phone-menu-row" href={linkHref(section.href)}>
                  {section.label}
                </a>
              ),
            )}
          </Accordion>
          {jobs && (
            <a className="top-bar-jobs" href={linkHref(jobs.allHref)}>
              Jobs{' '}
              {running > 0 && <span className="top-bar-jobs-count">{running} running</span>}
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
