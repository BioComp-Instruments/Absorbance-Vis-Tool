import * as d3 from "d3";

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 300)
  .attr("height", 500);

// const test_data = {
//   name: "sal",
//   grade: "50",
//   house: "goblin",
// };
const h1 = d3.select("body").append("h1").attr("textContent", "Hello");
d3.select("body").append("h1").text("Absorbance Vis");
