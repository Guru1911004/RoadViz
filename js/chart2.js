// chart2.js
import { margin, width, height, innerWidth, innerHeight } from './shared-constants.js';
import { loadSpeedFinesData } from './load-data.js';
import { showTooltip, hideTooltip } from './interactions.js';

function updateMethodInsight(state) {
  const insights = {
    VIC: "In VIC, fixed cameras were the most dominant until 2023, when mobile detection surged, and the police played a smaller but useful part too.",
    NSW: "For years, NSW relied on a steady blend of police-issued and camera-based fines, peaking in 2021 with over 1.4 million offences. But in 2023, something remarkable happened — the category “fixed or mobile camera” vanished, replaced by a detailed breakdown of camera types: fixed, red light, and mobile. This signals a shift not just in detection strategy, but in data transparency, allowing deeper insight into how drivers are caught. NSW isn’t just enforcing more — it’s enforcing smarter.",
    QLD: "QLD has consistently relied on automated enforcement, likely due to extensive road networks with mobile cameras emerging as the clear frontrunner by 2023.",
    NT: "With consistently low fines, NT shifted sharply since 2022 toward mobile and red light cameras — a notable change in strategy.",
    TAS: "Unlike other states that shifted from one method to another, Tasmania maintained a steady use of camera enforcement from 2017 to 2023. What stands out, however, is the rise of police-issued fines from 2020 to 2022, temporarily eclipsing camera usage. In 2023, both enforcement styles intensified in parallel — suggesting a strategic push to combine human oversight with automated surveillance.",
    ACT: "A city built on cameras — After years of consistent camera enforcement, ACT saw a sudden pause in 2022 — only to return in 2023 with a broader, more diversified enforcement approach. ",
    SA: "From 2017–2022, the large blue chunk shows fixed or mobile cameras completely dominating the landscape in SA with very minimal police-issued fines which are almost negligible until 2023. There has been a clear breakdown of fines issued into mobile, fixed, and average speed cameras since, with mobile being the largest.",
    WA: "WA transitioned from broad camera enforcement to a balanced, multi-method approach by 2023."
  };

  const box = document.getElementById('method-insight');

  box.classList.add('fade');
  setTimeout(() => {
    box.innerText = insights[state] || '';
    box.classList.remove('fade');
  }, 150);
}

const svg = d3.select("#stackedArea")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("role", "img")
  .attr("aria-label", "Stacked area chart showing number of speeding fines by detection method and year")
  .classed("stacked-area-svg", true)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

function updateChart(selectedState) {
  svg.selectAll(".area, .x-axis, .y-axis, .custom-legend, .overlay, .x-hover-line").remove();

  loadSpeedFinesData().then(({ stackedData, years, detectionMethods }) => {
    const filteredData = stackedData.map(yearData => {
      const yearEntry = { YEAR: yearData.YEAR, total: 0 };
      detectionMethods.forEach(method => yearEntry[method] = 0);
      return yearEntry;
    });

    d3.csv("data/data.csv").then(rawData => {
      rawData.forEach(d => {
        d.YEAR = +d.YEAR;
        d.FINES = +d.FINES;
      });

      const stateData = rawData.filter(
        d => d.METRIC === "speed_fines" && d.YEAR >= 2017 && d.YEAR <= 2023 && d.JURISDICTION === selectedState
      );

      const nested = d3.group(stateData, d => d.YEAR, d => d.DETECTION_METHOD);

      years.forEach((year, i) => {
        let total = 0;
        detectionMethods.forEach(method => {
          const group = nested.get(year)?.get(method) || [];
          const fines = d3.sum(group, d => d.FINES);
          filteredData[i][method] = fines;
          total += fines;
        });
        filteredData[i].total = total;
      });

      const x = d3.scaleLinear().domain([2017, 2023]).range([0, innerWidth]);
      const y = d3.scaleLinear().domain([0, d3.max(filteredData, d => d.total)]).range([innerHeight, 0]).nice();
      const color = d3.scaleOrdinal().domain(detectionMethods).range(d3.schemeCategory10);

      const stack = d3.stack().keys(detectionMethods);
      const series = stack(filteredData);

      const area = d3.area()
        .x(d => x(d.data.YEAR))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

      svg.selectAll(".area")
        .data(series)
        .enter()
        .append("path")
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", d => color(d.key))
        .attr("opacity", 0.8);

      const focus = svg.append("g").style("display", "none");
      focus.append("line")
        .attr("class", "x-hover-line hover-line")
        .attr("y1", 0).attr("y2", innerHeight)
        .attr("stroke", "#666").attr("stroke-width", 1).attr("stroke-dasharray", "3,3");

      svg.append("rect")
        .attr("class", "overlay")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseover", () => focus.style("display", null))
        .on("mouseout", () => { focus.style("display", "none"); hideTooltip(); })
        .on("mousemove", (event) => {
          const [mouseX] = d3.pointer(event);
          const year = Math.round(x.invert(mouseX));
          if (year < 2017 || year > 2023) return;

          focus.select(".x-hover-line").attr("x1", x(year)).attr("x2", x(year));
          const yearData = filteredData.find(d => d.YEAR === year);
          if (!yearData) return;

          let content = `<strong>Year: ${year}</strong><br>`;
          series.forEach(s => {
            const method = s.key;
            const fines = yearData[method] || 0;
            if (fines > 0) content += `<span style="color:${color(method)}">${method}:</span> ${d3.format(",")(fines)}<br>`;
          });

          const [xPos, yPos] = d3.pointer(event, document.body);
          showTooltip(content, xPos, yPos);
        });

      svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format("d")))
        .selectAll("text")
        .attr("dy", "1.5em")
        .attr("transform", "rotate(-45) translate(-10,0)")
        .style("text-anchor", "end");

      svg.append("text")
        .attr("class", "x axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 55)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Years");

      svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s")))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -innerHeight / 2)
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Fines");

      const legend = svg.append("g")
        .attr("class", "custom-legend")
        .attr("transform", `translate(0, ${innerHeight + 65})`);

      detectionMethods.forEach((key, i) => {
        const row = legend.append("g")
          .attr("transform", `translate(${(i % 4) * 180}, ${Math.floor(i / 4) * 20})`);

        row.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(key));
        row.append("text").attr("x", 20).attr("y", 12).style("font-size", "12px").text(key);
      });
    });
  });
}

d3.csv("data/data.csv").then(rawData => {
  const jurisdictions = [...new Set(rawData.map(d => d.JURISDICTION))];
  const dropdown = d3.select("#state-filter");

  dropdown.selectAll("option")
    .data(jurisdictions)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  const defaultState = dropdown.property("value");
  d3.select("#state-name").text(defaultState);
  updateChart(defaultState);
  updateMethodInsight(defaultState);

  dropdown.on("change", function () {
    const selected = d3.select(this).property("value");
    d3.select("#state-name").text(selected);
    updateChart(selected);
    updateMethodInsight(selected);
  });
});
