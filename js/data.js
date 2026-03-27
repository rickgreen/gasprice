/**
 * Data orchestration layer.
 * Determines which data to fetch, retrieves it from CBS, and stores it in IndexedDB.
 * @module data
 */

import {
  getDatabase,
  storePrices,
  getAllPrices,
  getLastFetchedDate,
  setLastFetchedDate,
} from './db.js';
import { fetchAllPrices } from './api.js';

/**
 * Determines the date range that needs to be fetched based on what is already stored.
 * @param {string|null} lastFetchedDate - The last date stored in IndexedDB (YYYYMMDD format) or null
 * @returns {{fromDate: string|null, isIncremental: boolean}} Fetch parameters
 */
export function determineFetchRange(lastFetchedDate) {
  if (!lastFetchedDate) {
    return { fromDate: null, isIncremental: false };
  }
  return { fromDate: lastFetchedDate, isIncremental: true };
}

/**
 * Loads all price data, fetching from CBS if needed and storing in IndexedDB.
 * On first load: fetches all historical data.
 * On subsequent loads: fetches only data since last fetch date.
 * @param {Object} options - Load options
 * @param {Function} options.openDB - The idb openDB function
 * @param {Function} [options.onProgress] - Progress callback: {year, month, count, isIncremental}
 * @param {Function} [options.fetchFn=fetch] - Fetch implementation (injectable for testing)
 * @returns {Promise<Array<{id: string, date: string, fuel: string, price: number}>>} All price records
 */
export async function loadPriceData({ openDB, onProgress, fetchFn = fetch }) {
  const db = await getDatabase(openDB);

  const lastFetchedDate = await getLastFetchedDate(db);
  const { fromDate, isIncremental } = determineFetchRange(lastFetchedDate);

  const newRecords = await fetchAllPrices({
    fromDate,
    fetchFn,
    onProgress: onProgress ? (info) => onProgress({ ...info, isIncremental }) : undefined,
  });

  if (newRecords.length > 0) {
    await storePrices(db, newRecords);

    // Update lastFetchedDate to the most recent date in the new data
    const latestDate = newRecords.reduce(
      (max, r) => (r.date > max ? r.date : max),
      newRecords[0].date,
    );
    await setLastFetchedDate(db, latestDate);
  }

  const allRecords = await getAllPrices(db);
  return allRecords;
}

/**
 * Groups price records by fuel type for charting.
 * @param {Array<{id: string, date: string, fuel: string, price: number}>} records - All price records
 * @returns {Record<string, Array<{date: Date, price: number}>>} Records grouped by fuel type, with parsed dates
 */
export function groupByFuel(records) {
  const grouped = { euro95: [], diesel: [], lpg: [] };

  for (const record of records) {
    if (!grouped[record.fuel]) {
      continue;
    }

    const year = parseInt(record.date.substring(0, 4), 10);
    const month = parseInt(record.date.substring(4, 6), 10) - 1;
    const day = parseInt(record.date.substring(6, 8), 10);

    grouped[record.fuel].push({
      date: new Date(year, month, day),
      price: record.price,
    });
  }

  // Sort each group by date
  for (const fuel of Object.keys(grouped)) {
    grouped[fuel].sort((a, b) => a.date - b.date);
  }

  return grouped;
}
