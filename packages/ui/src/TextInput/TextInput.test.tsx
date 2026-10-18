import { render, screen } from '@testing-library/react';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('links its label and hint to the input', () => {
    render(<TextInput label="Job title" hint="Shown in your job list and in the results email." />);
    const input = screen.getByRole('textbox', { name: 'Job title' });
    expect(input).toHaveAccessibleDescription('Shown in your job list and in the results email.');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('replaces the hint with an error that screen readers hear first', () => {
    render(<TextInput label="Job title" hint="Shown in your job list." error="Use 60 characters or fewer." />);
    const input = screen.getByRole('textbox', { name: 'Job title' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Error: Use 60 characters or fewer.');
    expect(screen.queryByText('Shown in your job list.')).not.toBeInTheDocument();
  });

  it('passes native attributes through, such as disabled and type', () => {
    render(<TextInput label="Email for results (optional)" type="email" disabled />);
    const input = screen.getByRole('textbox', { name: 'Email for results (optional)' });
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeDisabled();
  });
});
