import { showTooltip, hideTooltip } from "./interactions.js";

// Set up SVG dimensions and margins
const margin = { top: 20, right: 120, bottom: 60, left: 20 };
const width = 800 - margin.left - margin.right;
const height = 380 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#mapchart")
  .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data and GeoJSON
Promise.all([
  d3.csv("data/license.csv"),
  d3.json("https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json")
]).then(function([licenseData, geoData]) {
  // Process license data for 2023
  const data2023 = licenseData.filter(d => d.YEAR === "2023").map(d => ({
    state: d.STATE.trim(), // Use full state name as provided
    licenses: +d.LICENSES,
    fines: +d.FINES,
    finesPer1000Licenses: (+d.FINES / +d.LICENSES) * 1000 // Fines per 1000 licenses
  }));

  // Create a map of state to fines per 1000 licenses
  const finesPer1000Map = new Map(data2023.map(d => [d.state, d.finesPer1000Licenses]));

  // Debug mapping
  console.log("Fines per 1000 Licenses Map:", Object.fromEntries(finesPer1000Map));
  console.log("GeoJSON State Names:", geoData.features.map(d => d.properties.STATE_NAME));

  // Set up projection and path
  const projection = d3.geoMercator().fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);

  // Color scale for fines per 1000 licenses
const maxFinesPer1000 = d3.max(data2023, d => d.finesPer1000Licenses);
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, maxFinesPer1000]); // Range from 0 to max fines per 1000 licenses

  // Draw the map
  svg.selectAll(".state")
    .data(geoData.features)
    .enter()
    .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", d => {
        const stateName = d.properties.STATE_NAME.trim();
        const finesPer1000 = finesPer1000Map.get(stateName) || 0;
        return colorScale(finesPer1000);
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        
        d3.select(this).attr("fill-opacity", 0.7);
         const stateName = d.properties.STATE_NAME.trim();
        const stateData = data2023.find(s => s.state === d.properties.STATE_NAME.trim());
        if (stateData) {
          const content = `
            <strong>${d.properties.STATE_NAME}</strong><br>
            Fines: ${d3.format(",.0f")(stateData.fines)}<br>
            Licenses: ${d3.format(",.0f")(stateData.licenses)}<br>
Fines per 1000 Licenses: ${d3.format(",.0f")(stateData.finesPer1000Licenses)}
          `;
          const [x, y] = d3.pointer(event, document.body);
          showTooltip(content, x, y);
        }
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill-opacity", 1);
        hideTooltip();
        updateInsightBox("");
         updateInsightBox(stateName);
      });

  // Add legend
  const legendWidth = 180;
  const legendHeight = 8;
  const legend = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 20}, ${height + 20})`);

  const legendScale = d3.scaleLinear()
    .domain([0, maxFinesPer1000])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format("~s")); 

  const gradient = svg.append("defs")
    .append("linearGradient")
      .attr("id", "legend-gradient");

  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    gradient.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", colorScale(t * maxFinesPer1000));
  }

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -5)
    .attr("font-size", "12px")
    .text("Fines per 1000 Licenses");
}).catch(function(error) {
  console.error("Error loading data or GeoJSON:", error);
});
d3.selectAll("input[name='viewMode']").on("change", function () {
  const mode = this.value;

  svg.selectAll(".state")
    .transition()
    .duration(500)
    .attr("fill", d => {
      const stateName = d.properties.STATE_NAME.trim();
      const stateData = data2023.find(s => s.state === stateName);
      if (!stateData) return "#ccc";

      const value = mode === "total" ? stateData.fines : stateData.finesPer1000Licenses;
      return colorScale(value);
    });

  d3.select(".legend-title").text(mode === "total" ? "Total Fines" : "Fines per 1k Licenses");
});
