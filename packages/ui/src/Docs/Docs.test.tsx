import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocsLayout } from './DocsLayout';
import { DocsMarkdown } from './DocsMarkdown';
import { DocsNav } from './DocsNav';
import { docsSections } from './markdownSections';
import { OnThisPage } from './OnThisPage';
import { TexMath } from './TexMath';

const groups = [
  { label: 'Get started', items: [{ label: 'Use cases', href: '/docs/use-cases/', current: 'true' as const }] },
  { label: 'Sequence analysis', items: [{ label: 'Sei', href: '/docs/sei/', current: 'page' as const }, { label: 'Beluga (DeepSEA)', href: '/docs/beluga/' }] },
];

describe('DocsNav', () => {
  it('is a Docs navigation landmark with grouped pages and the open page marked', () => {
    render(<DocsNav groups={groups} search={<input aria-label="Search the docs" />} />);
    const nav = screen.getByRole('navigation', { name: 'Docs' });
    expect(within(nav).getByRole('textbox', { name: 'Search the docs' })).toBeInTheDocument();
    expect(within(nav).getByRole('heading', { level: 2, name: 'Sequence analysis' })).toBeInTheDocument();
    expect(within(nav).getByRole('list', { name: 'Sequence analysis' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Sei' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Use cases' })).toHaveAttribute('aria-current', 'true');
    expect(within(nav).getByRole('link', { name: 'Beluga (DeepSEA)' })).not.toHaveAttribute('aria-current');
  });
});

const withSections = [
  {
    label: 'Sequence analysis',
    items: [
      { label: 'Sei', href: '/docs/sei/', current: 'page' as const, sections: [{ label: 'Input', href: '/docs/sei/#input', id: 'input' }, { label: 'Output', href: '/docs/sei/#output', id: 'output' }] },
      { label: 'Beluga (DeepSEA)', href: '/docs/beluga/', sections: [{ label: 'Output', href: '/docs/beluga/#output' }] },
      { label: 'Use cases', href: '/docs/use-cases/', current: 'true' as const, sections: [{ label: 'Tutorials', href: '/docs/use-cases/#tutorials' }, { label: 'Sei use case', href: '/docs/use-cases/sei-use-case/', level: 2 as const, current: true }] },
      { label: 'Citations', href: '/docs/citations/' },
    ],
  },
];

describe('DocsNav sections', () => {
  it('expands the open page, and a chevron shows another page’s sections without leaving', async () => {
    render(<DocsNav groups={withSections} />);
    const seiToggle = screen.getByRole('button', { name: 'Show sections of Sei' });
    expect(seiToggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(seiToggle.getAttribute('aria-controls') ?? '')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Input' })).toHaveAttribute('href', '/docs/sei/#input');

    const belugaToggle = screen.getByRole('button', { name: 'Show sections of Beluga (DeepSEA)' });
    expect(belugaToggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(belugaToggle);
    expect(belugaToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: 'Output' })).toHaveLength(2);

    await userEvent.click(seiToggle);
    expect(seiToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Input' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show sections of Citations' })).not.toBeInTheDocument();
  });

  it('marks the section being read and the open use case under Use cases', () => {
    render(<DocsNav groups={withSections} />);
    expect(screen.getByRole('link', { name: 'Input' })).toHaveAttribute('aria-current', 'location');
    const useCase = screen.getByRole('link', { name: 'Sei use case' });
    expect(useCase).toHaveAttribute('aria-current', 'page');
    expect(useCase.closest('li')).toHaveClass('docs-nav-sub-level-2');
  });
});

const sections = [
  { id: 'sei', title: 'Sei', level: 1 },
  { id: 'input', title: 'Input', level: 2 },
  { id: 'large-submissions', title: 'Large submissions', level: 3 },
  { id: 'output', title: 'Output', level: 2 },
];

describe('OnThisPage', () => {
  it('lists h2 and h3 sections, indents level 3 and marks the current one', () => {
    render(<OnThisPage sections={sections} current="output" />);
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Input', 'Large submissions', 'Output']);
    expect(links[1]?.closest('li')).toHaveClass('on-this-page-level-3');
    expect(within(nav).getByRole('link', { name: 'Output' })).toHaveAttribute('aria-current', 'location');
    expect(within(nav).getByRole('link', { name: 'Output' })).toHaveAttribute('href', '#output');
  });

  it('is hidden when there are fewer than two sections', () => {
    render(<OnThisPage sections={sections.slice(0, 2)} />);
    expect(screen.queryByRole('navigation', { name: 'On this page' })).not.toBeInTheDocument();
  });

  it('marks the first section before the reader scrolls', () => {
    render(<OnThisPage sections={sections} />);
    expect(screen.getByRole('link', { name: 'Input' })).toHaveAttribute('aria-current', 'location');
  });
});

