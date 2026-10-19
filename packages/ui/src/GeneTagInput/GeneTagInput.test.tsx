import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneTagInput, unknownGenesMessage } from './GeneTagInput';

const known = new Set(['IL1B', 'TNF', 'IL6', 'CXCL8']);
const setup = (onChange = vi.fn()) => {
  render(<GeneTagInput label="Genes" isKnownGene={(gene) => known.has(gene)} onChange={onChange} />);
  return { input: screen.getByRole('textbox', { name: 'Genes' }), onChange };
};

describe('GeneTagInput', () => {
  it('turns text into a tag on comma, space or Enter', async () => {
    const { input, onChange } = setup();
    await userEvent.type(input, 'IL1B,TNF IL6{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['IL1B', 'TNF', 'IL6']);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(input).toHaveValue('');
  });

  it('makes one tag per gene from a pasted list', async () => {
    const { input, onChange } = setup();
    await userEvent.click(input);
    await userEvent.paste('IL1B\nTNF; IL6');
    expect(onChange).toHaveBeenLastCalledWith(['IL1B', 'TNF', 'IL6']);
  });

  it('selects the last tag on Backspace, then removes it', async () => {
    const { input, onChange } = setup();
    await userEvent.type(input, 'IL1B TNF ');
    await userEvent.keyboard('{Backspace}');
    expect(screen.getByRole('status')).toHaveTextContent('TNF selected');
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['IL1B']);
  });

  it('keeps unknown genes and names them in the error', async () => {
    const { input } = setup();
    await userEvent.type(input, 'IL1Z ');
    expect(input).toHaveAccessibleDescription('Error: IL1Z isn’t a known human gene. Check the spelling or remove it.');
    expect(screen.getByRole('button', { name: 'Remove IL1Z' })).toBeInTheDocument();
  });

  it('names several unknown genes together', () => {
    expect(unknownGenesMessage(['IL1Z', 'TNX', 'FOO'])).toBe('IL1Z, TNX and FOO aren’t known human genes. Check the spelling or remove them.');
  });
});
