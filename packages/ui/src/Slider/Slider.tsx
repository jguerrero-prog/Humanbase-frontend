import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useControlled } from '../hooks/useControlled';
import { SliderScale } from './SliderScale';
import './Slider.css';

type ThumbState = 'hover' | 'focus' | 'dragging';

interface SliderBaseProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  'data-state'?: ThumbState;
}

export interface SliderProps extends SliderBaseProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
}

export interface RangeSliderProps extends SliderBaseProps {
  value?: readonly [number, number];
  defaultValue?: readonly [number, number];
  onChange?: (value: [number, number]) => void;
  onCommit?: (value: [number, number]) => void;
}

// Handled here rather than by the browser so a value between steps, such as a suggested cutoff, moves visibly on the first press.
function keyStep(event: KeyboardEvent<HTMLInputElement>, scale: SliderScale, current: number): number | undefined {
  const up = event.key === 'PageUp' || event.key === 'ArrowUp' || event.key === 'ArrowRight';
  const down = event.key === 'PageDown' || event.key === 'ArrowDown' || event.key === 'ArrowLeft';
  if (!up && !down) return undefined;
  event.preventDefault();
  const big = event.key.startsWith('Page') || event.shiftKey;
  return scale.next(current, up ? 1 : -1, big ? 10 : 1);
}

interface NumberFieldProps {
  label: string;
  value: number;
  scale: SliderScale;
  disabled: boolean | undefined;
  onApply: (value: number, note?: string) => void;
}

function NumberField({ label, value, scale, disabled, onApply }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | undefined>();
  const apply = () => {
    if (draft === undefined) return;
    const parsed = scale.parse(draft);
    setDraft(undefined);
    if (parsed) onApply(parsed.value, parsed.note);
  };
  return (
    <input
      className="slider-field"
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={draft ?? scale.format(value)}
      readOnly={disabled}
      aria-disabled={disabled || undefined}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={apply}
      onKeyDown={(event) => event.key === 'Enter' && apply()}
    />
  );
}

export function Slider({ label, min, max, step = 1, value, defaultValue, onChange, onCommit, disabled, className, 'data-state': dataState }: SliderProps) {
  const id = useId();
  const scale = useMemo(() => new SliderScale(min, max, step), [min, max, step]);
  const [current, setCurrent] = useControlled(value, scale.snap(defaultValue ?? min));
  const [note, setNote] = useState('');

  const update = (next: number, commit = false) => {
    setCurrent(next);
    onChange?.(next);
    if (commit) onCommit?.(next);
  };

  return (
    <div className={['slider', className].filter(Boolean).join(' ')} data-disabled={disabled || undefined}>
      <div className="slider-header">
        <label className="slider-label" htmlFor={id}>
          {label}
        </label>
        <NumberField label={`${label}, exact value`} value={current} scale={scale} disabled={disabled} onApply={(next, message) => { update(next, true); setNote(message ?? ''); }} />
      </div>
      <div className="slider-track" style={{ '--low': '0%', '--high': `${scale.percent(current)}%` } as CSSProperties}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          data-thumb={dataState}
          aria-valuetext={scale.format(current)}
          onChange={(event) => update(Number(event.target.value))}
          onKeyDown={(event) => {
            const next = keyStep(event, scale, current);
            if (next !== undefined) update(next, true);
          }}
          onKeyUp={() => onCommit?.(current)}
          onPointerUp={() => onCommit?.(current)}
        />
      </div>
      <SliderEnds scale={scale} />
      <p className="slider-note" role="status">
        {note}
      </p>
    </div>
  );
}

export function RangeSlider({ label, min, max, step = 1, value, defaultValue, onChange, onCommit, disabled, className, 'data-state': dataState }: RangeSliderProps) {
  const labelId = useId();
  const scale = useMemo(() => new SliderScale(min, max, step), [min, max, step]);
  const [current, setCurrent] = useControlled<readonly [number, number]>(value, defaultValue ?? [min, max]);
  const [note, setNote] = useState('');
  const [low, high] = current;

  const update = (next: [number, number], commit = false) => {
    setCurrent(next);
    onChange?.(next);
    if (commit) onCommit?.(next);
  };
  const setLow = (next: number, commit = false) => update([Math.min(scale.snap(next), high), high], commit);
  const setHigh = (next: number, commit = false) => update([low, Math.max(scale.snap(next), low)], commit);

  const moveNearer = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    const picked = scale.snap(min + ((event.clientX - box.left) / box.width) * (max - min));
    if (Math.abs(picked - low) <= Math.abs(picked - high)) setLow(picked, true);
    else setHigh(picked, true);
  };

  const thumb = (which: 'low' | 'high') => {
    const isLow = which === 'low';
    const own = isLow ? low : high;
    const set = isLow ? setLow : setHigh;
    return (
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={own}
        disabled={disabled}
        data-thumb={isLow ? undefined : dataState}
        aria-label={`${label}, ${which}`}
        aria-valuetext={scale.format(own)}
        onChange={(event) => set(Number(event.target.value))}
        onKeyDown={(event) => {
          const next = keyStep(event, scale, own);
          if (next !== undefined) set(next, true);
        }}
        onKeyUp={() => onCommit?.([low, high])}
        onPointerUp={() => onCommit?.([low, high])}
      />
    );
  };

  const applyField = (which: 'low' | 'high') => (next: number, message?: string) => {
    if (which === 'low') setLow(next, true);
    else setHigh(next, true);
    setNote(message ?? '');
  };

  return (
    <div role="group" aria-labelledby={labelId} className={['slider', 'slider-range', className].filter(Boolean).join(' ')} data-disabled={disabled || undefined}>
      <div className="slider-header">
        <span id={labelId} className="slider-label">
          {label}
        </span>
        <NumberField label={`${label}, low`} value={low} scale={scale} disabled={disabled} onApply={applyField('low')} />
        <span className="slider-to">to</span>
        <NumberField label={`${label}, high`} value={high} scale={scale} disabled={disabled} onApply={applyField('high')} />
      </div>
      <div className="slider-track" style={{ '--low': `${scale.percent(low)}%`, '--high': `${scale.percent(high)}%` } as CSSProperties} onPointerDown={moveNearer}>
        {thumb('low')}
        {thumb('high')}
      </div>
      <SliderEnds scale={scale} />
      <p className="slider-note" role="status">
        {note}
      </p>
    </div>
  );
}

function SliderEnds({ scale }: { scale: SliderScale }) {
  return (
    <p className="slider-ends" aria-hidden="true">
      <span>{scale.format(scale.min).replace(/\.0+$/, '')}</span>
      <span>{scale.format(scale.max).replace(/\.0+$/, '')}</span>
    </p>
  );
}