describe('DocsLayout', () => {
  it('shows the title with its live id, breadcrumbs and the sidebar', () => {
    render(
      <DocsLayout nav={<DocsNav groups={groups} />} breadcrumbs={<nav aria-label="Breadcrumb" />} title="Sei" titleId="sei" sections={sections}>
        <p>Body</p>
      </DocsLayout>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Sei' })).toHaveAttribute('id', 'sei');
    expect(screen.getByRole('article', { name: 'Sei' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Docs' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Docs menu' })).not.toBeInTheDocument();
  });

  it('puts the sidebar behind a Docs menu button when narrow', () => {
    render(
      <DocsLayout nav={<DocsNav groups={groups} />} title="Sei" sections={sections} narrow>
        <p>Body</p>
      </DocsLayout>,
    );
    expect(screen.getByRole('button', { name: 'Docs menu' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
  });
});

const markdown = `# Sei {#sei}

Intro with [Beluga](/docs/beluga/#output) and [a paper](https://example.org).

## Output {#output}

### Sequence classes {#sequence-classes}

| Label | Rank |
| ----- | ---: |
| PC1   |    0 |

\`\`\`
KRT6B  -1
\`\`\`

Score ($p_{alt} -p_{ref}$) for p$_{ij}$ and \`code\`.

![Sei use case, screenshot 1](/docs/img/sei-1.png)

> [!NOTE]
> Keep sequences at 4096bp.

<script>alert(1)</script>
`;

describe('DocsMarkdown', () => {
  it('maps Markdown to the design system components', () => {
    const { container } = render(<DocsMarkdown markdown={markdown} images={{ 'sei-1.png': [2000, 700] }} />);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Output' })).toHaveAttribute('id', 'output');
    expect(screen.getByRole('heading', { level: 3, name: 'Sequence classes' })).toHaveAttribute('id', 'sequence-classes');
    expect(screen.getByRole('link', { name: 'Beluga' })).toHaveAttribute('href', '/docs/beluga/#output');
    expect(screen.getByRole('table', { name: 'Sequence classes' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '0' })).toHaveClass('table-cell-number');
    expect(screen.getByRole('figure', { name: 'Sequence classes' })).toHaveTextContent('KRT6B');
    expect(screen.getByRole('button', { name: /Copy/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sei use case, screenshot 1' })).toHaveAttribute('width', '2000');
    expect(screen.getByText('Keep sequences at 4096bp.').closest('.alert')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect([...container.querySelectorAll('sub')].map((sub) => sub.textContent)).toEqual(['alt', 'ref', 'ij']);
  });

  it('renders display formulas as MathML', () => {
    const { container } = render(<DocsMarkdown markdown={'$$\n\\log_2 \\left(\\frac{P_0}{1 - P_0}\\right)\n$$'} />);
    expect(container.querySelector('math mfrac')).not.toBeNull();
  });

  it('reads sections with their text for search', () => {
    expect(docsSections(markdown).map(({ id, level }) => [id, level])).toEqual([
      ['sei', 1],
      ['output', 2],
      ['sequence-classes', 3],
    ]);
    expect(docsSections(markdown)[0]?.text).toContain('Intro with Beluga');
  });
});

describe('TexMath', () => {
  it('writes simple formulas as text with sub elements', () => {
    const { container } = render(<TexMath tex="abs(p_{alt} -p_{ref})" />);
    expect(container).toHaveTextContent('abs(palt -pref)');
    expect(container.querySelector('math')).toBeNull();
  });

  it('builds MathML for fractions, sums and logs', () => {
    const { container } = render(<TexMath tex="\sum{-\log_{10}(evalue_{feature})}/N" display />);
    const math = container.querySelector('math');
    expect(math?.getAttribute('display')).toBe('block');
    expect(math?.querySelector('mo')?.textContent).toBe('∑');
    expect(math?.querySelector('msub mi')?.textContent).toBe('log');
  });

  it('shows the source when it cannot read a formula', () => {
    render(<TexMath tex="\unknown{x}" />);
    expect(screen.getByText('\\unknown{x}')).toBeInTheDocument();
  });
});
