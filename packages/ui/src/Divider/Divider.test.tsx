import { render, screen } from '@testing-library/react';
import { Divider } from './Divider';

describe('Divider', () => {
  it('is a horizontal rule that assistive technology announces as a separator', () => {
    render(<Divider className="cite-divider" />);
    const rule = screen.getByRole('separator');
    expect(rule.tagName).toBe('HR');
    expect(rule).toHaveClass('divider', 'divider-horizontal', 'cite-divider');
  });

  it('is decorative when vertical, between controls in a row', () => {
    const { container } = render(<Divider orientation="vertical" />);
    expect(screen.queryByRole('separator')).toBeNull();
    const rule = container.querySelector('.divider');
    expect(rule?.tagName).toBe('SPAN');
    expect(rule).toHaveClass('divider-vertical');
    expect(rule).toHaveAttribute('aria-hidden', 'true');
  });
});
