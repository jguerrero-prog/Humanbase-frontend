const superscripts: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

type Maybe<T> = T | null | undefined;

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
