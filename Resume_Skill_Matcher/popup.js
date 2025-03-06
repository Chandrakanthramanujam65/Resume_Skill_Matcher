document
  .getElementById("resumeUpload")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const resumeText = e.target.result;

      // Save resume to chrome storage
      chrome.storage.local.set({ userResume: resumeText }, function () {
        // Update UI
        document.getElementById("status").textContent =
          "Resume saved successfully!";
        document.getElementById("analyzeButton").disabled = false;

        // Preview resume text
        const previewElement = document.getElementById("resumePreview");
        previewElement.textContent =
          resumeText.substring(0, 500) + (resumeText.length > 500 ? "..." : "");
      });
    };

    reader.readAsText(file);
  });

document.getElementById("analyzeButton").addEventListener("click", function () {
  // Send message to active tab to analyze job
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "analyzeJob" },
      function (response) {
        if (chrome.runtime.lastError) {
          document.getElementById("status").textContent =
            "Error: " + chrome.runtime.lastError.message;
          console.error(chrome.runtime.lastError);
        } else if (response && response.status === "success") {
          document.getElementById("status").textContent =
            "Analysis completed successfully!";
        } else {
          document.getElementById("status").textContent =
            "Analysis failed. Ensure you are on a supported job site.";
        }
      }
    );
  });
});

// Check for existing resume on popup load
chrome.storage.local.get(["userResume"], function (result) {
  if (result.userResume) {
    document.getElementById("analyzeButton").disabled = false;
    document.getElementById("status").textContent =
      "Resume is ready for analysis";

    // Preview saved resume
    const previewElement = document.getElementById("resumePreview");
    previewElement.textContent =
      result.userResume.substring(0, 500) +
      (result.userResume.length > 500 ? "..." : "");
  }
});
