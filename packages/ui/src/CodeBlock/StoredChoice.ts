type Listener = () => void;

export class StoredChoice {
  private readonly listeners = new Set<Listener>();
  private current: string | undefined;

  constructor(private readonly key: string) {}

  read(): string | undefined {
    try {
      return this.current ?? localStorage.getItem(this.key) ?? undefined;
    } catch {
      return this.current;
    }
  }

  write(value: string) {
    this.current = value;
    try {
      localStorage.setItem(this.key, value);
    } catch {
      // Storage can be blocked; the choice still applies to this page.
    }
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
