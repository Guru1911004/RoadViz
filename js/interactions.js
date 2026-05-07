import { width, margin } from './shared-constants.js';

export const populateJurisdictionFilters = (data, updateFn) => {
  const jurisdictions = Array.from(new Set(data.map(d => d.Jurisdiction)));

  d3.select("#filters_state")
    .selectAll("button")
    .data(jurisdictions)
    .join("button")
    .attr("class", d => `filter ${d === "VIC" ? "active" : ""}`)
    .attr("id", d => `btn-${d}`)
    .text(d => d)
    .on("click", (_, d) => {
      d3.selectAll("#filters_state .filter").classed("active", false);
      d3.select(`#btn-${d}`).classed("active", true);
      d3.select("#selected-title").text(d);
      updateFn(d);
    });
};

export const addLegend = (svg, colorScale, detectionMethods) => {
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, 0)`);

  legend.selectAll(".legend-item")
    .data(detectionMethods)
    .enter()
    .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0,${i * 20})`)
      .each(function(d) {
        d3.select(this)
          .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colorScale(d));
        d3.select(this)
          .append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d)
            .style("font-size", "12px");
      });
};

export const showTooltip = (content, x, y) => {
  d3.select(".tooltip")
    .html(content)
    .style("opacity", 1)
    .style("left", `${x + 10}px`)
    .style("top", `${y - 28}px`);
};

export const hideTooltip = () => {
  d3.select(".tooltip").style("opacity", 0);
};

