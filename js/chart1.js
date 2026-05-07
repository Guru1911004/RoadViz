// ===== chart1.js =====
import {
  width, height, margin, innerWidth, innerHeight,
  orderedMonths, ageGroups, colorScale, fontSizeScale
} from './shared-constants.js';

import {
  populateJurisdictionFilters, addLegend,
  showTooltip, hideTooltip
} from './interactions.js';

import { loadSpeedFinesData } from './load-data.js';

export const drawBarChart = (data) => {
  const svg = d3.select("#barchart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("barchart-svg", true)
    .attr("role", "img")
    .attr("aria-label", "Stacked bar chart showing monthly speeding fines by age group");

  const chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const xScale = d3.scaleBand().padding(0.2).range([0, innerWidth]).domain(orderedMonths);
  const yScale = d3.scaleLinear().range([innerHeight, 0]);

  const resizeFonts = () => {
    const scaledFont = fontSizeScale(window.innerWidth);

    d3.selectAll(".tick text, .axis-label, .legend-label")
      .style("font-size", `${scaledFont}px`);

    d3.select(".axis-label-left")
      .attr("y", margin.top - scaledFont);

    d3.select(".axis-label-bottom")
      .attr("y", height - margin.bottom + 2.2 * scaledFont);
  };

  window.addEventListener("resize", resizeFonts);

  const updateBarChart = async (jurisdiction) => {
    const isQLD = jurisdiction === "QLD";

    d3.select("#barchart").style("display", isQLD ? "none" : "block");
    d3.select("#qld-chart").style("display", isQLD ? "block" : "none");

    if (isQLD) {
      const { stackedData, detectionMethods } = await loadSpeedFinesData();
      const qldSvg = d3.select("#qld-chart svg");
      qldSvg.selectAll("*").remove();

      const x = d3.scaleLinear()
        .domain([0, d3.max(detectionMethods, d => stackedData[0][d])])
        .range([0, 800]);

      const y = d3.scaleBand()
        .domain(detectionMethods)
        .range([0, 250])
        .padding(0.2);

      const group = qldSvg.append("g").attr("transform", "translate(120,40)");

      group.selectAll("rect")
        .data(detectionMethods)
        .enter()
        .append("rect")
        .attr("y", d => y(d))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", d => x(stackedData[0][d]))
        .attr("fill", "#2563eb")
        .attr("aria-label", d => `Detection method: ${d}, fines: ${stackedData[0][d]}`);

      group.append("g").call(d3.axisLeft(y));
      qldSvg.append("g")
        .attr("transform", "translate(120,290)")
        .call(d3.axisBottom(x).ticks(5));

      resizeFonts();
      return;
    }

    const filtered = data.filter(d => d.Jurisdiction === jurisdiction);

    const grouped = {};
    orderedMonths.forEach(month => {
      grouped[month] = {};
      ageGroups.forEach(age => {
        grouped[month][age] = 0;
      });
    });

    filtered.forEach(d => {
      if (grouped[d.Month] && grouped[d.Month][d.AGE_GROUP] !== undefined) {
        grouped[d.Month][d.AGE_GROUP] += d["Sum(FINES)"];
      }
    });

    const stackedInput = orderedMonths.map(month => {
      const entry = { Month: month };
      ageGroups.forEach(age => {
        entry[age] = grouped[month][age];
      });
      return entry;
    });

    const stackedData = d3.stack().keys(ageGroups)(stackedInput);

    yScale.domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])]).nice();

    chartGroup.selectAll(".axis").remove();

    chartGroup.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .selectAll("text")
      .attr("transform", "rotate(-25)")
      .style("text-anchor", "end");

    chartGroup.append("text")
      .attr("class", "axis-label axis-label-bottom")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 50)
      .attr("text-anchor", "middle")
      .text("Months");

    chartGroup.append("g")
      .attr("class", "axis y-axis")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(",")));

    chartGroup.append("text")
      .attr("class", "axis-label axis-label-left")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .text("Total Fines");

    const layers = chartGroup.selectAll("g.layer")
      .data(stackedData, d => d.key)
      .join("g")
      .attr("class", "layer")
      .attr("fill", d => colorScale(d.key));

    layers.selectAll("rect")
      .data(d => d.map(e => ({ ...e, key: d.key })))
      .join("rect")
      .attr("x", d => xScale(d.data.Month))
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d[1]))
      .attr("height", d => yScale(d[0]) - yScale(d[1]))
      .attr("role", "img")
      .attr("aria-label", d => `${d.key} | ${d.data.Month} | ${d[1] - d[0]} fines`)
      .on("mouseover", (e, d) => {
        showTooltip(`${d.key}<br>${d.data.Month}<br>${d[1] - d[0]} fines`, e.pageX, e.pageY);
      })
      .on("mouseout", hideTooltip);

    const totalFines = d3.sum(filtered, d => d["Sum(FINES)"]);
    const ageFines = d3.sum(filtered.filter(d => d.AGE_GROUP === "0-16"), d => d["Sum(FINES)"]);

    d3.select("#summary")
      .html(`In <strong>${jurisdiction}</strong>, a total of <strong>${ageFines.toLocaleString()} fines</strong> were issued to people aged <strong>0–16</strong> in 2023.`);

    const groupTotals = d3.rollup(
      filtered,
      v => d3.sum(v, d => d["Sum(FINES)"]),
      d => d.AGE_GROUP
    );

    let topAgeGroup = '';
    let topValue = 0;
    groupTotals.forEach((value, key) => {
      if (value > topValue) {
        topValue = value;
        topAgeGroup = key;
      }
    });

    d3.select("#topStat").html(
      `<strong>In ${jurisdiction}</strong>, drivers aged <strong>${topAgeGroup}</strong> received the most speeding fines in 2023, totalling <strong>${topValue.toLocaleString()}</strong>.`
    );

    d3.selectAll("#filters_state .filter")
      .classed("active", d => d === jurisdiction);

    resizeFonts(); // Apply fonts after rendering
  };

  addLegend(svg, colorScale, ageGroups);
  populateJurisdictionFilters(data, updateBarChart);

  d3.select("#filters_state")
    .append("div")
    .attr("id", "reset-wrapper")
    .style("display", "inline-block")
    .style("margin-left", "10px")
    .append("button")
    .attr("id", "reset-btn")
    .text("Reset to VIC")
    .style("background-color", "#e5e7eb")
    .style("border", "1px solid #ccc")
    .style("padding", "6px 12px")
    .style("cursor", "pointer")
    .style("font-size", "14px")
    .on("click", () => updateBarChart("VIC"));

  updateBarChart("VIC");
};
