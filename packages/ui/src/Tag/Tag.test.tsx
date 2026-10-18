import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextLabel } from '../ContextLabel/ContextLabel';
import { Tag } from './Tag';

describe('Tag', () => {
  it('has a remove button named after the gene', async () => {
    const onRemove = vi.fn();
    render(<Tag label="IL1B" onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove IL1B' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('says when a gene is not known, and drops the button while disabled', () => {
    const { rerender } = render(<Tag label="IL1Z" invalid onRemove={() => {}} />);
    expect(screen.getByRole('img', { name: 'Not a known gene:' })).toBeInTheDocument();
    rerender(<Tag label="IL1B" disabled onRemove={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ContextLabel', () => {
  it('reads as a key and a value, and is removable when it is a filter', async () => {
    const onRemove = vi.fn();
    const { container } = render(<ContextLabel name="Score" value="0.5 or more" onRemove={onRemove} />);
    expect(container).toHaveTextContent('Score:0.5 or more');
    await userEvent.click(screen.getByRole('button', { name: 'Remove Score: 0.5 or more' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
