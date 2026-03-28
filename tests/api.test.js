/**
 * Unit tests for the CBS OData API client module.
 */

import {
  parseObservation,
  buildUrl,
  fetchAllPrices,
  CBS_BASE_URL,
  FUEL_MEASURES,
  FUEL_NAMES,
} from '../js/api.js';

describe('api.js', () => {
  describe('parseObservation', () => {
    it('should parse a valid Euro 95 observation', () => {
      const obs = { Perioden: '20240115', Measure: 'A047220', Value: 1.954 };
      const result = parseObservation(obs);
      expect(result).toEqual({
        id: '20240115_euro95',
        date: '20240115',
        fuel: 'euro95',
        price: 1.954,
      });
    });

    it('should parse a valid Diesel observation', () => {
      const obs = { Perioden: '20240115', Measure: 'A047219', Value: 1.823 };
      const result = parseObservation(obs);
      expect(result).toEqual({
        id: '20240115_diesel',
        date: '20240115',
        fuel: 'diesel',
        price: 1.823,
      });
    });

    it('should parse a valid LPG observation', () => {
      const obs = { Perioden: '20240115', Measure: 'A047221', Value: 0.742 };
      const result = parseObservation(obs);
      expect(result).toEqual({
        id: '20240115_lpg',
        date: '20240115',
        fuel: 'lpg',
        price: 0.742,
      });
    });

    it('should return null for null observation', () => {
      expect(parseObservation(null)).toBeNull();
    });

    it('should return null for missing Perioden', () => {
      expect(parseObservation({ Measure: 'A047219', Value: 1.5 })).toBeNull();
    });

    it('should return null for missing Measure', () => {
      expect(parseObservation({ Perioden: '20240115', Value: 1.5 })).toBeNull();
    });

    it('should return null for null Value', () => {
      expect(
        parseObservation({ Perioden: '20240115', Measure: 'A047219', Value: null }),
      ).toBeNull();
    });

    it('should return null for unknown measure code', () => {
      expect(parseObservation({ Perioden: '20240115', Measure: 'X999999', Value: 1.5 })).toBeNull();
    });

    it('should accept zero price value', () => {
      const obs = { Perioden: '20240115', Measure: 'A047221', Value: 0 };
      const result = parseObservation(obs);
      expect(result).toEqual({
        id: '20240115_lpg',
        date: '20240115',
        fuel: 'lpg',
        price: 0,
      });
    });
  });

  describe('buildUrl', () => {
    it('should build URL without date filter', () => {
      const url = buildUrl();
      expect(url).toContain(CBS_BASE_URL);
      expect(url).toContain('A047220');
      expect(url).toContain('A047219');
      expect(url).toContain('A047221');
      expect(url).toContain('$orderby=Perioden asc');
      expect(url).not.toContain('Perioden ge');
    });

    it('should build URL with date filter', () => {
      const url = buildUrl('20240101');
      expect(url).toContain("Perioden ge '20240101'");
    });

    it('should include all three fuel types in filter', () => {
      const url = buildUrl();
      for (const measure of FUEL_MEASURES) {
        expect(url).toContain(`Measure eq '${measure}'`);
      }
    });
  });

  describe('fetchAllPrices', () => {
    /**
     * Creates a mock fetch function returning paginated responses.
     * @param {Array<Object>} pages - Array of page response objects
     * @returns {Function} Mock fetch function
     */
    function createMockFetch(pages) {
      let pageIndex = 0;
      return async (_url) => ({
        ok: true,
        json: async () => {
          const page = pages[pageIndex++];
          return page;
        },
      });
    }

    it('should fetch and parse a single page of results', async () => {
      const mockFetch = createMockFetch([
        {
          value: [
            { Perioden: '20240101', Measure: 'A047220', Value: 1.95 },
            { Perioden: '20240101', Measure: 'A047219', Value: 1.85 },
          ],
        },
      ]);

      const records = await fetchAllPrices({ fetchFn: mockFetch });
      expect(records).toHaveLength(2);
      expect(records[0].fuel).toBe('euro95');
      expect(records[1].fuel).toBe('diesel');
    });

    it('should follow pagination links', async () => {
      const mockFetch = createMockFetch([
        {
          value: [{ Perioden: '20240101', Measure: 'A047219', Value: 1.85 }],
          '@odata.nextLink': 'https://next-page',
        },
        {
          value: [{ Perioden: '20240102', Measure: 'A047219', Value: 1.86 }],
        },
      ]);

      const records = await fetchAllPrices({ fetchFn: mockFetch });
      expect(records).toHaveLength(2);
    });

    it('should call onProgress with year, month, and count', async () => {
      const progressCalls = [];
      const mockFetch = createMockFetch([
        {
          value: [{ Perioden: '20240315', Measure: 'A047220', Value: 1.95 }],
        },
      ]);

      await fetchAllPrices({
        fetchFn: mockFetch,
        onProgress: (info) => progressCalls.push(info),
      });

      expect(progressCalls).toHaveLength(1);
      expect(progressCalls[0]).toEqual({ year: '2024', month: '03', count: 1 });
    });

    it('should throw on non-ok response', async () => {
      const mockFetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchAllPrices({ fetchFn: mockFetch })).rejects.toThrow('CBS API error: 500');
    });

    it('should handle empty response', async () => {
      const mockFetch = createMockFetch([{ value: [] }]);
      const records = await fetchAllPrices({ fetchFn: mockFetch });
      expect(records).toHaveLength(0);
    });

    it('should filter out invalid observations', async () => {
      const mockFetch = createMockFetch([
        {
          value: [
            { Perioden: '20240101', Measure: 'A047220', Value: 1.95 },
            { Perioden: '20240101', Measure: 'X999999', Value: 1.0 },
            { Perioden: '20240101', Measure: 'A047219', Value: null },
          ],
        },
      ]);

      const records = await fetchAllPrices({ fetchFn: mockFetch });
      expect(records).toHaveLength(1);
    });

    it('should pass fromDate to the URL builder', async () => {
      let calledUrl = '';
      const mockFetch = async (url) => {
        calledUrl = url;
        return { ok: true, json: async () => ({ value: [] }) };
      };

      await fetchAllPrices({ fromDate: '20240101', fetchFn: mockFetch });
      expect(calledUrl).toContain("Perioden ge '20240101'");
    });
  });

  describe('constants', () => {
    it('should export expected fuel names mapping', () => {
      expect(FUEL_NAMES.A047220).toBe('euro95');
      expect(FUEL_NAMES.A047219).toBe('diesel');
      expect(FUEL_NAMES.A047221).toBe('lpg');
    });
  });
});
