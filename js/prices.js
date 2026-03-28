/**
 * Price card updater module.
 * Updates the current price display cards with the latest available data.
 * @module prices
 */

import { formatDateDutch } from './stats.js';

/**
 * Updates the price cards in the UI with the most recent prices and their dates.
 * @param {Record<string, Array<{date: Date, price: number}>>} groupedData - Data grouped by fuel type
 */
export function updatePriceCards(groupedData) {
  const fuels = ['euro95', 'diesel', 'lpg'];

  for (const fuel of fuels) {
    const priceEl = document.getElementById(`price-${fuel}`);
    const dateEl = document.getElementById(`date-${fuel}`);
    if (!priceEl) {
      continue;
    }

    const fuelData = groupedData[fuel];
    if (!fuelData || fuelData.length === 0) {
      priceEl.textContent = '\u2014';
      if (dateEl) {
        dateEl.textContent = '';
      }
      continue;
    }

    // Data is sorted by date, last entry is the most recent
    const latest = fuelData[fuelData.length - 1];
    priceEl.textContent = latest.price.toFixed(3);
    if (dateEl) {
      dateEl.textContent = formatDateDutch(latest.date);
    }
  }
}
