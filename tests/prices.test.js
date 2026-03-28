/**
 * Unit tests for the price card updater module.
 */

import { updatePriceCards } from '../js/prices.js';

/**
 * Sets up a minimal DOM for price card testing.
 */
function setupDOM() {
  document.body.innerHTML = `
    <span id="price-euro95"></span>
    <span id="date-euro95"></span>
    <span id="price-diesel"></span>
    <span id="date-diesel"></span>
    <span id="price-lpg"></span>
    <span id="date-lpg"></span>
  `;
}

describe('prices.js', () => {
  beforeEach(() => {
    setupDOM();
  });

  describe('updatePriceCards', () => {
    it('should display the latest price for each fuel', () => {
      const groupedData = {
        euro95: [
          { date: new Date(2024, 0, 1), price: 1.9 },
          { date: new Date(2024, 0, 2), price: 1.95 },
        ],
        diesel: [{ date: new Date(2024, 0, 1), price: 1.823 }],
        lpg: [{ date: new Date(2024, 0, 1), price: 0.742 }],
      };

      updatePriceCards(groupedData);

      expect(document.getElementById('price-euro95').textContent).toBe('1.950');
      expect(document.getElementById('price-diesel').textContent).toBe('1.823');
      expect(document.getElementById('price-lpg').textContent).toBe('0.742');
    });

    it('should display the date in Dutch notation', () => {
      const groupedData = {
        euro95: [{ date: new Date(2026, 2, 23), price: 1.95 }],
        diesel: [{ date: new Date(2026, 2, 23), price: 1.85 }],
        lpg: [{ date: new Date(2026, 2, 23), price: 0.74 }],
      };

      updatePriceCards(groupedData);

      expect(document.getElementById('date-euro95').textContent).toBe('23 maart 2026');
      expect(document.getElementById('date-diesel').textContent).toBe('23 maart 2026');
      expect(document.getElementById('date-lpg').textContent).toBe('23 maart 2026');
    });

    it('should show dash for empty fuel data', () => {
      const groupedData = {
        euro95: [],
        diesel: [],
        lpg: [],
      };

      updatePriceCards(groupedData);

      expect(document.getElementById('price-euro95').textContent).toBe('\u2014');
      expect(document.getElementById('date-euro95').textContent).toBe('');
    });

    it('should handle missing fuel keys gracefully', () => {
      updatePriceCards({});
      // Missing keys are treated as empty — dash is shown
      expect(document.getElementById('price-euro95').textContent).toBe('\u2014');
      expect(document.getElementById('date-euro95').textContent).toBe('');
    });
  });
});
