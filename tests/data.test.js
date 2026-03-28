/**
 * Unit tests for the data orchestration module.
 */

import { determineFetchRange, groupByFuel, loadPriceData } from '../js/data.js';

/**
 * Creates a mock openDB that returns a fake database with in-memory stores.
 * @param {Object} [options] - Options for the mock
 * @param {string|null} [options.lastFetchedDate=null] - Pre-set lastFetchedDate
 * @param {Array} [options.existingPrices=[]] - Pre-existing price records
 * @returns {Function} Mock openDB function
 */
function createMockOpenDB({ lastFetchedDate = null, existingPrices = [] } = {}) {
  const pricesStore = new Map();
  const metaStore = new Map();

  for (const p of existingPrices) {
    pricesStore.set(p.id, p);
  }
  if (lastFetchedDate) {
    metaStore.set('lastFetchedDate', { key: 'lastFetchedDate', value: lastFetchedDate });
  }

  return async () => ({
    objectStoreNames: { contains: () => true },
    transaction: (storeName) => ({
      objectStore: () => ({
        put: async (record) => {
          const key = storeName === 'prices' ? record.id : record.key;
          (storeName === 'prices' ? pricesStore : metaStore).set(key, record);
        },
      }),
      done: Promise.resolve(),
    }),
    getAll: async (storeName) =>
      Array.from((storeName === 'prices' ? pricesStore : metaStore).values()),
    get: async (storeName, key) =>
      (storeName === 'prices' ? pricesStore : metaStore).get(key) || undefined,
    put: async (storeName, record) => {
      const k = storeName === 'prices' ? record.id : record.key;
      (storeName === 'prices' ? pricesStore : metaStore).set(k, record);
    },
    clear: async (storeName) => (storeName === 'prices' ? pricesStore : metaStore).clear(),
    _stores: { pricesStore, metaStore },
  });
}

describe('data.js', () => {
  describe('loadPriceData', () => {
    it('should do a full fetch when no data exists', async () => {
      const mockOpenDB = createMockOpenDB();
      const mockFetch = async () => ({
        ok: true,
        json: async () => ({
          value: [
            { Perioden: '20240101', Measure: 'A047220', Value: 1.95 },
            { Perioden: '20240102', Measure: 'A047219', Value: 1.85 },
          ],
        }),
      });

      const records = await loadPriceData({ openDB: mockOpenDB, fetchFn: mockFetch });
      expect(records.length).toBeGreaterThanOrEqual(2);
    });

    it('should do an incremental fetch when data exists', async () => {
      const mockOpenDB = createMockOpenDB({
        lastFetchedDate: '20240101',
        existingPrices: [{ id: '20240101_euro95', date: '20240101', fuel: 'euro95', price: 1.95 }],
      });

      let calledUrl = '';
      const mockFetch = async (url) => {
        calledUrl = url;
        return {
          ok: true,
          json: async () => ({
            value: [{ Perioden: '20240102', Measure: 'A047220', Value: 1.96 }],
          }),
        };
      };

      const records = await loadPriceData({ openDB: mockOpenDB, fetchFn: mockFetch });
      expect(calledUrl).toContain("Perioden ge '20240101'");
      expect(records.length).toBeGreaterThanOrEqual(2);
    });

    it('should call onProgress with isIncremental flag', async () => {
      const mockOpenDB = createMockOpenDB();
      const progressCalls = [];
      const mockFetch = async () => ({
        ok: true,
        json: async () => ({
          value: [{ Perioden: '20240315', Measure: 'A047220', Value: 1.95 }],
        }),
      });

      await loadPriceData({
        openDB: mockOpenDB,
        fetchFn: mockFetch,
        onProgress: (info) => progressCalls.push(info),
      });

      expect(progressCalls).toHaveLength(1);
      expect(progressCalls[0].isIncremental).toBe(false);
    });

    it('should handle empty API response gracefully', async () => {
      const mockOpenDB = createMockOpenDB();
      const mockFetch = async () => ({
        ok: true,
        json: async () => ({ value: [] }),
      });

      const records = await loadPriceData({ openDB: mockOpenDB, fetchFn: mockFetch });
      expect(records).toHaveLength(0);
    });
  });

  describe('determineFetchRange', () => {
    it('should return full fetch when no last date exists', () => {
      const result = determineFetchRange(null);
      expect(result).toEqual({ fromDate: null, isIncremental: false });
    });

    it('should return incremental fetch with fromDate when last date exists', () => {
      const result = determineFetchRange('20240101');
      expect(result).toEqual({ fromDate: '20240101', isIncremental: true });
    });

    it('should handle empty string as no last date', () => {
      const result = determineFetchRange('');
      expect(result).toEqual({ fromDate: null, isIncremental: false });
    });
  });

  describe('groupByFuel', () => {
    it('should group records by fuel type', () => {
      const records = [
        { id: '20240101_euro95', date: '20240101', fuel: 'euro95', price: 1.95 },
        { id: '20240101_diesel', date: '20240101', fuel: 'diesel', price: 1.85 },
        { id: '20240101_lpg', date: '20240101', fuel: 'lpg', price: 0.74 },
        { id: '20240102_euro95', date: '20240102', fuel: 'euro95', price: 1.96 },
      ];

      const grouped = groupByFuel(records);
      expect(grouped.euro95).toHaveLength(2);
      expect(grouped.diesel).toHaveLength(1);
      expect(grouped.lpg).toHaveLength(1);
    });

    it('should parse dates correctly', () => {
      const records = [{ id: '20240315_euro95', date: '20240315', fuel: 'euro95', price: 1.95 }];
      const grouped = groupByFuel(records);
      const entry = grouped.euro95[0];
      expect(entry.date.getFullYear()).toBe(2024);
      expect(entry.date.getMonth()).toBe(2); // March = 2
      expect(entry.date.getDate()).toBe(15);
    });

    it('should sort records by date within each group', () => {
      const records = [
        { id: '20240315_euro95', date: '20240315', fuel: 'euro95', price: 1.96 },
        { id: '20240101_euro95', date: '20240101', fuel: 'euro95', price: 1.95 },
        { id: '20240601_euro95', date: '20240601', fuel: 'euro95', price: 1.97 },
      ];

      const grouped = groupByFuel(records);
      expect(grouped.euro95[0].date < grouped.euro95[1].date).toBe(true);
      expect(grouped.euro95[1].date < grouped.euro95[2].date).toBe(true);
    });

    it('should return empty arrays when no records exist', () => {
      const grouped = groupByFuel([]);
      expect(grouped.euro95).toHaveLength(0);
      expect(grouped.diesel).toHaveLength(0);
      expect(grouped.lpg).toHaveLength(0);
    });

    it('should skip unknown fuel types', () => {
      const records = [{ id: '20240101_kerosine', date: '20240101', fuel: 'kerosine', price: 1.5 }];
      const grouped = groupByFuel(records);
      expect(grouped.euro95).toHaveLength(0);
      expect(grouped.diesel).toHaveLength(0);
      expect(grouped.lpg).toHaveLength(0);
      expect(grouped.kerosine).toBeUndefined();
    });

    it('should preserve price values', () => {
      const records = [{ id: '20240101_diesel', date: '20240101', fuel: 'diesel', price: 1.823 }];
      const grouped = groupByFuel(records);
      expect(grouped.diesel[0].price).toBe(1.823);
    });
  });
});
