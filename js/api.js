/**
 * CBS OData v4 API client for fuel price data.
 * Fetches observations from table 80416NED with pagination support.
 * @module api
 */

/** @type {string} Base URL for CBS OData observations */
const CBS_BASE_URL = 'https://datasets.cbs.nl/odata/v1/CBS/80416ned/Observations';

/** @type {string[]} Measure codes for the three fuel types */
const FUEL_MEASURES = ['A047220', 'A047219', 'A047221'];

/** @type {Record<string, string>} Maps CBS measure codes to readable fuel names */
const FUEL_NAMES = {
  A047220: 'euro95',
  A047219: 'diesel',
  A047221: 'lpg',
};

/**
 * Parses a single CBS OData observation into a price record.
 * @param {Object} obs - Raw observation from CBS API
 * @param {string} obs.Perioden - Date string in YYYYMMDD format
 * @param {string} obs.Measure - CBS measure code (e.g., 'BenzineEuro95_1')
 * @param {number|null} obs.Value - Price in euros per liter, or null if unavailable
 * @returns {{id: string, date: string, fuel: string, price: number}|null} Parsed record or null if invalid
 */
export function parseObservation(obs) {
  if (!obs || !obs.Perioden || !obs.Measure || obs.Value === null || obs.Value === undefined) {
    return null;
  }

  const fuel = FUEL_NAMES[obs.Measure];
  if (!fuel) {
    return null;
  }

  return {
    id: `${obs.Perioden}_${fuel}`,
    date: obs.Perioden,
    fuel,
    price: obs.Value,
  };
}

/**
 * Builds the CBS OData URL with optional date filter.
 * @param {string|null} [fromDate=null] - Start date filter in YYYYMMDD format
 * @returns {string} The constructed URL with query parameters
 */
export function buildUrl(fromDate = null) {
  const filter = FUEL_MEASURES.map((m) => `Measure eq '${m}'`).join(' or ');
  let url = `${CBS_BASE_URL}?$filter=(${filter})`;

  if (fromDate) {
    url += ` and Perioden ge '${fromDate}'`;
  }

  url += '&$orderby=Perioden asc';
  return url;
}

/**
 * Fetches all fuel price data from CBS with pagination.
 * Follows OData @odata.nextLink for subsequent pages.
 * @param {Object} options - Fetch options
 * @param {string|null} [options.fromDate=null] - Only fetch data from this date onwards (YYYYMMDD)
 * @param {Function} [options.onProgress] - Callback receiving progress info per page: {year, month, count}
 * @param {Function} [options.fetchFn=fetch] - Fetch implementation (injectable for testing)
 * @returns {Promise<Array<{id: string, date: string, fuel: string, price: number}>>} All parsed price records
 */
export async function fetchAllPrices({ fromDate = null, onProgress, fetchFn = fetch } = {}) {
  let url = buildUrl(fromDate);
  const allRecords = [];

  while (url) {
    const response = await fetchFn(url);

    if (!response.ok) {
      throw new Error(`CBS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const records = (data.value || []).map(parseObservation).filter(Boolean);

    allRecords.push(...records);

    if (onProgress && records.length > 0) {
      const lastDate = records[records.length - 1].date;
      onProgress({
        year: lastDate.substring(0, 4),
        month: lastDate.substring(4, 6),
        count: allRecords.length,
      });
    }

    url = data['@odata.nextLink'] || null;
  }

  return allRecords;
}

export { CBS_BASE_URL, FUEL_MEASURES, FUEL_NAMES };
