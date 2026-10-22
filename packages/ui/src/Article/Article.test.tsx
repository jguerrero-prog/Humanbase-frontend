import { render, screen, within } from '@testing-library/react';
import { ArticleFigure, ArticleHero, ArticleLayout, ArticleSection, DropCapParagraph, RefMark, ReferenceList } from './Article';

function Example() {
  return (
    <ArticleLayout
      title="An Interactive AI Platform for Human Biology"
      lead="Humanbase reveals unseen connections."
      source="Sealfon et al., Nature Methods (2026)"
      doi="https://doi.org/10.1038/s41592-025-02994-8"
      player={<button type="button">Listen to this story</button>}
      backMatter={
        <ArticleSection kind="back" title="References">
          <ReferenceList references={['Zhou, J. et al. (2018).', 'Chen, K. M. et al. (2022).', 'Park, C. Y. et al. (2021).']} />
        </ArticleSection>
      }
    >
      <DropCapParagraph>Increasing quantities of genomic data.</DropCapParagraph>
      <ArticleSection title="Analysis">
        <p>
          Models predict impacts
          <RefMark refs={[[1, 2]]} /> and more
          <RefMark refs={[2, 3]} />.
        </p>
        <ArticleFigure image={{ src: '/fig.png', alt: 'Seven tools', width: 1746, height: 1042 }} caption="Fig. 1 | Overview." credit="Graphics by Lucy Reading-Ikkanda." />
      </ArticleSection>
    </ArticleLayout>
  );
}

describe('ArticleLayout', () => {
  it('names the article by its title and shows the source, DOI and player in the hero', () => {
    const { container } = render(<Example />);
    const article = screen.getByRole('article', { name: 'An Interactive AI Platform for Human Biology' });
    expect(within(article).getByRole('link', { name: 'https://doi.org/10.1038/s41592-025-02994-8' })).toHaveAttribute('href', 'https://doi.org/10.1038/s41592-025-02994-8');
    expect(within(article).getByRole('button', { name: 'Listen to this story' })).toBeInTheDocument();
    expect(container.querySelector('[data-illustration="capillary"]')).toHaveAttribute('alt', '');
  });

  it('offers the hero on its own, without a source line or player', () => {
    const { container } = render(<ArticleHero title="Data sources" lead="Refreshed periodically." band="reads" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Data sources' })).toBeInTheDocument();
    expect(container.querySelector('.article-source')).toBeNull();
    expect(container.querySelector('[data-illustration="reads"]')).toHaveAttribute('alt', '');
  });

  it('keeps the drop cap word whole', () => {
    render(<Example />);
    expect(screen.getByText('Increasing quantities of genomic data.')).toHaveClass('article-drop-cap');
  });

  it('gives sections headings and figures captions with credit', () => {
    render(<Example />);
    expect(screen.getByRole('region', { name: 'Analysis' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'References' })).toBeInTheDocument();
    const figure = screen.getByRole('figure');
    expect(within(figure).getByRole('img', { name: 'Seven tools' })).toBeInTheDocument();
    expect(figure).toHaveTextContent('Fig. 1 | Overview.Graphics by Lucy Reading-Ikkanda.');
  });

  it('links reference marks to numbered references', () => {
    render(<Example />);
    expect(screen.getByRole('link', { name: /^References ?1–2$/ })).toHaveAttribute('href', '#ref-1');
    expect(screen.getByRole('link', { name: /^Reference ?3$/ })).toHaveAttribute('href', '#ref-3');
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.id)).toEqual(['ref-1', 'ref-2', 'ref-3']);
  });
});
