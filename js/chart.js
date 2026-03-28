/**
 * D3.js main chart module.
 * Renders a line chart with automatic time axis scaling based on zoom level.
 * @module chart
 */

/* global d3 */

/** @type {Object} Color mapping per fuel type */
const FUEL_COLORS = {
  euro95: '#4fc3f7',
  diesel: '#ffb74d',
  lpg: '#81c784',
};

/** @type {Object} Display labels per fuel type */
const FUEL_LABELS = {
  euro95: 'Euro 95',
  diesel: 'Diesel',
  lpg: 'LPG',
};

/** @type {Object} Chart margin configuration */
const MARGIN = { top: 20, right: 20, bottom: 30, left: 50 };

/**
 * Calculates the number of days between two dates.
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {number} Number of days
 */
export function diffDays(start, end) {
  return (end - start) / (1000 * 60 * 60 * 24);
}

/**
 * Determines the appropriate D3 time interval based on the visible time range.
 * Prevents duplicate labels by choosing a granularity that fits the range.
 * @param {Date} start - Start of visible range
 * @param {Date} end - End of visible range
 * @returns {d3.CountableTimeInterval} Appropriate time interval for tick marks
 */
export function getTimeInterval(start, end) {
  const days = diffDays(start, end);

  if (days <= 30) {
    return d3.timeDay.every(2);
  }
  if (days <= 90) {
    return d3.timeWeek;
  }
  if (days <= 365) {
    return d3.timeMonth;
  }
  if (days <= 365 * 3) {
    return d3.timeMonth.every(3);
  }
  if (days <= 365 * 8) {
    return d3.timeYear;
  }
  return d3.timeYear.every(2);
}

/**
 * Formats a date according to the zoom level.
 * Each level returns a unique label format to prevent duplicates.
 * @param {Date} start - Start of visible range
 * @param {Date} end - End of visible range
 * @returns {Function} D3 time format function
 */
export function getTimeFormat(start, end) {
  const days = diffDays(start, end);

  if (days <= 30) {
    return d3.timeFormat('%d %b');
  }
  if (days <= 90) {
    return d3.timeFormat('%d %b');
  }
  if (days <= 365 * 3) {
    return d3.timeFormat('%b %Y');
  }
  return d3.timeFormat('%Y');
}

/**
 * Creates a tooltip element for the chart.
 * @param {HTMLElement} container - Parent container for the tooltip
 * @returns {HTMLElement} The tooltip element
 */
function createTooltip(container) {
  const existing = container.querySelector('.tooltip');
  if (existing) {
    return existing;
  }
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  container.appendChild(tooltip);
  return tooltip;
}

/**
 * Creates and renders the main price chart.
 * @param {Object} options - Chart options
 * @param {string} options.containerId - DOM element ID for the chart container
 * @param {Record<string, Array<{date: Date, price: number}>>} options.data - Price data grouped by fuel
 * @param {Set<string>} options.visibleFuels - Set of fuel types to display
 * @param {Function} [options.onBrushUpdate] - Callback when external brush updates the domain
 * @returns {Object} Chart API with update methods
 */
