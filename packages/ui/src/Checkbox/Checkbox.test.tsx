import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('is a native checkbox named by its label', async () => {
    render(<Checkbox label="Co-expression" />);
    const box = screen.getByRole('checkbox', { name: 'Co-expression' });
    await userEvent.click(screen.getByText('Co-expression'));
    expect(box).toBeChecked();
  });

  it('can be partly checked', () => {
    render(<Checkbox label="All evidence" indeterminate />);
    expect(screen.getByRole('checkbox', { name: 'All evidence' })).toHaveProperty('indeterminate', true);
  });

  it('describes its error', () => {
    render(<Checkbox label="Show only significant terms" error="Select this option to continue." />);
    const box = screen.getByRole('checkbox');
    expect(box).toBeInvalid();
    expect(box).toHaveAccessibleDescription('Error: Select this option to continue.');
  });
});
