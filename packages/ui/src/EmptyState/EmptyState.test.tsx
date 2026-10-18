import { render, screen } from '@testing-library/react';
import { Button } from '../Button/Button';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('says what is empty, why, and offers one way forward', () => {
    render(
      <EmptyState
        title="No edges at 0.95 or more"
        text="IL1B’s strongest connection in blood vessel is 0.93."
        actions={<Button size="small">Set to 0.80</Button>}
      />,
    );
    expect(screen.getByText('No edges at 0.95 or more')).toBeInTheDocument();
    expect(screen.getByText('IL1B’s strongest connection in blood vessel is 0.93.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set to 0.80' })).toBeInTheDocument();
  });

  it('leaves out the explanation and actions when there are none', () => {
    const { container } = render(<EmptyState title="No results" />);
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });
});
