import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge } from './Badge';

describe('Badge', () => {
  it('reads a count with its words when given them', () => {
    render(
      <p>
        Genes <Badge tone="count" spokenAs=", 50 results">50</Badge>
      </p>,
    );
    expect(screen.getByText('Genes', { exact: false })).toHaveTextContent('Genes 50, 50 results');
    expect(screen.getByText('50')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is plain text, never focusable', () => {
    const { container } = render(<Badge>2019 model</Badge>);
    expect(container.querySelector('[tabindex], button, a')).toBeNull();
  });
});

describe('StatusBadge', () => {
  it('says the status in words and hides its icon', () => {
    const { container } = render(<StatusBadge status="running" />);
    expect(container).toHaveTextContent('Running');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('can add detail after the word', () => {
    render(<StatusBadge status="queued">Queued, 3rd in line</StatusBadge>);
    expect(screen.getByText('Queued, 3rd in line')).toBeInTheDocument();
  });
});
