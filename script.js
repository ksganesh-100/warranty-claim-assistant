console.log("Script loaded ✅");

// --- Constants ---
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;
const WARRANTY_PERIOD_YEARS = 2;

// --- DOM Elements ---
const claimForm = document.getElementById("claimForm");
const productInput = document.getElementById("product");
const partInput = document.getElementById("part");
const failureInput = document.getElementById("failure");
const purchaseDateInput = document.getElementById("purchaseDate");
const statusMessage = document.getElementById("status");
const outputDiv = document.getElementById("output");
const resultsSection = document.getElementById("results-section");
const generateClaimBtn = document.getElementById("generateClaimBtn");

// --- Utility Functions ---

/**
 * Calls the Gemini API to get a failure code based on description and part.
 * @param {string} failureDescription - The customer's description of the failure.
 * @param {string} partName - The name of the part involved.
 * @returns {Promise<string>} The best matching failure code and its name.
 */
async function getFailureCodeFromGemini(failureDescription, partName) {
    const apiKey = 'AIzaSyBUHFr6rqFvPN6oqN25a_vfIXuORlDqnME';

    const prompt = `
You are a warranty engineer assistant. A customer reports: "${failureDescription}" involving part "${partName}".
Return ONLY the best matching failure code from this list and its full name:
- F213 - Gearbox Synchronizer Failure
- F107 - Hydraulic Seal Failure
- F305 - Electrical Wiring Burnout
- F412 - Bearing Wear and Tear
- F999 - Unknown or Unclassified

Example desired output: "F213 - Gearbox Synchronizer Failure"`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Gemini API error:", errorBody);
            return "F999 - Unknown (API Error)";
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "F999 - Unknown";
        return textResponse.trim();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "F999 - Unknown (Network Error)";
    }
}

/**
 * Determines required documentation based on part name.
 * @param {string} part - The part name.
 * @returns {string[]} An array of required document names.
 */
function getRequiredDocuments(part) {
    const docs = ["Service Order Invoice"];
    if (part.includes("gear")) {
        docs.push("Image of Damaged Gearbox", "Dealer Inspection Report");
    } else if (part.includes("hydraulic")) {
        docs.push("Leak Photo", "Technician Report");
    } else if (part.includes("electrical") || part.includes("wiring") || part.includes("circuit")) {
        docs.push("Circuit Diagram", "Photo of Burnt Area (if visible)");
    } else if (part.includes("bearing")) {
        docs.push("Sound/Video Recording of Noise", "Wear Analysis Report (if available)");
    }
    // Add a general "Other supporting evidence" for F999 or unspecific cases
    docs.push("Any Other Supporting Evidence (e.g., fault codes)");
    return Array.from(new Set(docs)); // Use Set to remove duplicates
}


// --- Event Listener ---
if (claimForm) {
    claimForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent default form submission

        // 1. Initial UI Setup & Loading State
        resultsSection.style.display = 'block'; // Make results section visible
        outputDiv.innerHTML = ''; // Clear previous results
        statusMessage.textContent = 'Processing claim...'; // Initial status
        statusMessage.classList.add('loading'); // Add loading spinner class

        // Disable button and inputs
        generateClaimBtn.disabled = true;
        productInput.disabled = true;
        partInput.disabled = true;
        failureInput.disabled = true;
        purchaseDateInput.disabled = true;

        const product = productInput.value.trim();
        const part = partInput.value.trim().toLowerCase();
        const failure = failureInput.value.trim().toLowerCase();
        const purchaseDate = new Date(purchaseDateInput.value);
        const today = new Date();

        const ageInYears = (today - purchaseDate) / MS_PER_YEAR;
        const isEligible = ageInYears <= WARRANTY_PERIOD_YEARS;
        const eligibleText = isEligible ? "Covered Under Warranty" : "Not Eligible (Warranty Expired)";
        const eligibleClass = isEligible ? "eligible" : "not-eligible"; // Class for visual styling

        let failureCode = "F999 - Unknown"; // Default until Gemini responds

        // 2. Fetch Failure Code (Simulate progress)
        statusMessage.textContent = "🔍 Analyzing failure description with AI...";
        await new Promise(resolve => setTimeout(resolve, 800)); // Small delay for UX feel
        failureCode = await getFailureCodeFromGemini(failure, part);

        // 3. Determine Documents
        statusMessage.textContent = "📂 Compiling required documentation...";
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX feel
        const docs = getRequiredDocuments(part);

        // 4. Render Output (with fade-in animation)
        statusMessage.textContent = ""; // Clear status message
        statusMessage.classList.remove('loading'); // Remove spinner

        outputDiv.innerHTML = `
            <h2>Warranty Claim Summary</h2>
            <div class="summary-section">
                <p><strong>Product:</strong> ${product}</p>
                <p><strong>Part:</strong> ${part}</p>
                <p><strong>Product Age:</strong> ${ageInYears.toFixed(1)} years</p>
                <p class="eligibility-status ${eligibleClass}">${eligibleText}</p>
            </div>
            <div class="summary-section">
                <p><strong>AI Suggested Failure Code:</strong></p>
                <p class="failure-code-display">${failureCode}</p>
            </div>
            <div class="summary-section">
                <p><strong>Required Documentation:</strong></p>
                <ul>${docs.map(d => `<li>${d}</li>`).join('')}</ul>
            </div>
        `;
        // The CSS animation (fadeSlideIn) will automatically apply when element is added

        // 5. Re-enable form elements
        generateClaimBtn.disabled = false;
        productInput.disabled = false;
        partInput.disabled = false;
        failureInput.disabled = false;
        purchaseDateInput.disabled = false;

        // Optional: Scroll to results for better UX on smaller screens
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
} else {
    console.error("Claim form not found!");
}
