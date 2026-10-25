import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchField } from './SearchField';

describe('SearchField', () => {
  it('is a search box with a label that is hidden but present', () => {
    render(<SearchField label="Search genes" placeholder="Search a gene, for example IL1B" />);
    expect(screen.getByRole('searchbox', { name: 'Search genes' })).toBeInTheDocument();
  });

  it('shows a clear button once there is text, and clearing returns focus', async () => {
    render(<SearchField label="Search genes" />);
    const box = screen.getByRole('searchbox');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    await userEvent.type(box, 'IL1B');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(box).toHaveValue('');
    expect(box).toHaveFocus();
  });

  it('clears with Escape', async () => {
    const onClear = vi.fn();
    render(<SearchField label="Search genes" defaultValue="IL1B" onClear={onClear} />);
    await userEvent.type(screen.getByRole('searchbox'), '{Escape}');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('swaps the clear button for a spinner while loading', () => {
    render(<SearchField label="Search genes" defaultValue="IL1B" loading />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-busy', 'true');
  });
});

describe('SearchField suggestions', () => {
  const genes = [
    { id: '3552', label: 'IL1A', description: 'interleukin 1 alpha', meta: '3552' },
    { id: '3553', label: 'IL1B', description: 'interleukin 1 beta', meta: '3553' },
  ];

  it('becomes a combobox that opens as people type and announces the count', async () => {
    render(<SearchField label="Search genes" suggestions={genes} />);
    const box = screen.getByRole('combobox', { name: 'Search genes' });
    await userEvent.type(box, 'IL1');
    expect(box).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByText('2 suggestions')).toBeInTheDocument();
  });

  it('opens the highlighted gene with Enter', async () => {
    const onSuggestionSelect = vi.fn();
    render(<SearchField label="Search genes" suggestions={genes} onSuggestionSelect={onSuggestionSelect} />);
    await userEvent.type(screen.getByRole('combobox'), 'IL1{ArrowDown}{ArrowDown}{Enter}');
    expect(onSuggestionSelect).toHaveBeenCalledWith(genes[1]);
  });

  it('closes on the first Escape and clears on the second', async () => {
    render(<SearchField label="Search genes" suggestions={genes} />);
    const box = screen.getByRole('combobox');
    await userEvent.type(box, 'IL1{Escape}');
    expect(box).toHaveAttribute('aria-expanded', 'false');
    expect(box).toHaveValue('IL1');
    await userEvent.keyboard('{Escape}');
    expect(box).toHaveValue('');
  });

  it('says when nothing matches', async () => {
    render(<SearchField label="Search genes" suggestions={[]} />);
    await userEvent.type(screen.getByRole('combobox'), 'IL1Z');
    expect(screen.getAllByText('No genes match “IL1Z”')).toHaveLength(2);
  });
});

describe('SearchField suggestions with destinations', () => {
  const genes = [
    { id: '85358', label: 'SHANK3', description: 'SH3 and multiple ankyrin repeat domains 3', destinations: [{ label: 'Networks', href: '/networks/?entrez=85358' }, { label: 'Expression effects', href: '/expression-effects/genes/85358/' }] },
    { id: '22941', label: 'SHANK2', description: 'SH3 and multiple ankyrin repeat domains 2', destinations: [{ label: 'Expression effects', href: '/expression-effects/genes/22941/' }] },
  ];
  const opened: string[] = [];
  const record = (event: MouseEvent) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link) return;
    event.preventDefault();
    opened.push(link.getAttribute('href') ?? '');
  };
  beforeEach(() => {
    opened.length = 0;
    document.addEventListener('click', record);
  });
  afterEach(() => document.removeEventListener('click', record));

  const renderGrid = () => {
    render(<SearchField label="Search genes" suggestions={genes} heading="Genes" total={21} />);
    return screen.getByRole('combobox', { name: 'Search genes' });
  };
  const active = (box: HTMLElement) => document.getElementById(box.getAttribute('aria-activedescendant') ?? '');

  it('is a grid combobox: a row per gene, a cell per destination, and a count when more matched', async () => {
    const box = renderGrid();
    expect(box).toHaveAttribute('aria-haspopup', 'grid');
    await userEvent.type(box, 'SHANK');
    const grid = screen.getByRole('grid', { name: 'Genes' });
    expect(box).toHaveAttribute('aria-controls', grid.id);
    expect(within(grid).getAllByRole('row')).toHaveLength(2);
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(3);
    expect(within(grid).getByRole('link', { name: 'SHANK3 in Networks' })).toHaveAttribute('href', '/networks/?entrez=85358');
    expect(screen.getByText('2 of 21')).toBeInTheDocument();
  });

  it('moves between genes with Up and Down and between destinations with Left and Right, then opens with Enter', async () => {
    const box = renderGrid();
    await userEvent.type(box, 'SHANK{ArrowDown}');
    expect(active(box)).toHaveTextContent('Networks');
    expect(active(box)).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(active(box)).toHaveTextContent('Expression effects');
    await userEvent.keyboard('{ArrowRight}');
    expect(active(box)).toHaveTextContent('Expression effects');
    await userEvent.keyboard('{ArrowDown}');
    expect(active(box)).toHaveAccessibleName('SHANK2 in Expression effects');
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}{Enter}');
    expect(opened).toEqual(['/networks/?entrez=85358']);
    expect(box).toHaveAttribute('aria-expanded', 'false');
  });

  it('never opens a destination it guessed: Enter with nothing highlighted highlights the first one', async () => {
    const box = renderGrid();
    await userEvent.type(box, 'SHANK{Enter}');
    expect(opened).toEqual([]);
    expect(active(box)).toHaveAccessibleName('SHANK3 in Networks');
    await userEvent.keyboard('{Enter}');
    expect(opened).toEqual(['/networks/?entrez=85358']);
  });

  it('opens a destination with one click, and closes with Escape', async () => {
    const box = renderGrid();
    await userEvent.type(box, 'SHANK');
    await userEvent.click(screen.getByRole('link', { name: 'SHANK2 in Expression effects' }));
    expect(opened).toEqual(['/expression-effects/genes/22941/']);
    await userEvent.type(box, '2');
    expect(box).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(box).toHaveAttribute('aria-expanded', 'false');
  });

  it('hints at the grid keys', async () => {
    await userEvent.type(renderGrid(), 'SHANK');
    expect(screen.getByText('destination')).toBeInTheDocument();
    expect(screen.getByText('result')).toBeInTheDocument();
  });
});
