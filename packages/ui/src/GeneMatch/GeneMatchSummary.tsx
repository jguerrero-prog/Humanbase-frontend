import { Icon, type IconName } from '../Icon/Icon';
import type { GeneMatchList } from './GeneMatchList';
import './GeneMatch.css';

const countIcons: readonly { icon: IconName; tone: string }[] = [
  { icon: 'check-circle', tone: 'success' },
  { icon: 'alert-triangle', tone: 'warning' },
  { icon: 'alert-circle', tone: 'error' },
];

export interface GeneMatchSummaryProps {
  list: GeneMatchList;
  title?: string;
  level?: 2 | 3 | 4;
  fileName?: string;
}

export function GeneMatchSummary({ list, title = 'How your genes matched', level = 3, fileName = 'gene-list.tsv' }: GeneMatchSummaryProps) {
  const Heading = `h${level}` as const;
  return (
    <div className="gene-match-header">
      <Heading>{title}</Heading>
      <ul className="gene-match-counts">
        {list.summary.map((text, index) => (
          <li key={text} data-tone={countIcons[index]?.tone}>
            <Icon name={countIcons[index]?.icon ?? 'info'} size={16} />
            {text}
          </li>
        ))}
      </ul>
      <a className="gene-match-download" href={`data:text/tab-separated-values;charset=utf-8,${encodeURIComponent(list.toTsv())}`} download={fileName}>
        <Icon name="download" size={16} />
        Download gene list
      </a>
    </div>
  );
}
