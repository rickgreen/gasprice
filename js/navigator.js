/**
 * D3.js navigator (mini overview) module.
 * Renders a small chart with a draggable brush for selecting time ranges.
 * @module navigator
 */

/* global d3 */

import { FUEL_COLORS } from './chart.js';

/** @type {Object} Navigator margin configuration */
const NAV_MARGIN = { top: 5, right: 20, bottom: 20, left: 50 };

/** @type {number} Navigator chart height */
const NAV_HEIGHT = 80;

/**
 * Creates the navigator (mini overview) chart with brush selection.
 * @param {Object} options - Navigator options
 * @param {string} options.containerId - DOM element ID for the navigator container
 * @param {Record<string, Array<{date: Date, price: number}>>} options.data - Price data grouped by fuel
 * @param {Set<string>} options.visibleFuels - Set of fuel types to display
 * @param {Function} options.onBrush - Callback when brush selection changes: ([Date, Date]) => void
 * @returns {Object} Navigator API with update methods
 */
export function createNavigator({ containerId, data, visibleFuels, onBrush }) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const width = container.clientWidth;
  const innerWidth = width - NAV_MARGIN.left - NAV_MARGIN.right;
  const innerHeight = NAV_HEIGHT - NAV_MARGIN.top - NAV_MARGIN.bottom;

  const svg = d3
    .select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', NAV_HEIGHT)
    .attr('viewBox', `0 0 ${width} ${NAV_HEIGHT}`);

  const g = svg.append('g').attr('transform', `translate(${NAV_MARGIN.left},${NAV_MARGIN.top})`);

  // Scales over full data range
  const allDates = Object.values(data).flatMap((d) => d.map((p) => p.date));
  const allPrices = Object.values(data).flatMap((d) => d.map((p) => p.price));

  const xScale = d3.scaleTime().domain(d3.extent(allDates)).range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(allPrices) * 1.05])
    .range([innerHeight, 0]);

  // Mini x-axis
  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(d3.timeYear).tickFormat(d3.timeFormat('%Y')));

  // Line generator
  const line = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.price))
    .curve(d3.curveMonotoneX);

  // Draw lines
  const paths = {};
  for (const fuel of Object.keys(data)) {
    paths[fuel] = g
      .append('path')
      .datum(data[fuel])
      .attr('fill', 'none')
      .attr('stroke', FUEL_COLORS[fuel])
      .attr('stroke-width', 1)
      .attr('opacity', 0.7)
      .attr('d', line)
      .style('display', visibleFuels.has(fuel) ? null : 'none');
  }

  // Brush
  const brush = d3
    .brushX()
    .extent([
      [0, 0],
      [innerWidth, innerHeight],
    ])
    .on('brush end', (event) => {
      if (!event.selection) {
        return;
      }
      const [x0, x1] = event.selection.map(xScale.invert);
      onBrush([x0, x1]);
    });

  const brushGroup = g.append('g').attr('class', 'brush').call(brush);

  // Set initial brush to last 2 years
  const fullExtent = d3.extent(allDates);
  const twoYearsAgo = new Date(fullExtent[1]);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const initialStart = twoYearsAgo < fullExtent[0] ? fullExtent[0] : twoYearsAgo;

  brushGroup.call(brush.move, [xScale(initialStart), xScale(fullExtent[1])]);

  return {
    /**
     * Toggles visibility of a fuel type in the navigator.
     * @param {string} fuel - Fuel type
     * @param {boolean} visible - Whether to show
     */
    setFuelVisible(fuel, visible) {
      if (paths[fuel]) {
        paths[fuel].style('display', visible ? null : 'none');
      }
    },
    /**
     * Returns the x scale for external use.
     * @returns {d3.ScaleTime} The navigator x scale
     */
    getXScale() {
      return xScale;
    },
  };
}
