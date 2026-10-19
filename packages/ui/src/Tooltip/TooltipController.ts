import motionTokens from '@humanbase/tokens/src/motion.tokens.json';

// Shared by every tooltip so only one shows at a time, and the next appears at once while one is showing.
export class TooltipController {
  #close: (() => void) | undefined;
  #warmUntil = 0;

  constructor(
    readonly delay = motionTokens.motion.delay.tooltip.$value.value,
    readonly hideDelay = 100,
    readonly warmFor = 300,
  ) {}

  showDelay(now = Date.now()): number {
    return this.#close || now < this.#warmUntil ? 0 : this.delay;
  }

  opened(close: () => void): void {
    if (this.#close !== close) this.#close?.();
    this.#close = close;
  }

  closed(close: () => void, now = Date.now()): void {
    if (this.#close !== close) return;
    this.#close = undefined;
    this.#warmUntil = now + this.warmFor;
  }
}

export const tooltips = new TooltipController();
