import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RangeSlider, Slider } from './Slider';

describe('Slider', () => {
  const confidence = { label: 'Minimum confidence', min: 0, max: 1, step: 0.01, defaultValue: 0.84 };

  it('is a labelled slider that reads out the rounded value', () => {
    render(<Slider {...confidence} />);
    const slider = screen.getByRole('slider', { name: 'Minimum confidence' });
    expect(slider).toHaveAttribute('aria-valuetext', '0.84');
    expect(screen.getByRole('textbox', { name: 'Minimum confidence, exact value' })).toHaveValue('0.84');
  });

  it('keeps the field and the thumb in sync, both ways', async () => {
    const onCommit = vi.fn();
    render(<Slider {...confidence} onCommit={onCommit} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.5' } });
    expect(screen.getByRole('textbox')).toHaveValue('0.50');
    const field = screen.getByRole('textbox');
    await userEvent.clear(field);
    await userEvent.type(field, '0.7{Enter}');
    expect(screen.getByRole('slider')).toHaveValue('0.7');
    expect(onCommit).toHaveBeenLastCalledWith(0.7);
  });

  it('snaps typed values outside the range and says so', async () => {
    render(<Slider {...confidence} />);
    const field = screen.getByRole('textbox');
    await userEvent.clear(field);
    await userEvent.type(field, '4');
    await userEvent.tab();
    expect(field).toHaveValue('1.00');
    expect(screen.getByRole('status')).toHaveTextContent('Set to 1.00, the maximum');
  });

  it('moves ten steps with Shift and an arrow key', async () => {
    render(<Slider label="Genes shown" min={5} max={50} step={5} defaultValue={15} />);
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(screen.getByRole('slider')).toHaveValue('5');
  });
});

describe('RangeSlider', () => {
  it('names each thumb and never lets them cross', () => {
    render(<RangeSlider label="Score" min={0} max={1} step={0.01} defaultValue={[0.5, 1]} />);
    const low = screen.getByRole('slider', { name: 'Score, low' });
    const high = screen.getByRole('slider', { name: 'Score, high' });
    fireEvent.change(low, { target: { value: '0.9' } });
    fireEvent.change(high, { target: { value: '0.6' } });
    expect(high).toHaveValue('0.9');
    expect(screen.getByRole('group', { name: 'Score' })).toBeInTheDocument();
  });
});
