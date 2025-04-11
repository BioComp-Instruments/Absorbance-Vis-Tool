export default function getCsvData() {
    const htmlInput = document.getElementById("csv_manager--input");
    if (htmlInput) {
        htmlInput.addEventListener("change", (event) => {
            // Import the csv as a text file when a new file is loaded through the html page
            const files = event?.target?.files;
            if (!files) {
                console.error("Failed to find target files");
                return;
            }
            const file = files[0];
            if (!file) {
                console.error("Failed to load file");
                return;
            }
            // Parse the text file and recreate it as an object
            const reader = new FileReader();
            reader.onload = (e) => {
                const csvData = e?.target?.result;
            };
            reader.readAsText(file);
        });
    }
}
