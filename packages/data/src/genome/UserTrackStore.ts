import type { UserTrack } from './UserTracks';

export interface StoredTrack {
  track: UserTrack;
  /** The file itself, for a track read from the person's computer. */
  file?: Blob | undefined;
}

interface Row extends StoredTrack {
  id: string;
  group: string;
  added: number;
}

const databaseName = 'humanbase-tracks';
const storeName = 'tracks';

const result = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB failed.'));
  });

const committed = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB failed.'));
  });

/** Keeps the tracks people add, files included, in this browser's IndexedDB; in memory for this visit where IndexedDB is blocked. */
export class UserTrackStore {
  private opening: Promise<IDBDatabase | undefined> | undefined;
  private readonly memory = new Map<string, Row>();

  async list(group: string): Promise<StoredTrack[]> {
    const database = await this.open();
    const rows = database ? await result<Row[]>(database.transaction(storeName).objectStore(storeName).getAll()) : [...this.memory.values()];
    return rows
      .filter((row) => row.group === group)
      .sort((a, b) => a.added - b.added)
      .map(({ track, file }) => ({ track, file }));
  }

  /** Rejects when the browser won't keep it, such as a file larger than its storage allows. */
  async put(group: string, track: UserTrack, file?: Blob): Promise<void> {
    const row: Row = { id: `${group} ${track.key}`, group, track, file, added: Date.now() };
    await this.write((store) => store.put(row), () => this.memory.set(row.id, row));
  }

  async remove(group: string, key: string): Promise<void> {
    const id = `${group} ${key}`;
    await this.write((store) => store.delete(id), () => this.memory.delete(id));
  }

  private async write(change: (store: IDBObjectStore) => void, inMemory: () => void) {
    const database = await this.open();
    if (!database) return void inMemory();
    const transaction = database.transaction(storeName, 'readwrite');
    change(transaction.objectStore(storeName));
    await committed(transaction);
  }

  private open(): Promise<IDBDatabase | undefined> {
    this.opening ??= new Promise((resolve) => {
      let request: IDBOpenDBRequest | undefined;
      try {
        request = globalThis.indexedDB?.open(databaseName, 1);
      } catch {
        request = undefined;
      }
      if (!request) return resolve(undefined);
      const opened = request;
      opened.onupgradeneeded = () => opened.result.createObjectStore(storeName, { keyPath: 'id' });
      opened.onsuccess = () => resolve(opened.result);
      opened.onerror = () => resolve(undefined);
    });
    return this.opening;
  }
}
