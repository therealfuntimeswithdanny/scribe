import { ATProtoFolder, ATProtoTag, ATProtoTheme, ATProtoRecord } from './atproto';

const FOLDERS_DB = 'atproto-folders';
const TAGS_DB = 'atproto-tags';
const THEMES_DB = 'atproto-themes';
const DB_VERSION = 1;
const STORE_NAME = 'items';

export interface CachedFolder extends ATProtoFolder {
  uri: string;
  cid: string;
  rkey: string;
}

export interface CachedTag extends ATProtoTag {
  uri: string;
  cid: string;
  rkey: string;
}

export interface CachedTheme extends ATProtoTheme {
  uri: string;
  cid: string;
  rkey: string;
}

class StorageManager<T> {
  private db: IDBDatabase | null = null;
  private dbName: string;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'rkey' });
        }
      };
    });
  }

  async save(item: T): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll(): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async delete(rkey: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(rkey);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const foldersStorage = new StorageManager<CachedFolder>(FOLDERS_DB);
export const tagsStorage = new StorageManager<CachedTag>(TAGS_DB);
export const themesStorage = new StorageManager<CachedTheme>(THEMES_DB);
