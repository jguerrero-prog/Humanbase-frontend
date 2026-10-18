import { useState, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { ContextLabel, type ContextLabelProps } from '../ContextLabel/ContextLabel';
import { Drawer } from '../Drawer/Drawer';
import { useMediaQuery } from '../Layer/useMediaQuery';
import { Breadcrumbs, type Crumb } from '../Navigation/Breadcrumbs';
import { Tabs, type TabItem } from '../Tabs/Tabs';
import './Results.css';

export const STACKED_QUERY = '(width < 60rem)';

export interface ResultHeaderProps {
  crumbs: readonly Crumb[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  context?: readonly ContextLabelProps[];
  settings?: ReactNode;
  settingsLabel?: string;
  headingLevel?: 1 | 2 | 3;
  tabs?: readonly TabItem[];
  tabsLabel?: string;
  tab?: string;
  onTabChange?: (value: string) => void;
}

export function ResultHeader({ crumbs, title, subtitle, actions, context = [], settings, settingsLabel = 'Network settings', headingLevel = 1, tabs, tabsLabel, tab, onTabChange }: ResultHeaderProps) {
  const stacked = useMediaQuery(STACKED_QUERY);
  const [sheetOpen, setSheetOpen] = useState(false);
  const Heading = `h${headingLevel}` as const;

  return (
    <header className="result-header">
      <Breadcrumbs items={crumbs} compact={stacked} />
      <div className="result-header-row">
        <div className="result-header-title">
          <div className="result-header-name">
            <Heading className="result-header-heading">
              {title}
              {subtitle && <> <span className="result-header-subtitle">{subtitle}</span></>}
            </Heading>
            {actions && <div className="result-header-actions">{actions}</div>}
          </div>
          {context.length > 0 && (
            <ul className="result-header-context" aria-label="Settings behind this result">
              {context.map((label) => (
                <li key={label.name}>
                  <ContextLabel {...label} />
                </li>
              ))}
            </ul>
          )}
        </div>
        {settings &&
          (stacked ? (
            <>
              <Button variant="secondary" size="small" icon="filter" onClick={() => setSheetOpen(true)}>
                {settingsLabel}
              </Button>
              <Drawer title={settingsLabel} open={sheetOpen} onClose={() => setSheetOpen(false)}>
                <div className="result-header-settings">{settings}</div>
              </Drawer>
            </>
          ) : (
            <div className="result-header-settings">{settings}</div>
          ))}
      </div>
      {tabs && <Tabs className="result-header-tabs" label={tabsLabel ?? `${title} views`} tabs={tabs} {...(tab === undefined ? {} : { value: tab })} {...(onTabChange ? { onChange: onTabChange } : {})} />}
    </header>
  );
}
