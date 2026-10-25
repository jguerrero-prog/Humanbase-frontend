/** The modal dialogs open right now, newest last, so content that must stay usable, such as toasts, can move into the top one. */
export class ModalStack {
  #layers: readonly HTMLDialogElement[] = [];
  #listeners = new Set<() => void>();

  top = (): HTMLDialogElement | null => this.#layers.at(-1) ?? null;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  open(layer: HTMLDialogElement): void {
    this.#set([...this.#layers.filter((open) => open !== layer), layer]);
  }

  close(layer: HTMLDialogElement): void {
    this.#set(this.#layers.filter((open) => open !== layer));
  }

  #set(layers: readonly HTMLDialogElement[]): void {
    this.#layers = layers;
    this.#listeners.forEach((listener) => listener());
  }
}

export const modalStack = new ModalStack();
