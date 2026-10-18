import { fireEvent, render, screen } from '@testing-library/react';
import { VariantJobForm } from './VariantJobForm';

const example = 'chr1\t100\trs1\tA\tG\t+\nchrX\t9\t.\tT\tC\t-';

describe('VariantJobForm', () => {
  it('checks the example and names the count on the run button', () => {
    const onRun = vi.fn();
    render(<VariantJobForm model="seqweaver" examples={{ vcf: example }} onRun={onRun} />);
    expect(screen.getByRole('button', { name: 'Run Seqweaver' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    expect(screen.getByText('2 variants on chromosomes 1 and X, ready to run')).toBeInTheDocument();
    const run = screen.getByRole('button', { name: 'Run Seqweaver on 2 variants' });
    fireEvent.click(run);
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ model: 'seqweaver', kind: 'vcf', text: example }));
  });

  it('keeps the run button off while lines break a rule', () => {
    render(<VariantJobForm model="seqweaver" examples={{ vcf: 'chr1\t100\trs1\tN\tG\t+' }} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Seqweaver' })).toHaveAttribute('aria-disabled', 'true');
  });
});
