import { useId, type ReactElement, type ReactNode } from 'react';
import { Illustration } from '../Illustration/Illustration';
import type { IllustrationName } from '../Illustration/illustrations';
import './Article.css';

export interface ArticleHeroProps {
  title: string;
  lead: ReactNode;
  /** Where the text was first published, such as a journal and year. */
  source?: ReactNode;
  doi?: string;
  player?: ReactNode;
  /** The illustration along the hero's bottom edge, by library name or as drawn art; null leaves it out. */
  band?: IllustrationName | ReactElement | null;
  /** Decorative art at the hero's top right, behind the text; hidden on narrow screens. */
  art?: ReactElement;
  /** 2 when the hero is shown inside another page, such as a design system example. */
  titleLevel?: 1 | 2;
  titleId?: string;
}

/** The cream opening of an article or content page: title, lead, optional source and player, then an illustrated band unless band is null. */
export function ArticleHero({ title, lead, source, doi, player, band = 'capillary', art, titleLevel = 1, titleId }: ArticleHeroProps) {
  const Title = titleLevel === 1 ? 'h1' : 'h2';
  return (
    <header className="article-hero">
      {art && <div className="article-hero-art">{art}</div>}
      <div className="article-hero-content">
        <Title id={titleId} className="article-title">
          {title}
        </Title>
        <div className="article-overview">
          <p className="article-lead">{lead}</p>
          {(source || doi) && (
            <p className="article-source">
              {source && <span>{source}</span>}
              {doi && <a href={doi}>{doi}</a>}
            </p>
          )}
          {player}
        </div>
      </div>
      {typeof band === 'string' ? <Illustration name={band} className="article-band" loading="eager" /> : band}
    </header>
  );
}

export interface ArticleLayoutProps extends Omit<ArticleHeroProps, 'titleId'> {
  backMatter?: ReactNode;
  children: ReactNode;
}

/** A long read: cream hero with an illustrated band, one centered reading column, then back matter. */
export function ArticleLayout({ backMatter, children, ...hero }: ArticleLayoutProps) {
  const titleId = useId();
  return (
    <article className="article" aria-labelledby={titleId}>
      <ArticleHero {...hero} titleId={titleId} />
      <div className="article-body">
        {children}
        {backMatter && <footer className="article-back">{backMatter}</footer>}
      </div>
    </article>
  );
}

/** The opening paragraph, whose first letter becomes a drop cap without splitting the word; cells false leaves out the illustrated cells beside it. */
export function DropCapParagraph({ children, cells = true }: { children: ReactNode; cells?: boolean }) {
  return <p className={cells ? 'article-drop-cap' : 'article-drop-cap article-drop-cap-plain'}>{children}</p>;
}

export interface ArticleSectionProps {
  title: string;
  /** Back matter sections, such as References, take a smaller heading. */
  kind?: 'body' | 'back';
  children: ReactNode;
}

export function ArticleSection({ title, kind = 'body', children }: ArticleSectionProps) {
  const headingId = useId();
  return (
    <section className={`article-section article-section-${kind}`} aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}

export interface ArticleImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ArticleFigureProps {
  image: ArticleImage;
  caption?: ReactNode;
  credit?: ReactNode;
}

export function ArticleFigure({ image, caption, credit }: ArticleFigureProps) {
  return (
    <figure className="article-figure">
      <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
      {(caption || credit) && (
        <figcaption>
          {caption && <p>{caption}</p>}
          {credit && <p className="article-credit">{credit}</p>}
        </figcaption>
      )}
    </figure>
  );
}

const referenceId = (n: number) => `ref-${n}`;

/** A citation: a number, or a range such as [1, 5] shown as 1–5. */
export type ReferenceMark = number | readonly [number, number];

/** Superscript reference marks that link to the matching items in ReferenceList. */
export function RefMark({ refs }: { refs: readonly ReferenceMark[] }) {
  return (
    <sup>
      {refs.map((mark, index) => {
        const [first, last] = typeof mark === 'number' ? [mark, mark] : mark;
        const range = first !== last;
        return (
          <span key={first}>
            {index > 0 && ','}
            <a href={`#${referenceId(first)}`}>
              <span className="visually-hidden">{range ? 'References ' : 'Reference '}</span>
              {range ? `${first}–${last}` : first}
            </a>
          </span>
        );
      })}
    </sup>
  );
}

export function ReferenceList({ references }: { references: readonly ReactNode[] }) {
  return (
    <ol className="article-references">
      {references.map((reference, index) => (
        <li key={index} id={referenceId(index + 1)}>
          {reference}
        </li>
      ))}
    </ol>
  );
}
