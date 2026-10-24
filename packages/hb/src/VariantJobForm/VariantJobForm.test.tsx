import { fireEvent, render, screen } from '@testing-library/react';
import { VariantJobForm } from './VariantJobForm';

const example = 'chr1\t100\trs1\tA\tG\t+\nchrX\t9\t.\tT\tC\t-';

describe('VariantJobForm', () => {
  it('checks the example and names the count on the run button', () => {
    const onRun = vi.fn();
    render(<VariantJobForm model="seqweaver" examples={{ hg19: { vcf: example }, hg38: {} }} onRun={onRun} />);
    expect(screen.getByRole('button', { name: 'Run Seqweaver' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    expect(screen.getByText('2 variants on chromosomes 1 and X, ready to run')).toBeInTheDocument();
    const run = screen.getByRole('button', { name: 'Run Seqweaver on 2 variants' });
    fireEvent.click(run);
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ model: 'seqweaver', kind: 'vcf', text: example, uploaded: false, genome: 'hg19' }));
  });

  it('can start with the example loaded', () => {
    render(<VariantJobForm model="seqweaver" examples={{ hg19: { vcf: example }, hg38: {} }} defaultSource="example" />);
    expect(screen.getByRole('radio', { name: 'Use the example' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Run Seqweaver on 2 variants' })).not.toHaveAttribute('aria-disabled');
  });

  it('keeps the run button off while lines break a rule', () => {
    render(<VariantJobForm model="seqweaver" examples={{ hg19: { vcf: 'chr1\t100\trs1\tN\tG\t+' }, hg38: {} }} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Seqweaver' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('offers GRCh38/hg38 where the model takes it, and only GRCh37/hg19 for ExPecto', () => {
    const { unmount } = render(<VariantJobForm model="sei" examples={{ hg19: {}, hg38: {} }} />);
    expect(screen.getByRole('combobox', { name: /Genome assembly/ })).toBeInTheDocument();
    unmount();
    render(<VariantJobForm model="expecto" examples={{ hg19: {}, hg38: {} }} />);
    expect(screen.getByRole('combobox', { name: /Genome assembly/ })).toHaveTextContent('GRCh37/hg19');
  });
});
