/**
 * Unit tests for the IndexedDB wrapper module.
 * Uses a mock database to test all CRUD operations.
 */

import { jest } from '@jest/globals';

import {
  getDatabase,
  storePrices,
  getAllPrices,
  getLastFetchedDate,
  setLastFetchedDate,
  clearPrices,
  DB_NAME,
  DB_VERSION,
  PRICES_STORE,
  META_STORE,
} from '../js/db.js';

/**
 * Creates a mock IndexedDB database for testing.
 * @returns {{db: Object, openDB: Function}} Mock database and openDB function
 */
function createMockDB() {
  const stores = {
    [PRICES_STORE]: new Map(),
    [META_STORE]: new Map(),
  };

  const db = {
    objectStoreNames: { contains: (name) => stores[name] !== undefined },
    transaction: (storeName, _mode) => {
      const store = stores[storeName];
      return {
        objectStore: () => ({
          put: async (record) =>
            store.set(record[storeName === PRICES_STORE ? 'id' : 'key'], record),
        }),
        done: Promise.resolve(),
      };
    },
    getAll: async (storeName) => Array.from(stores[storeName].values()),
    get: async (storeName, key) => stores[storeName].get(key) || undefined,
    put: async (storeName, record) => {
      const keyPath = storeName === PRICES_STORE ? 'id' : 'key';
      stores[storeName].set(record[keyPath], record);
    },
    clear: async (storeName) => stores[storeName].clear(),
  };

  const openDB = async (name, version, { upgrade } = {}) => {
    if (upgrade) {
      upgrade(db);
    }
    return db;
  };

  return { db, openDB, stores };
}

describe('db.js', () => {
  describe('getDatabase', () => {
    it('should call openDB with correct name and version', async () => {
      const { openDB } = createMockDB();
      const spy = jest.fn(openDB);
      await getDatabase(spy);
      expect(spy).toHaveBeenCalledWith(DB_NAME, DB_VERSION, expect.any(Object));
    });

    it('should create object stores on upgrade', async () => {
      const createdStores = [];
      const mockOpenDB = async (_name, _version, { upgrade }) => {
        const mockDb = {
          objectStoreNames: { contains: () => false },
          createObjectStore: (name, opts) => {
            createdStores.push({ name, opts });
          },
        };
        upgrade(mockDb);
        return mockDb;
      };

      await getDatabase(mockOpenDB);
      expect(createdStores).toHaveLength(2);
      expect(createdStores[0].name).toBe(PRICES_STORE);
      expect(createdStores[1].name).toBe(META_STORE);
    });

    it('should not recreate existing stores', async () => {
      const createdStores = [];
      const mockOpenDB = async (_name, _version, { upgrade }) => {
        const mockDb = {
          objectStoreNames: { contains: () => true },
          createObjectStore: (name, opts) => {
            createdStores.push({ name, opts });
          },
        };
        upgrade(mockDb);
        return mockDb;
      };

      await getDatabase(mockOpenDB);
      expect(createdStores).toHaveLength(0);
    });
  });

  describe('storePrices', () => {
    it('should store multiple price records', async () => {
      const { db, stores } = createMockDB();
      const records = [
        { id: '20240101_euro95', date: '20240101', fuel: 'euro95', price: 1.95 },
        { id: '20240101_diesel', date: '20240101', fuel: 'diesel', price: 1.85 },
      ];

      await storePrices(db, records);
      expect(stores[PRICES_STORE].size).toBe(2);
      expect(stores[PRICES_STORE].get('20240101_euro95').price).toBe(1.95);
    });

    it('should overwrite existing records with same id', async () => {
      const { db, stores } = createMockDB();
      await storePrices(db, [
        { id: '20240101_euro95', date: '20240101', fuel: 'euro95', price: 1.95 },
      ]);
      await storePrices(db, [
        { id: '20240101_euro95', date: '20240101', fuel: 'euro95', price: 2.0 },
      ]);
      expect(stores[PRICES_STORE].size).toBe(1);
      expect(stores[PRICES_STORE].get('20240101_euro95').price).toBe(2.0);
    });

    it('should handle empty records array', async () => {
      const { db, stores } = createMockDB();
      await storePrices(db, []);
      expect(stores[PRICES_STORE].size).toBe(0);
    });
  });

  describe('getAllPrices', () => {
    it('should return all stored records', async () => {
      const { db } = createMockDB();
      await storePrices(db, [
        { id: '20240101_euro95', date: '20240101', fuel: 'euro95', price: 1.95 },
        { id: '20240102_euro95', date: '20240102', fuel: 'euro95', price: 1.96 },
      ]);

      const result = await getAllPrices(db);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no records exist', async () => {
      const { db } = createMockDB();
      const result = await getAllPrices(db);
      expect(result).toHaveLength(0);
    });
  });

  describe('getLastFetchedDate / setLastFetchedDate', () => {
    it('should return null when no date is stored', async () => {
      const { db } = createMockDB();
      const result = await getLastFetchedDate(db);
      expect(result).toBeNull();
    });

    it('should store and retrieve the last fetched date', async () => {
      const { db } = createMockDB();
      await setLastFetchedDate(db, '20240315');
      const result = await getLastFetchedDate(db);
      expect(result).toBe('20240315');
    });

    it('should overwrite previous date', async () => {
      const { db } = createMockDB();
      await setLastFetchedDate(db, '20240101');
      await setLastFetchedDate(db, '20240315');
      const result = await getLastFetchedDate(db);
      expect(result).toBe('20240315');
    });
  });

  describe('clearPrices', () => {
    it('should remove all price records', async () => {
      const { db, stores } = createMockDB();
      await storePrices(db, [
        { id: '20240101_euro95', date: '20240101', fuel: 'euro95', price: 1.95 },
      ]);
      expect(stores[PRICES_STORE].size).toBe(1);

      await clearPrices(db);
      expect(stores[PRICES_STORE].size).toBe(0);
    });
  });
});
