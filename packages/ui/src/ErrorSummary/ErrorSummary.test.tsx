import { fireEvent, render, screen } from '@testing-library/react';
import { FileField } from '../FileField/FileField';
import { TextInput } from '../TextInput/TextInput';
import { ErrorSummary } from './ErrorSummary';

describe('ErrorSummary', () => {
  it('takes focus, counts the problems and links each one to its field', () => {
    render(
      <>
        <ErrorSummary
          items={[
            { fieldId: 'gwas-file', message: 'Choose a GWAS file.' },
            { fieldId: 'threshold', message: 'Enter a p-value threshold between 0 and 1.' },
          ]}
        />
        <FileField id="gwas-file" label="GWAS file" error="Add a GWAS file to run NetWAS." />
        <TextInput id="threshold" label="p-value threshold" error="Use a value between 0 and 1, such as 0.01." />
      </>,
    );
    expect(screen.getByRole('alert').closest('.error-summary')).toHaveFocus();
    expect(screen.getByText('2 things to fix before submitting')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Enter a p-value threshold between 0 and 1.' }));
    expect(screen.getByLabelText('p-value threshold')).toHaveFocus();
  });

  it('marks the file field invalid and names it by its label', () => {
    render(<FileField label="GWAS file" error="Add a GWAS file to run NetWAS." />);
    expect(screen.getByLabelText('GWAS file')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('GWAS file')).toHaveAttribute('type', 'file');
  });
});
