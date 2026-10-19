import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneList, parseGeneList } from './GeneList';

describe('parseGeneList', () => {
  it('splits on lines, commas, semicolons and spaces', () => {
    expect(parseGeneList('IL1B\nCCL2, IL6;PTGS2  ICAM1\n\n')).toEqual(['IL1B', 'CCL2', 'IL6', 'PTGS2', 'ICAM1']);
  });
});

describe('GeneList', () => {
  it('counts genes as people paste', async () => {
    render(<GeneList label="Gene list" hint="Enter 20 to 3,500 genes." />);
    const list = screen.getByRole('textbox', { name: 'Gene list' });
    expect(list).toHaveAccessibleDescription('Enter 20 to 3,500 genes. 0 genes');
    await userEvent.click(list);
    await userEvent.paste('IL1B\nCCL2\nIL6');
    expect(screen.getByText('3 genes')).toBeInTheDocument();
  });

  it('says 1 gene, not 1 genes', () => {
    render(<GeneList label="Gene list" defaultValue="IL1B" />);
    expect(screen.getByText('1 gene')).toBeInTheDocument();
  });

  it('keeps the count beside the error', () => {
    render(<GeneList label="Gene list" defaultValue={'IL1B\nCCL2'} error="Add at least 20 genes so modules can be found. You’ve entered 2." />);
    expect(screen.getByRole('textbox', { name: 'Gene list' })).toHaveAccessibleDescription('Error: Add at least 20 genes so modules can be found. You’ve entered 2. 2 genes');
  });
});
