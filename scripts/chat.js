import * as d3 from "d3";
// --- Constants ---
const SVG_ID = "svgVis";
const INPUT_ID = "csv_manager--input";
const SVG_WIDTH = 600;
const SVG_HEIGHT = 400;
const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 }; // Added margins
const INNER_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;
// Column indices to extract (0-based) - hardcoded as per original logic
const X_COLUMN_INDEX = 2;
const Y_COLUMN_INDEX = 3;
const REQUIRED_COLUMN_COUNT = 6; // As per original filter logic
// --- Initialization ---
// Use DOMContentLoaded which fires earlier than window.onload
document.addEventListener("DOMContentLoaded", initPage);
function initPage() {
    const svgInfo = initSvg();
    if (!svgInfo)
        return; // Stop if SVG setup failed
    initCsvManager(svgInfo);
}
/**
 * Initializes the SVG element and the main plotting group.
 * @returns SvgInfo object containing selections, or null if setup fails.
 */
function initSvg() {
    const svgContainer = d3.select("body"); // Or a more specific container div
    // Clear previous SVG if any (useful for hot-reloading environments)
    svgContainer.select(`#${SVG_ID}`).remove();
    const svg = svgContainer
        .append("svg")
        .attr("id", SVG_ID)
        .attr("width", SVG_WIDTH)
        .attr("height", SVG_HEIGHT);
    // Create a group for the plotting area, translated by the margin
    const plotGroup = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    // Add groups for axes (so they are drawn once)
    plotGroup.append("g").attr("class", "x-axis");
    plotGroup.append("g").attr("class", "y-axis");
    // Add axis label placeholders
    plotGroup
        .append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", INNER_WIDTH / 2)
        .attr("y", INNER_HEIGHT + MARGIN.bottom - 10); // Position below x-axis
    plotGroup
        .append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -INNER_HEIGHT / 2)
        .attr("y", -MARGIN.left + 20); // Position left of y-axis
    return { svg, plotGroup };
}
/**
 * Initializes the file input listener.
 * @param svgInfo Information about the SVG setup.
 */
function initCsvManager(svgInfo) {
    const htmlInput = document.getElementById(INPUT_ID);
    if (!htmlInput) {
        console.error(`Failed to find HTML input element with ID: ${INPUT_ID}`);
        return;
    }
    htmlInput.addEventListener("change", (event) => handleNewCsvFile(event, svgInfo));
}
// --- Event Handling and Data Processing ---
/**
 * Handles the 'change' event on the file input.
 * Reads, processes, and displays the CSV data.
 * @param event The input change event.
 * @param svgInfo Information about the SVG setup.
 */
