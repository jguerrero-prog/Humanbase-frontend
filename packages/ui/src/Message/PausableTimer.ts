/** Counts down a toast's time. Each start can name who to tell, so the time left carries over when the toast is shown somewhere new. */
export class PausableTimer {
  #handle: ReturnType<typeof setTimeout> | undefined;
  #remaining: number;
  #startedAt = 0;
  #onDone: () => void = () => {};

  constructor(duration: number) {
    this.#remaining = duration;
  }

  start(onDone?: () => void): void {
    if (onDone) this.#onDone = onDone;
    if (this.#handle !== undefined) return;
    this.#startedAt = Date.now();
    this.#handle = setTimeout(() => this.#onDone(), this.#remaining);
  }

  pause(): void {
    if (this.#handle === undefined) return;
    this.stop();
    this.#remaining -= Date.now() - this.#startedAt;
  }

  stop(): void {
    clearTimeout(this.#handle);
    this.#handle = undefined;
  }

  holdWhileInside(element: HTMLElement): () => void {
    const hold = () => this.pause();
    const release = () => {
      if (!element.matches(':hover') && !element.contains(document.activeElement)) this.start();
    };
    const events = [
      ['pointerenter', hold],
      ['focusin', hold],
      ['pointerleave', release],
      ['focusout', release],
    ] as const;
    events.forEach(([name, listener]) => element.addEventListener(name, listener));
    return () => events.forEach(([name, listener]) => element.removeEventListener(name, listener));
  }
}
