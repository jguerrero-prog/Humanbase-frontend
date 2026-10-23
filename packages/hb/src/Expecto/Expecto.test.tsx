import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { ExpressionEffects } from './ExpressionEffects';
import { GeneExpression, type GeneExpressionState } from './GeneExpression';
import { expressionEffectsLink, expressionGeneLink } from './geneExpressionTools';
import { GeneFinder } from './GeneFinder';
import { VariantSearch } from './VariantSearch';

const wait = { timeout: 15000 };
// The IRGM and PTEN samples are large tables, so their tests get longer than the default 5 seconds.
const slow = 30_000;

function withSamples(children: ReactNode) {
  return render(<HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>{children}</HumanbaseProvider>);
}

describe('GeneExpression', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => undefined));

  it('shows IRGM by tissue system, then each tissue of one system', async () => {
    const onStateChange = vi.fn();
    const { rerender } = withSamples(<GeneExpression tool="expecto" entrez={345611} state={{ view: 'groups' }} onStateChange={onStateChange} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'IRGM' }, wait)).toBeInTheDocument();
    expect(await screen.findByText('Predicted effect on IRGM expression, log fold change', {}, wait)).toBeInTheDocument();
    expect(await screen.findByText('113 near the start', {}, wait)).toBeInTheDocument();
    expect(await screen.findAllByRole('rowheader', { name: 'hematopoietic system' }, wait)).not.toHaveLength(0);

    await userEvent.click(screen.getByRole('radio', { name: 'Tissues' }));
    expect(onStateChange).toHaveBeenCalledWith({ view: 'members', find: undefined });

    const state: GeneExpressionState = { view: 'members', group: 'hematopoietic system' };
    rerender(
      <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
        <GeneExpression tool="expecto" entrez={345611} state={state} onStateChange={onStateChange} />
      </HumanbaseProvider>,
    );
    expect(await screen.findByText('Predicted effect on IRGM expression, log fold change: 10 of 204 tissues', {}, wait)).toBeInTheDocument();
    expect(await screen.findAllByRole('rowheader', { name: 'Spleen, GTEx' }, wait)).not.toHaveLength(0);
  }, slow);

  it('shows ExPecto SC by organ', async () => {
    withSamples(<GeneExpression tool="expecto-sc" entrez={5728} state={{ view: 'groups' }} onStateChange={() => undefined} />);
    expect(await screen.findByText('Predicted effect on PTEN expression, z-score', {}, wait)).toBeInTheDocument();
    expect(await screen.findAllByRole('rowheader', { name: 'retina' }, wait)).not.toHaveLength(0);
    expect(screen.getByRole('searchbox', { name: 'Find an organ' })).toBeInTheDocument();
  }, slow);

  it('explains a gene the sample data doesn’t cover', async () => {
    withSamples(<GeneExpression tool="expecto" entrez={100188314} state={{ view: 'groups' }} onStateChange={() => undefined} />);
    expect(await screen.findByText('This copy of Humanbase shows sample data, which covers IRGM only. Turn the API on to see every gene.', {}, wait)).toBeInTheDocument();
  });
});

describe('VariantSearch', () => {
  it('finds a gene’s variants and links each to the gene', async () => {
    withSamples(<VariantSearch query="IRGM" onQueryChange={() => undefined} geneHref={(entrez) => expressionGeneLink(entrez)} />);
    expect(await screen.findByRole('heading', { name: '17 variants for IRGM' }, wait)).toBeInTheDocument();
    expect(screen.getByText(/the 85,312 with the highest predicted impact/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'IRGM' })[0]).toHaveAttribute('href', '/expression-effects/genes/345611/');
    await userEvent.click(screen.getByRole('button', { name: 'Show 7 more' }));
    expect(screen.getAllByRole('link', { name: 'IRGM' })).toHaveLength(17);
  });

  it('searches by position', async () => {
    withSamples(<VariantSearch query="chr1:877047" onQueryChange={() => undefined} geneHref={() => '#'} />);
    expect(await screen.findByRole('heading', { name: '1 variant for chr1:877047' }, wait)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'SAMD11' })).toBeInTheDocument();
  });

  it('says when nothing matches', async () => {
    withSamples(<VariantSearch query="NOTAGENE" onQueryChange={() => undefined} geneHref={() => '#'} />);
    expect(await screen.findByText('No variants for NOTAGENE', {}, wait)).toBeInTheDocument();
  });
});

describe('GeneFinder', () => {
  it('opens an example gene', async () => {
    const onPick = vi.fn();
    withSamples(<GeneFinder label="Search a gene" placeholder="Search a gene, such as IRGM" examples={['IRGM']} onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: 'IRGM' }));
    await vi.waitFor(() => expect(onPick).toHaveBeenCalledWith(345611));
  });
});

describe('ExpressionEffects', () => {
  const props = { onModelChange: vi.fn(), query: '', onQueryChange: () => undefined, onOpen: () => undefined };

  it('says ExPecto SC can’t score submitted variants yet and offers ExPecto', async () => {
    withSamples(<ExpressionEffects {...props} tab="submit-variants" model="expecto-sc" />);
    expect(screen.getByText('Submitting variants isn’t available for ExPecto SC yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Run/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Switch to ExPecto' }));
    expect(props.onModelChange).toHaveBeenCalledWith('expecto');
  });

  it('puts the model first on the ExPecto form, with what it can score', () => {
    withSamples(<ExpressionEffects {...props} tab="submit-variants" model="expecto" />);
    expect(screen.getByRole('combobox', { name: 'Model' })).toHaveTextContent('ExPecto (tissues)');
    expect(screen.getByText('Variants within 20 kb of a gene’s start can be scored.')).toBeInTheDocument();
  });

  it('links each tab, model and gene, leaving the defaults out', () => {
    expect(expressionEffectsLink()).toBe('/expression-effects/');
    expect(expressionEffectsLink({ tab: 'rsid', model: 'expecto-sc' })).toBe('/expression-effects/?tab=rsid&model=expecto-sc');
    expect(expressionGeneLink(5728, 'expecto-sc')).toBe('/expression-effects/genes/5728/?model=expecto-sc');
    expect(expressionGeneLink(345611)).toBe('/expression-effects/genes/345611/');
  });
});
