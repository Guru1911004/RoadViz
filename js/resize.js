import { fontSizeScale } from './shared-constants.js';
import { margin, height } from './shared-constants.js';

export const resizeChart = () => {
  const windowWidth = window.innerWidth;

  const scaledFontSize = fontSizeScale(windowWidth);

  // Resize all axis ticks and labels
  d3.selectAll(".tick text, .axis-label")
    .style("font-size", `${scaledFontSize}px`);

  // Adjust axis label positions
  d3.select(".axis-label-left")
    .attr("y", margin.top - scaledFontSize);

  d3.select(".axis-label-bottom")
    .attr("y", height - margin.bottom + 2.2 * scaledFontSize);
};

// Add listener
window.addEventListener("resize", resizeChart);

// Optionally call it once on load
resizeChart();
