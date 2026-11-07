import { CacheEntry } from './types.js';

export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, any>();

  async getItem<T>(key: string): Promise<T | null> {
    const val = this.store.get(key);
    return val !== undefined ? JSON.parse(JSON.stringify(val)) : null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.store.set(key, JSON.parse(JSON.stringify(value)));
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class CacheManager {
  constructor(
    private storage: StorageAdapter,
    private defaultTtl: number = DEFAULT_TTL_MS
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const entry = await this.storage.getItem<CacheEntry<T>>(key);
    if (!entry) return null;

    const ttl = typeof entry.ttl === 'number' && entry.ttl > 0 ? entry.ttl : DEFAULT_TTL_MS * 365;
    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
      await this.storage.removeItem(key);
      return null;
    }

    return entry.data;
  }

  async set<T>(key: string, data: T, ttl: number = this.defaultTtl): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    await this.storage.setItem(key, entry);
  }

  async remove(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
}
