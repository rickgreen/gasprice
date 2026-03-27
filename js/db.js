/**
 * IndexedDB wrapper for gas price data persistence.
 * Uses the idb library for a promise-based API.
 * @module db
 */

/** @type {string} Database name */
const DB_NAME = 'gasprice';

/** @type {number} Database version */
const DB_VERSION = 1;

/** @type {string} Object store for price records */
const PRICES_STORE = 'prices';

/** @type {string} Object store for metadata */
const META_STORE = 'meta';

/**
 * Opens the IndexedDB database, creating object stores if needed.
 * @param {Function} openDB - The idb openDB function (injected for testability)
 * @returns {Promise<import('idb').IDBPDatabase>} The opened database instance
 */
export async function getDatabase(openDB) {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PRICES_STORE)) {
        db.createObjectStore(PRICES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    },
  });
}

/**
 * Stores an array of price records in IndexedDB.
 * Each record must have an `id` property (composite of date + fuel type).
 * @param {import('idb').IDBPDatabase} db - The database instance
 * @param {Array<{id: string, date: string, fuel: string, price: number}>} records - Price records to store
 * @returns {Promise<void>}
 */
export async function storePrices(db, records) {
  const tx = db.transaction(PRICES_STORE, 'readwrite');
  const store = tx.objectStore(PRICES_STORE);
  for (const record of records) {
    await store.put(record);
  }
  await tx.done;
}

/**
 * Retrieves all price records from IndexedDB.
 * @param {import('idb').IDBPDatabase} db - The database instance
 * @returns {Promise<Array<{id: string, date: string, fuel: string, price: number}>>} All stored price records
 */
export async function getAllPrices(db) {
  return db.getAll(PRICES_STORE);
}

/**
 * Retrieves the last fetched date from the meta store.
 * @param {import('idb').IDBPDatabase} db - The database instance
 * @returns {Promise<string|null>} The last fetched date string (YYYYMMDD) or null if not set
 */
export async function getLastFetchedDate(db) {
  const entry = await db.get(META_STORE, 'lastFetchedDate');
  return entry ? entry.value : null;
}

/**
 * Stores the last fetched date in the meta store.
 * @param {import('idb').IDBPDatabase} db - The database instance
 * @param {string} date - The date string (YYYYMMDD format)
 * @returns {Promise<void>}
 */
export async function setLastFetchedDate(db, date) {
  await db.put(META_STORE, { key: 'lastFetchedDate', value: date });
}

/**
 * Clears all price records from IndexedDB.
 * Useful for full re-sync scenarios.
 * @param {import('idb').IDBPDatabase} db - The database instance
 * @returns {Promise<void>}
 */
export async function clearPrices(db) {
  await db.clear(PRICES_STORE);
}

export { DB_NAME, DB_VERSION, PRICES_STORE, META_STORE };
