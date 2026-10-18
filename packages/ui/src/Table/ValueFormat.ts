const superscripts: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

type Maybe<T> = T | null | undefined;

export interface FormattedValue {
  text: string;
  spoken: string;
  raw: string;
}

export class ValueFormat {
  readonly missing = 'Not available';
  private readonly counts: Intl.NumberFormat;
  private readonly dates: Intl.DateTimeFormat;

  constructor(locale = 'en-US') {
    this.counts = new Intl.NumberFormat(locale);
    this.dates = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  score(value: Maybe<number>): string {
    return value == null ? this.missing : value.toFixed(2);
  }

  count(value: Maybe<number>): string {
    return value == null ? this.missing : this.counts.format(value);
  }

  percent(value: number): string {
    return `${this.counts.format(value)}%`;
  }

  signed(value: number, decimals: number): string {
    const digits = Math.abs(value).toFixed(decimals);
    if (Number(digits) === 0) return digits;
    return `${value < 0 ? '−' : '+'}${digits}`;
  }

  // Plain decimals from 0.001 up, scientific notation below, never rounded to zero.
  pValue(value: number): FormattedValue {
    if (value < 1e-300) return { text: `< ${this.scientific(1e-300, 0)}`, spoken: 'less than 1 times 10 to the minus 300', raw: '<1e-300' };
    if (value >= 0.001) {
      const text = Number(value.toPrecision(2)).toString();
      return { text, spoken: text, raw: text };
    }
    const [mantissa = '', exponent = '0'] = value.toExponential(1).split('e');
    const power = Number(exponent);
    return { text: this.scientific(value), spoken: `${mantissa} times 10 to the minus ${Math.abs(power)}`, raw: `${mantissa}e${power}` };
  }

  scientific(value: Maybe<number>, decimals = 1): string {
    if (value == null) return this.missing;
    const [mantissa, exponent = '0'] = value.toExponential(decimals).split('e');
    const power = String(Number(exponent)).replace(/./g, (digit) => superscripts[digit] ?? digit);
    return `${mantissa} × 10${power}`;
  }

  date(value: Maybe<Date | string>): string {
    if (value == null) return this.missing;
    const date = typeof value === 'string' ? new Date(value) : value;
    return Number.isNaN(date.getTime()) ? this.missing : this.dates.format(date);
  }
}
