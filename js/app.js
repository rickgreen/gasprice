/**
 * Application entry point.
 * Initializes data loading, renders charts, and wires up user interactions.
 * @module app
 */

/* global idb */

import { loadPriceData, groupByFuel } from './data.js';
import { createMainChart } from './chart.js';
import { createNavigator } from './navigator.js';
import { updatePriceCards } from './prices.js';

/** @type {string[]} Month names for loader display */
const MONTH_NAMES = [
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
 * Shows or hides the loading overlay.
 * @param {boolean} visible - Whether the loader should be visible
 */
function setLoaderVisible(visible) {
  const loader = document.getElementById('loader');
  if (visible) {
    loader.classList.remove('hidden');
  } else {
    loader.classList.add('hidden');
  }
}

/**
 * Updates the loader text with progress information.
 * @param {string} text - Progress text to display
 */
function setLoaderText(text) {
  const el = document.getElementById('loader-text');
  if (el) {
    el.textContent = text;
  }
}

/**
 * Shows the main UI sections after data has loaded.
 */
function showUI() {
  const sections = ['price-cards', 'fuel-toggles', 'chart-container', 'navigator-container'];
  for (const id of sections) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden');
    }
  }
}

/**
 * Formats a progress callback into a readable loader message.
 * @param {Object} info - Progress info from the data layer
 * @param {string} info.year - Year being fetched
 * @param {string} info.month - Month being fetched (01-12)
 * @param {number} info.count - Total records fetched so far
 * @param {boolean} info.isIncremental - Whether this is an incremental update
 * @returns {string} Formatted progress message
 */
function formatProgress(info) {
  const monthName = MONTH_NAMES[parseInt(info.month, 10) - 1] || info.month;

  if (info.isIncremental) {
    return `Bijwerken: ${monthName} ${info.year}...`;
  }
  return `Ophalen: ${monthName} ${info.year}... (${info.count} records)`;
}

/**
 * Initializes the application.
 * Loads data, renders charts, and sets up event listeners.
 */
async function init() {
  try {
    setLoaderVisible(true);
    setLoaderText('Data ophalen...');

    const records = await loadPriceData({
      openDB: idb.openDB,
      onProgress: (info) => setLoaderText(formatProgress(info)),
    });

    if (records.length === 0) {
      setLoaderText('Geen data beschikbaar. Controleer de CBS API verbinding.');
      return;
    }

    const groupedData = groupByFuel(records);

    setLoaderVisible(false);
    showUI();

    // Update price cards
    updatePriceCards(groupedData);

    // Track which fuels are visible
    const visibleFuels = new Set(['euro95', 'diesel', 'lpg']);

    // Create charts
    let updateMainDomain;

    const mainChart = createMainChart({
      containerId: 'main-chart',
      data: groupedData,
      visibleFuels,
      onBrushUpdate: (fn) => {
        updateMainDomain = fn;
      },
    });

    const navigator = createNavigator({
      containerId: 'navigator-chart',
      data: groupedData,
      visibleFuels,
      onBrush: (domain) => {
        if (updateMainDomain) {
          updateMainDomain(domain);
        }
      },
    });

    // Wire up fuel toggles
    const toggles = document.querySelectorAll('.fuel-toggles input[type="checkbox"]');
    for (const toggle of toggles) {
      toggle.addEventListener('change', (event) => {
        const fuel = event.target.dataset.fuel;
        const visible = event.target.checked;

        mainChart.setFuelVisible(fuel, visible);
        navigator.setFuelVisible(fuel, visible);
      });
    }
  } catch (error) {
    setLoaderText(`Fout bij laden: ${error.message}`);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