export function createMainChart({
  containerId,
  data,
  visibleFuels,
  onBrushUpdate,
  onDomainChange,
}) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const width = container.clientWidth;
  const height = 400;
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const svg = d3
    .select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  // Clip path to prevent lines from rendering outside the chart area
  svg
    .append('defs')
    .append('clipPath')
    .attr('id', 'clip-main')
    .append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight);

  // Compute full extent from all data
  const allDates = Object.values(data).flatMap((d) => d.map((p) => p.date));
  const allPrices = Object.values(data).flatMap((d) => d.map((p) => p.price));

  const xScale = d3.scaleTime().domain(d3.extent(allDates)).range([0, innerWidth]);

  const priceMin = d3.min(allPrices);
  const priceMax = d3.max(allPrices);
  const pricePadding = (priceMax - priceMin) * 0.05;

  const yScale = d3
    .scaleLinear()
    .domain([Math.max(0, priceMin - pricePadding), priceMax + pricePadding])
    .range([innerHeight, 0]);

  // Grid lines
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''));

  // Axes
  const xAxisGroup = g
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${innerHeight})`);

  const yAxisGroup = g.append('g').attr('class', 'axis y-axis');

  // Line generator
  const line = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.price))
    .curve(d3.curveMonotoneX);

  // Draw lines per fuel type
  const linesGroup = g.append('g').attr('clip-path', 'url(#clip-main)');

  const paths = {};
  for (const fuel of Object.keys(data)) {
    paths[fuel] = linesGroup
      .append('path')
      .datum(data[fuel])
      .attr('class', `line line-${fuel}`)
      .attr('fill', 'none')
      .attr('stroke', FUEL_COLORS[fuel])
      .attr('stroke-width', 1.5)
      .attr('d', line)
      .style('display', visibleFuels.has(fuel) ? null : 'none');
  }

  // Tooltip
  const tooltip = createTooltip(container);
  const bisect = d3.bisector((d) => d.date).left;

  // Overlay for mouse events
  const overlay = g
    .append('rect')
    .attr('class', 'overlay')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', 'none')
    .attr('pointer-events', 'all');

  // Vertical hover line
  const hoverLine = g
    .append('line')
    .attr('class', 'hover-line')
    .attr('stroke', '#666')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .style('display', 'none');

  overlay
    .on('mousemove', (event) => {
      const [mx] = d3.pointer(event);
      const date = xScale.invert(mx);

      let tooltipContent = `<strong>${d3.timeFormat('%d %b %Y')(date)}</strong>`;
      let hasData = false;

      for (const fuel of Object.keys(data)) {
        if (!visibleFuels.has(fuel)) {
          continue;
        }
        const idx = bisect(data[fuel], date, 1);
        const d0 = data[fuel][idx - 1];
        const d1 = data[fuel][idx];
        if (!d0) {
          continue;
        }
        const d = d1 && date - d0.date > d1.date - date ? d1 : d0;
        tooltipContent += `<br><span style="color:${FUEL_COLORS[fuel]}">${FUEL_LABELS[fuel]}: \u20AC${d.price.toFixed(3)}</span>`;
        hasData = true;
      }

      if (hasData) {
        tooltip.innerHTML = tooltipContent;
        tooltip.classList.add('visible');

        const tooltipX = mx + MARGIN.left + 15;
        const tooltipY = event.offsetY - 10;
        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;

        hoverLine
          .attr('x1', mx)
          .attr('x2', mx)
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .style('display', null);
      }
    })
    .on('mouseleave', () => {
      tooltip.classList.remove('visible');
      hoverLine.style('display', 'none');
    });

  /**
   * Updates the visible domain of the chart (called by navigator brush).
   * Y-axis stays fixed on the historical min/max for visual comparability.
   * @param {[Date, Date]} domain - New time domain
   */
  function updateDomain(domain) {
    xScale.domain(domain);
    render();
    if (onDomainChange) {
      onDomainChange(domain);
    }
  }

  /**
   * Renders/updates all chart elements with current scales.
   */
  function render() {
    const [start, end] = xScale.domain();

    xAxisGroup.call(
      d3
        .axisBottom(xScale)
        .ticks(getTimeInterval(start, end))
        .tickFormat(getTimeFormat(start, end)),
    );

    yAxisGroup.call(d3.axisLeft(yScale).tickFormat((d) => `\u20AC${d.toFixed(2)}`));

    g.select('.grid').call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(''));

    for (const fuel of Object.keys(paths)) {
      paths[fuel].attr('d', line).style('display', visibleFuels.has(fuel) ? null : 'none');
    }
  }

  // Store reference for external brush updates
  if (onBrushUpdate) {
    onBrushUpdate(updateDomain);
  }

  render();

  return {
    updateDomain,
    /**
     * Toggles visibility of a fuel type.
     * @param {string} fuel - Fuel type to toggle
     * @param {boolean} visible - Whether to show the fuel
     */
    setFuelVisible(fuel, visible) {
      if (visible) {
        visibleFuels.add(fuel);
      } else {
        visibleFuels.delete(fuel);
      }
      render();
    },
    /**
     * Returns the current x scale (for navigator synchronization).
     * @returns {d3.ScaleTime} The x scale
     */
    getXScale() {
      return xScale;
    },
    /**
     * Returns the full date extent of the data.
     * @returns {[Date, Date]} Min and max dates
     */
    getFullExtent() {
      return d3.extent(allDates);
    },
  };
}

export { FUEL_COLORS, FUEL_LABELS, MARGIN };
