/**
 * Statistics and formatting utilities for fuel price data.
 * Pure functions with no DOM dependencies — fully unit-testable.
 * @module stats
 */

/** @type {string[]} Dutch month names for date formatting */
const DUTCH_MONTHS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
];

/**
 * Formats a Date object to Dutch notation (e.g. "23 maart 2026").
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateDutch(date) {
  const day = date.getDate();
  const month = DUTCH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Finds the record with the minimum price in an array.
 * @param {Array<{date: Date, price: number}>} records - Price records (must be non-empty)
 * @returns {{date: Date, price: number}} The record with the lowest price
 */
export function findMin(records) {
  let min = records[0];
  for (let i = 1; i < records.length; i++) {
    if (records[i].price < min.price) {
      min = records[i];
    }
  }
  return min;
}

/**
 * Finds the record with the maximum price in an array.
 * @param {Array<{date: Date, price: number}>} records - Price records (must be non-empty)
 * @returns {{date: Date, price: number}} The record with the highest price
 */
export function findMax(records) {
  let max = records[0];
  for (let i = 1; i < records.length; i++) {
    if (records[i].price > max.price) {
      max = records[i];
    }
  }
  return max;
}

/**
 * Computes historical statistics (all-time min/max) for each fuel type.
 * @param {Record<string, Array<{date: Date, price: number}>>} groupedData - Data grouped by fuel
 * @returns {Record<string, {min: {date: Date, price: number}, max: {date: Date, price: number}}>} Stats per fuel type
 */
export function computeHistoricalStats(groupedData) {
  const stats = {};
  for (const fuel of Object.keys(groupedData)) {
    const data = groupedData[fuel];
    if (!data || data.length === 0) {
      continue;
    }
    stats[fuel] = { min: findMin(data), max: findMax(data) };
  }
  return stats;
}

/**
 * Filters records to a date range and computes min/max for each fuel type.
 * @param {Record<string, Array<{date: Date, price: number}>>} groupedData - Data grouped by fuel
 * @param {Date} start - Start of period (inclusive)
 * @param {Date} end - End of period (inclusive)
 * @returns {Record<string, {min: {date: Date, price: number}, max: {date: Date, price: number}}|null>} Stats per fuel or null if no data in range
 */
export function computePeriodStats(groupedData, start, end) {
  const stats = {};
  for (const fuel of Object.keys(groupedData)) {
    const filtered = groupedData[fuel].filter((d) => d.date >= start && d.date <= end);
    if (filtered.length === 0) {
      stats[fuel] = null;
      continue;
    }
    stats[fuel] = { min: findMin(filtered), max: findMax(filtered) };
  }
  return stats;
}

export { DUTCH_MONTHS };
