import { render, screen } from '@testing-library/react';
import { Skeleton } from '../Skeleton/Skeleton';
import { JobSteps } from './JobSteps';

describe('JobSteps', () => {
  it('reads each step with its state in words and marks the current one', () => {
    render(
      <JobSteps
        label="Job progress"
        steps={[
          { label: 'Submitted', detail: 'Oct 16, 10:42 AM', state: 'done' },
          { label: 'Running', detail: '4 minutes so far.', state: 'current' },
          { label: 'Results ready', state: 'upcoming' },
        ]}
      />,
    );
    const steps = screen.getAllByRole('listitem');
    expect(screen.getByRole('list', { name: 'Job progress' })).toBeInTheDocument();
    expect(steps[0]).toHaveTextContent('Submitted, Done');
    expect(steps[1]).toHaveAttribute('aria-current', 'step');
    expect(steps[2]).toHaveTextContent('Results ready, Not started');
  });
});

describe('Skeleton', () => {
  it('is a still block hidden from screen readers', () => {
    const { container } = render(<Skeleton width="64px" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveStyle({ inlineSize: '64px' });
  });
});
