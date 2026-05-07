import { drawBarChart } from './chart1.js';

d3.csv("data/CombinedFines.csv", d => ({
  AGE_GROUP: d["AGE_GROUP"],
  Month: d["Month"],
  "Sum(FINES)": +d["Sum(FINES)"],
  Jurisdiction: d["Jurisdiction"]
})).then(data => {
  drawBarChart(data);
}).catch(error => {
  console.error("Error loading the CSV file:", error);
});

export const loadSpeedFinesData = async () => {
  try {
    const data = await d3.csv("data/data.csv");
    
    data.forEach(d => {
      d.YEAR = +d.YEAR;
      d.FINES = +d.FINES;
    });

    /*guru code*/
    const speedFinesData = data.filter(d => d.METRIC === "speed_fines" && d.YEAR >= 2017 && d.YEAR <= 2023);
    const nestedData = d3.group(speedFinesData, d => d.YEAR, d => d.DETECTION_METHOD);
    const years = Array.from({ length: 2023 - 2017 + 1 }, (_, i) => 2017 + i);
    const detectionMethods = [...new Set(speedFinesData.map(d => d.DETECTION_METHOD))];

    const stackedData = years.map(year => {
      const yearData = { YEAR: year };
      let totalFines = 0;
      detectionMethods.forEach(method => {
        const group = nestedData.get(year)?.get(method) || [];
        const fines = d3.sum(group, d => d.FINES);
        yearData[method] = fines;
        totalFines += fines;
      });
      yearData.total = totalFines;
      return yearData;
    });

    return { stackedData, years, detectionMethods };
  } catch (error) {
    console.error("Error loading the CSV file:", error);
    throw error;
  }
};

export const loadQLDSpeedFinesData = async () => {
  try {
    const data = await d3.csv("data/data.csv");

    data.forEach(d => {
      d.YEAR = +d.YEAR;
      d.FINES = +d.FINES;
    });

    const qldData = data.filter(d => d.JURISDICTION === "QLD" && d.METRIC === "speed_fines" && d.YEAR === 2023);
    
    const detectionMethods = [...new Set(qldData.map(d => d.DETECTION_METHOD))];
    const summary = { YEAR: 2023 };

    detectionMethods.forEach(method => {
      const sum = d3.sum(qldData.filter(d => d.DETECTION_METHOD === method), d => d.FINES);
      summary[method] = sum;
    });

    return {
      stackedData: [summary],
      detectionMethods
    };
  } catch (error) {
    console.error("Error loading QLD speed fines data:", error);
    throw error;
  }
};
//section 3
export const loadLicenseData = async () => {
  try {
    const data = await d3.csv("data/license.csv");
    data.forEach(d => {
      d.FinesPer1k = Math.round(+d["Fines per 1k Licenses"]);
    });
    return data;
  } catch (error) {
    console.error("Failed to load license.csv", error);
    throw error;
  }
};
