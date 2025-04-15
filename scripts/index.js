import * as d3 from "d3";
window.onload = initPage;
function initPage() {
    const svgInfo = {
        SVG_WIDTH: 600,
        SVG_HEIGHT: 400,
        SVG_ID: "svgVis",
    };
    initSvg(svgInfo);
    initCsvManager(svgInfo);
}
function initSvg(svgInfo) {
    const svgElement = d3.select("body");
    svgElement
        .append("svg")
        .attr("width", svgInfo.SVG_WIDTH)
        .attr("height", svgInfo.SVG_HEIGHT)
        .attr("id", svgInfo.SVG_ID);
}
function initCsvManager(svgInfo) {
    const htmlInput = document.getElementById("csv_manager--input");
    if (!htmlInput) {
        console.error("Failed to find html input element");
        return;
    }
    htmlInput.addEventListener("change", (event) => handleNewCsvFile(event, svgInfo));
}
function handleNewCsvFile(event, svgInfo) {
    const getCsvDataPromise = new Promise(getCsvDataWrapper);
    getCsvDataPromise.then(processCsvData).then(displayDataWrapper);
    function displayDataWrapper(csvData) {
        displayData(csvData, svgInfo);
    }
    function getCsvDataWrapper(resolve, reject) {
        getCsvData(resolve, reject, event);
    }
}
function getCsvData(resolve, reject, event) {
    // Import the csv as a text file when a new file is loaded through the html page
    const files = event?.target?.files;
    if (!files) {
        reject("Failed to find target files");
        return;
    }
    const file = files[0];
    if (!file) {
        reject("Failed to load file");
        return;
    }
    // Parse the text file and recreate it as an object
    const reader = new FileReader();
    reader.onload = () => {
        const csvData = reader.result;
        resolve(csvData);
    };
    reader.onerror = () => {
        reject(reader.error);
    };
    reader.readAsText(file);
}
function processCsvData(csvData) {
    // This array contains all the number data but not the header of the csv file.
    let csvDataArray = d3
        .csvParseRows(csvData)
        .filter((val) => {
        return val.length == 6;
    })
        .map((val) => {
        return [val[2], val[3]];
    });
    return csvDataArray;
}
function displayData(csvDataArray, svgInfo) {
    const xAxisName = csvDataArray[0][0];
    const yAxisName = csvDataArray[0][1];
    const data = csvDataArray
        .slice(1)
        .map((strArr) => strArr.map((str) => Number(str)));
    const xData = data.map((dataPoint) => dataPoint[0]);
    const xAxis = d3
        .scaleLinear()
        .range([0, svgInfo.SVG_WIDTH])
        .domain([0, d3.max(xData)]);
    const yData = data.map((dataPoint) => dataPoint[1]);
    const yAxis = d3
        .scaleLinear()
        .range([0, svgInfo.SVG_HEIGHT])
        .domain([0, d3.max(yData)]);
    const svg = d3.select("#" + svgInfo.SVG_ID);
    svg
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => xAxis(d[0]))
        .attr("cy", (d) => yAxis(d[1]))
        .attr("r", 2);
}
