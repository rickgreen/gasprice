/**
 * Integration tests for the CBS OData API client.
 * These tests call the real CBS API and verify the response structure.
 * Run separately from unit tests: npm run test:integration
 */

import { parseObservation, buildUrl, fetchAllPrices, FUEL_NAMES } from '../js/api.js';

const FETCH_TIMEOUT = 30000;

describe('CBS API integration', () => {
  it(
    'should build a URL that returns a 200 response',
    async () => {
      const url = buildUrl();
      const response = await fetch(url);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    },
    FETCH_TIMEOUT,
  );

  it(
    'should build a filtered URL that returns a 200 response',
    async () => {
      const url = buildUrl('20260101');
      const response = await fetch(url);
      expect(response.ok).toBe(true);
    },
    FETCH_TIMEOUT,
  );

  it(
    'should return valid observations with expected fields',
    async () => {
      const url = buildUrl('20260301') + '&$top=9';
      const response = await fetch(url);
      const data = await response.json();

      expect(data.value).toBeDefined();
      expect(data.value.length).toBeGreaterThan(0);

      const obs = data.value[0];
      expect(obs).toHaveProperty('Perioden');
      expect(obs).toHaveProperty('Measure');
      expect(obs).toHaveProperty('Value');
      expect(typeof obs.Perioden).toBe('string');
      expect(obs.Perioden).toMatch(/^\d{8}$/);
    },
    FETCH_TIMEOUT,
  );

  it(
    'should return observations with known measure codes',
    async () => {
      const url = buildUrl('20260301') + '&$top=9';
      const response = await fetch(url);
      const data = await response.json();

      const measures = new Set(data.value.map((obs) => obs.Measure));
      const knownMeasures = new Set(Object.keys(FUEL_NAMES));

      // Every returned measure should be in our known set
      for (const m of measures) {
        expect(knownMeasures.has(m)).toBe(true);
      }
    },
    FETCH_TIMEOUT,
  );

  it(
    'should parse real observations into valid records',
    async () => {
      const url = buildUrl('20260301') + '&$top=9';
      const response = await fetch(url);
      const data = await response.json();

      const records = data.value.map(parseObservation).filter(Boolean);
      expect(records.length).toBeGreaterThan(0);

      for (const record of records) {
        expect(record.id).toMatch(/^\d{8}_(euro95|diesel|lpg)$/);
        expect(record.date).toMatch(/^\d{8}$/);
        expect(['euro95', 'diesel', 'lpg']).toContain(record.fuel);
        expect(typeof record.price).toBe('number');
        expect(record.price).toBeGreaterThan(0);
      }
    },
    FETCH_TIMEOUT,
  );

  it(
    'should fetch a small date range with fetchAllPrices',
    async () => {
      // Fetch only last month to keep it fast
      const records = await fetchAllPrices({ fromDate: '20260301' });
      expect(records.length).toBeGreaterThan(0);

      const fuels = new Set(records.map((r) => r.fuel));
      expect(fuels.has('euro95')).toBe(true);
      expect(fuels.has('diesel')).toBe(true);
      expect(fuels.has('lpg')).toBe(true);
    },
    FETCH_TIMEOUT,
  );
});
