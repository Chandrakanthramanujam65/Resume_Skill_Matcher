// Skill Analysis Core Logic
const CRITICAL_SKILLS = [
  "python",
  "javascript",
  "react",
  "node.js",
  "typescript",
  "sql",
  "machine learning",
  "data analysis",
  "aws",
  "docker",
];

const OPTIONAL_SKILLS = [
  "git",
  "agile",
  "microservices",
  "tensorflow",
  "kubernetes",
  "ci/cd",
  "graphql",
  "redis",
  "mongodb",
  "kafka",
  "elasticsearch",
];

const JOB_PLATFORMS = {
  "linkedin.com": [
    ".jobs-description__content",
    "[data-job-description-content]",
    ".description__text",
  ],
  "indeed.com": [
    "#jobDescriptionText",
    ".jobsearch-JobComponent-description",
    ".jobsearch-JobDescription",
  ],
  "glassdoor.com": [".jobDescriptionContent", '[data-test="jobDescription"]'],
  "monster.com": [".job-description", "[data-job-description]"],
  "dice.com": [".job-description", "#jobDescriptionContainer"],
};

function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, "");
}

function extractSkills(text) {
  const normalizedText = normalizeText(text);
  const allSkills = [...CRITICAL_SKILLS, ...OPTIONAL_SKILLS];
  return allSkills.filter((skill) =>
    normalizedText.includes(normalizeText(skill))
  );
}

function extractJobDescription() {
  const currentUrl = window.location.href;
  const platform = Object.keys(JOB_PLATFORMS).find((p) =>
    currentUrl.includes(p)
  );

  if (!platform) {
    throw new Error("Unsupported job platform");
  }

  for (const selector of JOB_PLATFORMS[platform]) {
    const jobDescriptionElement = document.querySelector(selector);
    if (jobDescriptionElement) {
      return jobDescriptionElement.innerText;
    }
  }

  throw new Error("Could not extract job description");
}

function analyzeSkills(resumeText, jobDescription) {
  const resumeSkills = extractSkills(resumeText);
  const jobSkills = extractSkills(jobDescription);

  const criticalSkillsFound = resumeSkills.filter((skill) =>
    CRITICAL_SKILLS.includes(skill)
  );

  const optionalSkillsFound = resumeSkills.filter((skill) =>
    OPTIONAL_SKILLS.includes(skill)
  );

  const criticalMissing = CRITICAL_SKILLS.filter(
    (skill) => !resumeSkills.includes(skill)
  );

  const criticalSkillsMatchPercentage =
    (criticalSkillsFound.length / CRITICAL_SKILLS.length) * 100;

  const optionalSkillsMatchPercentage =
    (optionalSkillsFound.length / OPTIONAL_SKILLS.length) * 100;

  const totalMatchPercentage =
    criticalSkillsMatchPercentage * 0.7 + optionalSkillsMatchPercentage * 0.3;

  return {
    totalMatchPercentage,
    criticalSkillsMatchPercentage,
    optionalSkillsMatchPercentage,
    relevant: [...criticalSkillsFound, ...optionalSkillsFound],
    criticalMissing,
  };
}

function createAnalysisModal(result) {
  // Remove any existing modals
  const existingModal = document.getElementById("skillAnalysisModal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "skillAnalysisModal";
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #4CAF50;
    padding: 20px;
    z-index: 10000;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    border-radius: 10px;
  `;

  modal.innerHTML = `
    <h2 style="color: #4CAF50;">🔍 Skill Match Analysis</h2>
    <p>Total Match: <strong>${result.totalMatchPercentage.toFixed(
      2
    )}%</strong></p>
    <p>Critical Skills Match: <strong>${result.criticalSkillsMatchPercentage.toFixed(
      2
    )}%</strong></p>
    <p>Optional Skills Match: <strong>${result.optionalSkillsMatchPercentage.toFixed(
      2
    )}%</strong></p>
    
    <h3>Relevant Skills Found:</h3>
    <ul>
      ${result.relevant.map((skill) => `<li>✅ ${skill}</li>`).join("")}
    </ul>
    
    <h3>Critical Skills Missing:</h3>
    <ul>
      ${result.criticalMissing.map((skill) => `<li>❌ ${skill}</li>`).join("")}
    </ul>
    
    <button id="closeAnalysisModal" style="
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px;
      cursor: pointer;
    ">Close</button>
  `;

  document.body.appendChild(modal);
  document
    .getElementById("closeAnalysisModal")
    .addEventListener("click", () => {
      document.body.removeChild(modal);
    });
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeJob") {
    chrome.storage.local.get(["userResume"], function (result) {
      try {
        const resumeText = result.userResume;
        if (!resumeText) {
          throw new Error("No resume found. Please upload your resume first.");
        }

        const jobDescription = extractJobDescription();
        const analysisResult = analyzeSkills(resumeText, jobDescription);

        createAnalysisModal(analysisResult);

        sendResponse({ status: "success" });
      } catch (error) {
        console.error("Skill Analysis Error:", error);
        alert("Skill Analysis Error: " + error.message);
        sendResponse({ status: "error", message: error.message });
      }
    });

    return true;
  }
});
