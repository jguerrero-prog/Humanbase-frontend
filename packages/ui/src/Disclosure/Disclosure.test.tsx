import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('names what it reveals and flips to Show less', async () => {
    render(<Disclosure label="Show full response" expandedLabel="Show less" controls="response" />);
    const button = screen.getByRole('button', { name: 'Show full response' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(button).toHaveAccessibleName('Show less');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
