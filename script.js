console.log("Script loaded ✅");

// --- Constants ---
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25; // Accounting for leap years for better accuracy
const WARRANTY_PERIOD_YEARS = 2; // Example warranty period

// --- DOM Elements ---
const claimForm = document.getElementById("claimForm");
const productInput = document.getElementById("product");
const partInput = document.getElementById("part");
const failureInput = document.getElementById("failure");
const purchaseDateInput = document.getElementById("purchaseDate");
const statusMessage = document.getElementById("status");
const outputDiv = document.getElementById("output");
const resultsSection = document.getElementById("results-section"); // New section for output
const generateClaimBtn = document.getElementById("generateClaimBtn");

// --- Utility Functions ---

/**
 * Calls the Gemini API to get a failure code based on description and part.
 * @param {string} failureDescription - The customer's description of the failure.
 * @param {string} partName - The name of the part involved.
 * @returns {Promise<string>} The best matching failure code and its name.
 */
async function getFailureCodeFromGemini(failureDescription, partName) {
    // IMPORTANT: In a real application, you would use a secure backend proxy
    // to call the Gemini API, not expose your API key directly in frontend code.
    const apiKey = 'AIzaSyBUHFr6rqFvPN6oqN25a_vfIXuORlDqnME';

    const prompt = `
You are a warranty engineer assistant. A customer reports: "${failureDescription}" involving part "${partName}".
Return ONLY the best matching failure code from this list and its full name:
- F213 - Gearbox Synchronizer Failure
- F107 - Hydraulic Seal Failure
- F305 - Electrical Wiring Burnout
- F412 - Bearing Wear and Tear
- F999 - Unknown or Unclassified

Example desired output: "F213 - Gearbox Synchronizer Failure"`; // Added example for clarity to Gemini

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
            // Provide a user-friendly message for API errors
            return "F999 - Unknown (API Error)";
        }

        const data = await response.json();
        // Accessing the text response safely
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
    return docs;
}


// --- Event Listener ---
if (claimForm) { // Ensure the form exists before adding listener
    claimForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent default form submission

        // Show the results section and clear previous output
        resultsSection.style.display = 'block';
        outputDiv.innerHTML = ''; // Clear previous results
        statusMessage.textContent = ''; // Clear previous status

        // Disable button and inputs during processing
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

        // Calculate product age
        const ageInYears = (today - purchaseDate) / MS_PER_YEAR;

        // Determine eligibility
        const isEligible = ageInYears <= WARRANTY_PERIOD_YEARS;
        const eligibleText = isEligible ? "Eligible" : "Not Eligible";
        const eligibleClass = isEligible ? "eligible-status" : "not-eligible-status";

        // Display status message while waiting for Gemini
        statusMessage.textContent = "🔍 Analyzing failure description...";

        // Get failure code from Gemini
        const failureCode = await getFailureCodeFromGemini(failure, part);

        // Clear status message after Gemini response
        statusMessage.textContent = "";

        // Get required documents
        const docs = getRequiredDocuments(part);

        // Render the output
        outputDiv.innerHTML = `
            <h2>Warranty Claim Summary</h2>
            <p><strong>Product:</strong> ${product}</p>
            <p><strong>Part:</strong> ${part}</p>
            <p><strong>Product Age:</strong> ${ageInYears.toFixed(1)} years</p>
            <p><strong>Warranty Status:</strong> <span class="${eligibleClass}">${eligibleText}</span></p>
            <p><strong>Failure Code:</strong> ${failureCode}</p>
            <p><strong>Required Documentation:</strong></p>
            <ul>${docs.map(d => `<li>${d}</li>`).join('')}</ul>
        `;

        // Re-enable button and inputs
        generateClaimBtn.disabled = false;
        productInput.disabled = false;
        partInput.disabled = false;
        failureInput.disabled = false;
        purchaseDateInput.disabled = false;
    });
} else {
    console.error("Claim form not found!");
}
