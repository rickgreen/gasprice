/**
 * Price card updater module.
 * Updates the current price display cards with the latest available data.
 * @module prices
 */

/**
 * Updates the price cards in the UI with the most recent prices.
 * @param {Record<string, Array<{date: Date, price: number}>>} groupedData - Data grouped by fuel type
 */
export function updatePriceCards(groupedData) {
  const fuels = ['euro95', 'diesel', 'lpg'];

  for (const fuel of fuels) {
    const element = document.getElementById(`price-${fuel}`);
    if (!element) {
      continue;
    }

    const fuelData = groupedData[fuel];
    if (!fuelData || fuelData.length === 0) {
      element.textContent = '\u2014';
      continue;
    }

    // Data is sorted by date, last entry is the most recent
    const latest = fuelData[fuelData.length - 1];
    element.textContent = latest.price.toFixed(3);
  }
}
