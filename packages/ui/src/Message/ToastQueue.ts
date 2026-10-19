import type { MessageAction, MessageTone } from './Message';

export type ToastTone = MessageTone | 'loading';

export interface ToastContent {
  tone: ToastTone;
  message: string;
  action?: MessageAction | undefined;
}

export interface ToastEntry extends ToastContent {
  id: string;
}

export interface ToastQueueState {
  toasts: readonly ToastEntry[];
  announcement?: { text: string; urgent: boolean };
}

// Toasts with an action, errors and loading toasts stay until dismissed or replaced.
export function toastDuration({ tone, message, action }: ToastContent): number | undefined {
  if (action || tone === 'error' || tone === 'loading') return undefined;
  const words = message.trim().split(/\s+/).length;
  return 6000 + Math.floor(words / 20) * 1000;
}

export class ToastQueue {
  #state: ToastQueueState = { toasts: [] };
  #listeners = new Set<() => void>();
  #count = 0;

  constructor(readonly limit = 3) {}

  getState = (): ToastQueueState => this.#state;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  show(content: ToastContent): string {
    const id = `toast-${++this.#count}`;
    this.#set([...this.#state.toasts, { ...content, id }].slice(-this.limit), content);
    return id;
  }

  update(id: string, content: ToastContent): void {
    this.#set(this.#state.toasts.map((toast) => (toast.id === id ? { ...content, id } : toast)), content);
  }

  dismiss(id: string): void {
    this.#set(this.#state.toasts.filter((toast) => toast.id !== id));
  }

  #set(toasts: readonly ToastEntry[], announced?: ToastContent): void {
    const announcement = announced ? { text: announced.message, urgent: announced.tone === 'error' } : this.#state.announcement;
    this.#state = announcement ? { toasts, announcement } : { toasts };
    this.#listeners.forEach((listener) => listener());
  }
}
