"use strict";

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

window.addEventListener("load", () => {
  console.log(`Window Loaded`);
});

// Get information from the imported csv file
document
  .getElementById("csv_manager--input")
  .addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("Failed to load file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const csvData = reader.result;
      console.log("");
    };
  });
