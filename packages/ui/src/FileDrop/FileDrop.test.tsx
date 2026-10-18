import { fireEvent, render, screen } from '@testing-library/react';
import { FileDrop, fileSize } from './FileDrop';

const base = { label: 'GWAS file', prompt: 'Drop a VCF file here, or', hint: 'Up to 20,000 variants.' };

describe('FileDrop', () => {
  it('labels the native file input and hands over a chosen file', () => {
    const onFile = vi.fn();
    render(<FileDrop {...base} onFile={onFile} />);
    const input = screen.getByLabelText('GWAS file');
    const file = new File(['chr1\t1\t.\tA\tG'], 'variants.vcf');
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
    expect(screen.getByText('choose a file')).toHaveAttribute('for', input.id);
  });

  it('lists the first three problems and marks the input invalid', () => {
    const problems = [1, 2, 3, 4].map((line) => ({ line, rule: `Rule ${line}` }));
    render(<FileDrop {...base} file={{ name: 'variants.vcf', size: 63488 }} problems={problems} problemSummary="4 lines need fixing" onDownloadProblems={() => {}} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('4 lines need fixing');
    expect(screen.getByLabelText('GWAS file')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Remove variants.vcf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download all problems' })).toBeInTheDocument();
  });

  it('shows progress while checking and formats sizes', () => {
    render(<FileDrop {...base} file={{ name: 'a.vcf', size: 10 }} progress={{ text: 'Checking line 820 of 1,284…', value: 820, max: 1284 }} />);
    expect(screen.getByRole('progressbar', { name: 'Checking line 820 of 1,284…' })).toBeInTheDocument();
    expect(fileSize(63488)).toBe('62 KB');
  });
});
