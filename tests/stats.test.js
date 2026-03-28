/**
 * Unit tests for the statistics and formatting utilities module.
 */

import {
  formatDateDutch,
  findMin,
  findMax,
  computeHistoricalStats,
  computePeriodStats,
  DUTCH_MONTHS,
} from '../js/stats.js';

describe('stats.js', () => {
  describe('formatDateDutch', () => {
    it('should format a date in Dutch notation', () => {
      const date = new Date(2026, 2, 23); // March 23, 2026
      expect(formatDateDutch(date)).toBe('23 maart 2026');
    });

    it('should handle January correctly', () => {
      const date = new Date(2006, 0, 1);
      expect(formatDateDutch(date)).toBe('1 januari 2006');
    });

    it('should handle December correctly', () => {
      const date = new Date(2025, 11, 31);
      expect(formatDateDutch(date)).toBe('31 december 2025');
    });

    it('should handle single-digit days', () => {
      const date = new Date(2024, 5, 5);
      expect(formatDateDutch(date)).toBe('5 juni 2024');
    });

    it('should export all 12 Dutch month names', () => {
      expect(DUTCH_MONTHS).toHaveLength(12);
      expect(DUTCH_MONTHS[0]).toBe('januari');
      expect(DUTCH_MONTHS[11]).toBe('december');
    });
  });

  describe('findMin', () => {
    it('should find the record with the lowest price', () => {
      const records = [
        { date: new Date(2024, 0, 1), price: 1.95 },
        { date: new Date(2024, 0, 2), price: 1.82 },
        { date: new Date(2024, 0, 3), price: 1.9 },
      ];
      const result = findMin(records);
      expect(result.price).toBe(1.82);
      expect(result.date).toEqual(new Date(2024, 0, 2));
    });

    it('should return the first record when all prices are equal', () => {
      const records = [
        { date: new Date(2024, 0, 1), price: 1.5 },
        { date: new Date(2024, 0, 2), price: 1.5 },
      ];
      const result = findMin(records);
      expect(result.date).toEqual(new Date(2024, 0, 1));
    });

    it('should handle single record', () => {
      const records = [{ date: new Date(2024, 0, 1), price: 1.95 }];
      expect(findMin(records).price).toBe(1.95);
    });
  });

  describe('findMax', () => {
    it('should find the record with the highest price', () => {
      const records = [
        { date: new Date(2024, 0, 1), price: 1.95 },
        { date: new Date(2024, 0, 2), price: 2.1 },
        { date: new Date(2024, 0, 3), price: 1.9 },
      ];
      const result = findMax(records);
      expect(result.price).toBe(2.1);
      expect(result.date).toEqual(new Date(2024, 0, 2));
    });

    it('should return the first record when all prices are equal', () => {
      const records = [
        { date: new Date(2024, 0, 1), price: 1.5 },
        { date: new Date(2024, 0, 2), price: 1.5 },
      ];
      const result = findMax(records);
      expect(result.date).toEqual(new Date(2024, 0, 1));
    });

    it('should handle single record', () => {
      const records = [{ date: new Date(2024, 0, 1), price: 0.74 }];
      expect(findMax(records).price).toBe(0.74);
    });
  });

  describe('computeHistoricalStats', () => {
    const groupedData = {
      euro95: [
        { date: new Date(2006, 0, 1), price: 1.2 },
        { date: new Date(2022, 5, 15), price: 2.5 },
        { date: new Date(2024, 0, 1), price: 1.95 },
      ],
      diesel: [
        { date: new Date(2006, 0, 1), price: 1.0 },
        { date: new Date(2022, 5, 15), price: 2.3 },
      ],
      lpg: [],
    };

    it('should compute min and max for each fuel type', () => {
      const stats = computeHistoricalStats(groupedData);
      expect(stats.euro95.min.price).toBe(1.2);
      expect(stats.euro95.max.price).toBe(2.5);
      expect(stats.diesel.min.price).toBe(1.0);
      expect(stats.diesel.max.price).toBe(2.3);
    });

    it('should skip empty fuel types', () => {
      const stats = computeHistoricalStats(groupedData);
      expect(stats.lpg).toBeUndefined();
    });

    it('should include dates with min/max', () => {
      const stats = computeHistoricalStats(groupedData);
      expect(stats.euro95.min.date).toEqual(new Date(2006, 0, 1));
      expect(stats.euro95.max.date).toEqual(new Date(2022, 5, 15));
    });
  });

  describe('computePeriodStats', () => {
    const groupedData = {
      euro95: [
        { date: new Date(2024, 0, 1), price: 1.9 },
        { date: new Date(2024, 3, 1), price: 2.0 },
        { date: new Date(2024, 6, 1), price: 1.85 },
        { date: new Date(2024, 9, 1), price: 2.1 },
      ],
      diesel: [
        { date: new Date(2024, 0, 1), price: 1.7 },
        { date: new Date(2024, 6, 1), price: 1.65 },
      ],
      lpg: [],
    };

    it('should compute stats for the given period', () => {
      const start = new Date(2024, 2, 1); // March
      const end = new Date(2024, 8, 30); // September
      const stats = computePeriodStats(groupedData, start, end);

      expect(stats.euro95.min.price).toBe(1.85);
      expect(stats.euro95.max.price).toBe(2.0);
    });

    it('should return null for fuel types with no data in period', () => {
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 11, 31);
      const stats = computePeriodStats(groupedData, start, end);

      expect(stats.euro95).toBeNull();
      expect(stats.diesel).toBeNull();
    });

    it('should return null for empty fuel arrays', () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 11, 31);
      const stats = computePeriodStats(groupedData, start, end);

      expect(stats.lpg).toBeNull();
    });

    it('should include boundary dates in filtering', () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 6, 1);
      const stats = computePeriodStats(groupedData, start, end);

      // Both Jan 1 and Jul 1 should be included
      expect(stats.euro95.min.price).toBe(1.85);
      expect(stats.euro95.max.price).toBe(2.0);
      expect(stats.diesel.min.price).toBe(1.65);
    });
  });
});