async function handleNewCsvFile(event, svgInfo) {
    console.log("Handling new file...");
    try {
        const fileContent = await getCsvData(event);
        const { data, header } = processCsvData(fileContent);
        if (data.length === 0) {
            console.warn("No valid data points found after processing.");
            // Optionally clear the visualization or show a message
            clearVisualization(svgInfo); // Example function to clear
            return;
        }
        displayData(data, header, svgInfo);
    }
    catch (error) {
        console.error("Error processing CSV file:", error);
        // Optionally display an error message to the user on the page
        clearVisualization(svgInfo); // Clear visualization on error
        alert(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Reads the content of the selected CSV file.
 * @param event The input change event.
 * @returns A promise that resolves with the text content of the file.
 */
function getCsvData(event) {
    return new Promise((resolve, reject) => {
        const files = event?.target?.files;
        if (!files || files.length === 0) {
            return reject(new Error("No file selected."));
        }
        const file = files[0];
        if (!file) {
            // This case is unlikely if files.length > 0, but good for safety
            return reject(new Error("Failed to access selected file."));
        }
        // Basic check for file type (optional but recommended)
        // if (!file.type || !file.type.includes('csv')) {
        //     return reject(new Error("Invalid file type. Please select a CSV file."));
        // }
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
/**
 * Parses the raw CSV string into structured data points and extracts the header.
 * @param csvData The raw string content of the CSV file.
 * @returns An object containing the data points and the header row.
 */
function processCsvData(csvData) {
    // d3.csvParseRows handles lines endings better than manual splitting
    const parsedRows = d3.csvParseRows(csvData);
    if (parsedRows.length === 0) {
        console.warn("CSV file is empty or could not be parsed.");
        return { data: [], header: [] };
    }
    // Filter rows based on the original logic (specific column count)
    // Note: This might be too strict. Consider checking if *required* columns exist.
    const filteredRows = parsedRows.filter((row) => row.length === REQUIRED_COLUMN_COUNT);
    if (filteredRows.length === 0) {
        console.warn(`No rows with exactly ${REQUIRED_COLUMN_COUNT} columns found.`);
        // Attempt to extract header from the *first* row before filtering if needed
        const potentialHeader = parsedRows[0].length > Math.max(X_COLUMN_INDEX, Y_COLUMN_INDEX)
            ? [parsedRows[0][X_COLUMN_INDEX], parsedRows[0][Y_COLUMN_INDEX]]
            : ["X-Axis", "Y-Axis"]; // Default header
        return { data: [], header: potentialHeader };
    }
    // Assume the first *filtered* row contains the relevant headers (as per original logic)
    // A more robust approach might be to take headers from parsedRows[0] if it exists.
    const headerRow = filteredRows[0];
    const header = [
        headerRow[X_COLUMN_INDEX] || "X-Axis",
        headerRow[Y_COLUMN_INDEX] || "Y-Axis",
    ];
    // Process the rest of the rows
    const data = filteredRows
        .slice(1) // Skip header row
        .map((row, index) => {
        const xStr = row[X_COLUMN_INDEX];
        const yStr = row[Y_COLUMN_INDEX];
        const x = Number(xStr);
        const y = Number(yStr);
        // Check if conversion to number was successful
        if (isNaN(x) || isNaN(y)) {
            console.warn(`Skipping row ${index + 1}: Invalid numeric data ('${xStr}', '${yStr}')`);
            return null; // Mark row as invalid
        }
        return { x, y };
    })
        .filter((d) => d !== null); // Filter out invalid rows
    console.log(`Processed ${data.length} valid data points.`);
    return { data, header };
}
// --- Visualization ---
/**
 * Displays the processed data points on the SVG canvas.
 * @param data Array of data points {x, y}.
 * @param header Array containing X and Y axis names.
 * @param svgInfo Information about the SVG setup.
 */
function displayData(data, header, svgInfo) {
    const { plotGroup } = svgInfo;
    const [xAxisName, yAxisName] = header;
    // --- 1. Scales ---
    // Use d3.extent which returns [min, max] or [undefined, undefined] for empty array
    const xExtent = d3.extent(data, (d) => d.x);
    const yExtent = d3.extent(data, (d) => d.y);
    // Provide default domain if data is empty or extent is undefined
    const xDomain = xExtent[0] !== undefined ? xExtent : [0, 1];
    const yDomain = yExtent[0] !== undefined ? yExtent : [0, 1];
    const xScale = d3
        .scaleLinear()
        // Use nice() to extend the domain to round values, making the axis nicer
        .domain(xDomain)
        .nice()
        .range([0, INNER_WIDTH]);
    const yScale = d3
        .scaleLinear()
        .domain(yDomain)
        .nice()
        // Invert range for Y: 0 is at the top in SVG, data max should be at the top
        .range([INNER_HEIGHT, 0]);
    // --- 2. Axes ---
    const xAxis = d3.axisBottom(xScale).ticks(5); // Adjust tick count as needed
    const yAxis = d3.axisLeft(yScale).ticks(5);
    // Select the pre-made axis groups and call the axis generators
    // Add a transition for smoother updates
    plotGroup
        .select(".x-axis")
        .attr("transform", `translate(0, ${INNER_HEIGHT})`) // Move x-axis to bottom
        .transition()
        .duration(500) // Add transition
        .call(xAxis);
    plotGroup
        .select(".y-axis")
        .transition()
        .duration(500) // Add transition
        .call(yAxis);
    // Update axis labels
    plotGroup.select(".x-axis-label").text(xAxisName);
    plotGroup.select(".y-axis-label").text(yAxisName);
    // --- 3. Data Points (Circles) ---
    // Use the D3 General Update Pattern with join()
    plotGroup
        .selectAll("circle.data-point") // Select existing points specific class
        .data(data)
        .join((enter // ENTER: New elements
    ) => enter
        .append("circle")
        .attr("class", "data-point") // Add class for easier selection
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 0) // Start radius at 0 for transition
        .attr("fill", "steelblue") // Style new points
        .call((enter) => enter
        .transition()
        .duration(500) // Transition radius
        .attr("r", 3) // Target radius
    ), (update // UPDATE: Existing elements (if data keys were used)
    ) => update.call((update) => update
        .transition()
        .duration(500) // Transition position changes
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 3) // Ensure radius is correct
    ), (exit // EXIT: Elements to remove
    ) => exit.call((exit) => exit
        .transition()
        .duration(500) // Transition radius to 0
        .attr("r", 0)
        .remove() // Remove element after transition
    ));
}
/**
 * Clears the visualization (removes circles and potentially resets axes).
 * @param svgInfo Information about the SVG setup.
 */
function clearVisualization(svgInfo) {
    const { plotGroup } = svgInfo;
    console.log("Clearing visualization...");
    // Remove data points
    plotGroup
        .selectAll("circle.data-point")
        .transition()
        .duration(300)
        .attr("r", 0)
        .remove();
    // Optionally reset axes or clear labels if needed
    // plotGroup.select<SVGGElement>(".x-axis").call(d3.axisBottom(d3.scaleLinear())); // Reset with empty scale
    // plotGroup.select<SVGGElement>(".y-axis").call(d3.axisLeft(d3.scaleLinear()));
    plotGroup.select(".x-axis-label").text("");
    plotGroup.select(".y-axis-label").text("");
}
