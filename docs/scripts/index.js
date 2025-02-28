// Example Data
// TODO: Change into loading from csv...
const data = [
  { date: new Date(2023, 0, 1), value: 30 },
  { date: new Date(2023, 1, 1), value: 50 },
  { date: new Date(2023, 2, 1), value: 40 },
  { date: new Date(2023, 3, 1), value: 70 },
  { date: new Date(2023, 4, 1), value: 90 },
];

const width = 600,
  height = 400,
  margin = 50;

const svg = d3.select("svg"); //Is D3.select the same as document.quereySelect() ?

// Somehow creates the x and y scales (what each axis is measured by)
const xScale = d3
  .scaleTime()
  .domain(d3.extent(data, (d) => d.date))
  .range([margin, width - margin]);

const yScale = d3
  .scaleLinear()
  .domain([0, d3.max(data), (d) => d.value])
  .range([height - margin, margin]);

// Create the axes.
const xAxis = d3.axisBottom(xScale).ticks(5);
const yAxis = d3.axisLeft(yScale);

// Paint the axes.
svg
  .append("g") // What is g ?
  .attr("transform", `translate(0,${height - margin})`)
  .call(xAxis);

svg.append("g").attr("transform", `translate(${margin},0)`).call(xAxis);

// Describe how the data is used to draw the line (I think)
const line = d3
  .line()
  .x((d) => xScale(d.date))
  .y((d) => yScale(d.value));

// Paint the line on the graph
svg
  .append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "blue")
  .attr("stroke-width", 2)
  .attr("d", line);

// Paint circles at datapoints
svg
  .selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", (d) => xScale(d.date))
  .attr("cy", (d) => yScale(d.value))
  .attr("r", 4)
  .attr("fill", "red");
