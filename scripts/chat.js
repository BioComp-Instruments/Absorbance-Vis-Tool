import * as d3 from "d3";
// --- Constants ---
const SVG_ID = "svgVis";
const INPUT_ID = "csv_manager--input";
const SVG_WIDTH = 600;
const SVG_HEIGHT = 400;
const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };
const INNER_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;
// Column indices to extract (0-based)
const X_COLUMN_INDEX = 2;
const Y_COLUMN_INDEX = 3;
const REQUIRED_COLUMN_COUNT = 6;
// --- Initialization ---
document.addEventListener("DOMContentLoaded", initPage);
function initPage() {
    const svgInfo = initSvg();
    if (!svgInfo)
        return;
    initCsvManager(svgInfo);
}
function initSvg() {
    // *** CHANGE THIS LINE ***
    // Select the dedicated visualization div instead of body
    const svgContainer = d3.select("#visualization");
    // ***********************
    if (svgContainer.empty()) {
        // Check if the container exists
        console.error("Failed to find SVG container element #visualization");
        return null;
    }
    // Clear previous SVG if any (useful for hot-reloading environments)
    svgContainer.select("svg").remove(); // Select svg *within* the container
    const svg = svgContainer // Append to the container
        .append("svg")
        .attr("id", SVG_ID)
        // Set viewbox for responsiveness
        .attr("viewBox", `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        // Optionally set max-width instead of fixed width/height for better scaling
        .style("max-width", `${SVG_WIDTH}px`)
        .style("height", "auto"); // Height adjusts based on aspect ratio
    // Rest of initSvg remains the same...
    const plotGroup = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    // Add groups for axes (so they are drawn once and updated later)
    plotGroup.append("g").attr("class", "x-axis");
    plotGroup.append("g").attr("class", "y-axis"); // Y-axis group
    // Add axis label placeholders
    plotGroup
        .append("text")
        .attr("class", "x-axis-label") // Class for X label
        .attr("text-anchor", "middle")
        .attr("x", INNER_WIDTH / 2)
        .attr("y", INNER_HEIGHT + MARGIN.bottom - 10); // Position below x-axis
    plotGroup
        .append("text")
        .attr("class", "y-axis-label") // Class for Y label
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)") // Rotate Y label
        .attr("x", -INNER_HEIGHT / 2) // Position relative to rotated coords
        .attr("y", -MARGIN.left + 20); // Position left of y-axis (adjust offset as needed)
    // *******************************
    // Add placeholder path for the line
    plotGroup.append("path").attr("class", "data-line");
    // ... path attributes ...
    return { svg, plotGroup };
}
function initCsvManager(svgInfo) {
    const htmlInput = document.getElementById(INPUT_ID);
    if (!htmlInput) {
        console.error(`Failed to find HTML input element with ID: ${INPUT_ID}`);
        return;
    }
    htmlInput.addEventListener("change", (event) => handleNewCsvFile(event, svgInfo));
}
// --- Event Handling and Data Processing ---
async function handleNewCsvFile(event, svgInfo) {
    console.log("Handling new file...");
    try {
        const fileContent = await getCsvData(event);
        const { data, header } = processCsvData(fileContent);
        if (data.length === 0) {
            console.warn("No valid data points found after processing.");
            clearVisualization(svgInfo);
            return;
        }
        displayData(data, header, svgInfo);
    }
    catch (error) {
        console.error("Error processing CSV file:", error);
        clearVisualization(svgInfo);
        alert(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function getCsvData(event) {
    // Same as before...
    return new Promise((resolve, reject) => {
        const files = event?.target?.files;
        if (!files || files.length === 0) {
            return reject(new Error("No file selected."));
        }
        const file = files[0];
        if (!file) {
            return reject(new Error("Failed to access selected file."));
        }
        console.log(`Reading file: ${file.name}`);
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
            }
            else {
                reject(new Error("Failed to read file content as text."));
            }
        };
        reader.onerror = () => {
            reject(reader.error || new Error("Unknown error reading file."));
        };
        reader.readAsText(file);
    });
}
function processCsvData(csvData) {
    // Same as before...
    const parsedRows = d3.csvParseRows(csvData);
    if (parsedRows.length === 0) {
        console.warn("CSV file is empty or could not be parsed.");
        return { data: [], header: [] };
    }
    const filteredRows = parsedRows.filter((row) => row.length === REQUIRED_COLUMN_COUNT);
    if (filteredRows.length === 0) {
        console.warn(`No rows with exactly ${REQUIRED_COLUMN_COUNT} columns found.`);
        const potentialHeader = parsedRows[0].length > Math.max(X_COLUMN_INDEX, Y_COLUMN_INDEX)
            ? [parsedRows[0][X_COLUMN_INDEX], parsedRows[0][Y_COLUMN_INDEX]]
            : ["X-Axis", "Y-Axis"];
        return { data: [], header: potentialHeader };
    }
    const headerRow = filteredRows[0];
    const header = [
        headerRow[X_COLUMN_INDEX] || "X-Axis",
        headerRow[Y_COLUMN_INDEX] || "Y-Axis",
    ];
    const data = filteredRows
        .slice(1)
        .map((row, index) => {
        const xStr = row[X_COLUMN_INDEX];
        const yStr = row[Y_COLUMN_INDEX];
        const x = Number(xStr);
        const y = Number(yStr);
        if (isNaN(x) || isNaN(y)) {
            console.warn(`Skipping row ${index + 1}: Invalid numeric data ('${xStr}', '${yStr}')`);
            return null;
        }
        return { x, y };
    })
        .filter((d) => d !== null);
    console.log(`Processed ${data.length} valid data points.`);
    return { data, header };
}
// --- Visualization ---
/**
 * Displays the processed data as a line graph on the SVG canvas.
 * @param data Array of data points {x, y}.
 * @param header Array containing X and Y axis names.
 * @param svgInfo Information about the SVG setup.
 */
function displayData(data, header, svgInfo) {
    const { plotGroup } = svgInfo;
    const [xAxisName, yAxisName] = header;
    // *** Sort data by x-value for a proper line graph ***
    const sortedData = data.sort((a, b) => a.x - b.x);
    // --- 1. Scales ---
    const xExtent = d3.extent(sortedData, (d) => d.x);
    const yExtent = d3.extent(sortedData, (d) => d.y);
    const xDomain = xExtent[0] !== undefined ? xExtent : [0, 1];
    const yDomain = yExtent[0] !== undefined ? yExtent : [0, 1];
    const xScale = d3
        .scaleLinear()
        .domain(xDomain)
        .nice()
        .range([0, INNER_WIDTH]);
    const yScale = d3
        .scaleLinear()
        .domain(yDomain)
        .nice()
        .range([INNER_HEIGHT, 0]); // Y range inverted for SVG coordinate system
    // --- 2. Axes ---
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    plotGroup
        .select(".x-axis")
        .attr("transform", `translate(0, ${INNER_HEIGHT})`)
        .transition()
        .duration(500)
        .call(xAxis);
    plotGroup
        .select(".y-axis")
        .transition()
        .duration(500)
        .call(yAxis);
    // Update axis labels
    plotGroup.select(".x-axis-label").text(xAxisName);
    plotGroup.select(".y-axis-label").text(yAxisName);
    // --- 3. Line Generator ---
    const lineGenerator = d3
        .line() // Specify DataPoint type
        .x((d) => xScale(d.x)) // Use scaled x position
        .y((d) => yScale(d.y)); // Use scaled y position
    // .curve(d3.curveMonotoneX); // Optional: Add curve interpolation
    // --- 4. Draw the Line ---
    const path = plotGroup.select(".data-line");
    // Animate the path update
    path
        .datum(sortedData) // Bind the entire sorted dataset to the path
        .transition()
        .duration(750) // Add transition for smoothness
        .attr("d", lineGenerator); // Update the 'd' attribute with the new path data
    // If you wanted a more explicit enter/update pattern for a single path:
    /*
    const pathSelection = plotGroup.selectAll<SVGPathElement, DataPoint[]>(".data-line")
      .data([sortedData]); // Bind data as an array containing the data array
  
    pathSelection.enter() // If path doesn't exist (shouldn't happen with pre-added path)
      .append("path")
      .attr("class", "data-line")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", lineGenerator) // Initial path
      .merge(pathSelection) // Merge enter and update selections
      .transition().duration(750)
      .attr("d", lineGenerator); // Update path for both enter and update
    */
}
/**
 * Clears the visualization (removes line path).
 * @param svgInfo Information about the SVG setup.
 */
function clearVisualization(svgInfo) {
    const { plotGroup } = svgInfo;
    console.log("Clearing visualization...");
    // Select the line path and transition its removal or reset it
    const path = plotGroup.select(".data-line");
    if (!path.empty()) {
        // Option 1: Animate path to empty
        path.transition().duration(300).attr("d", d3.line()([])); // Set 'd' to an empty line
        // Option 2: Fade out (if preferred)
        // path.transition().duration(300)
        //    .style("opacity", 0)
        //    .remove(); // Remove after fade if needed, but resetting 'd' is often enough
        // If you absolutely need to remove it (e.g., if initSvg doesn't recreate it):
        // path.remove();
    }
    // Optionally reset axes or clear labels
    plotGroup.select(".x-axis-label").text("");
    plotGroup.select(".y-axis-label").text("");
    // Resetting axes might be desired too:
    // plotGroup.select<SVGGElement>(".x-axis").call(d3.axisBottom(d3.scaleLinear().range([0, INNER_WIDTH])));
    // plotGroup.select<SVGGElement>(".y-axis").call(d3.axisLeft(d3.scaleLinear().range([INNER_HEIGHT, 0])));
}
