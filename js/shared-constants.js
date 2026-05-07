export const margin = { top: 40, right: 160, bottom: 100, left: 70 }; // increased bottom for x-axis labels
export const width = 890;
export const height = 350;
export const innerWidth = width - margin.left - margin.right;
export const innerHeight = height - margin.top - margin.bottom;

export const tooltipWidth = 65;
export const tooltipHeight = 32;

export const orderedMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const ageGroups = ["0-16", "17-25", "26-39", "40-64", "65 and over", "Unknown"];

export const colorScale = d3.scaleOrdinal()
  .domain(ageGroups)
  .range(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"]);

export const fontSizeScale = d3.scaleLinear()
  .domain([315, 1200]) // [min screen width, max screen width]
  .range([15, 12])     // [max font size, min font size]
  .clamp(true);
