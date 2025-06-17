console.log("Script loaded ✅");

// --- Constants ---
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;
const TYPING_DELAY = 25; // Milliseconds per character for status message typing
const STEP_DELAY = 1000; // Milliseconds between major steps (pause duration)

// --- Local AI Knowledge Base (Simulated) ---
// This dataset is used for the client-side preliminary AI analysis
const FAILURE_CODES_LOCAL = [
    {
        code: "F213",
        name: "Gearbox Synchronizer Failure",
        keywords: ["gearbox", "synchronizer", "shift", "grind", "engage", "transmission", "stuck"],
        parts: ["gearbox", "transmission", "synchronizer"],
        baseConfidence: 70
    },
    {
        code: "F107",
        name: "Hydraulic Seal Failure",
        keywords: ["hydraulic", "seal", "leak", "fluid", "cylinder", "pump", "pressure", "sag"],
        parts: ["hydraulic", "pump", "cylinder", "actuator"],
        baseConfidence: 75
    },
    {
        code: "F305",
        name: "Electrical Wiring Burnout",
        keywords: ["electrical", "wiring", "burn", "smoke", "smell", "fuse", "circuit", "short", "power", "unresponsive"],
        parts: ["electrical", "wiring", "harness", "module", "circuit board", "battery"],
        baseConfidence: 65
    },
    {
        code: "F412",
        name: "Bearing Wear and Tear",
        keywords: ["bearing", "wear", "noise", "vibration", "grind", "rattle", "wheel", "pulley", "axle", "loose"],
        parts: ["bearing", "wheel", "axle", "pulley", "hub", "spindle"],
        baseConfidence: 80
    },
    {
        code: "F999",
        name: "Unknown or Unclassified",
        keywords: [], // No specific keywords, acts as a fallback
        parts: [],
        baseConfidence: 30
    }
];


// --- DOM Elements ---
const claimForm = document.getElementById("claimForm");
const productInput = document.getElementById("product");
const partInput = document.getElementById("part");
const vinInput = document.getElementById("vin");
const odometerInput = document.getElementById("odometer");
const customerComplaintInput = document.getElementById("customerComplaint");
const technicianDiagnosisInput = document.getElementById("technicianDiagnosis");
const purchaseDateInput = document.getElementById("purchaseDate");
const statusMessage = document.getElementById("status");
const outputDiv = document.getElementById("output");
const resultsSection = document.getElementById("results-section");
const generateClaimBtn = document.getElementById("generateClaimBtn");

// --- Utility Functions ---

/**
 * Animates text appearing in an element, character by character.
 * @param {HTMLElement} element - The DOM element to write into.
 * @param {string} text - The text to animate.
 * @param {number} delay - Delay in milliseconds per character.
 */
async function animateText(element, text, delay = TYPING_DELAY) {
    element.textContent = ''; // Clear existing text
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

/**
 * Helper to pause execution for a given duration.
 * @param {number} ms - Milliseconds to pause.
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calls the Gemini API to get a failure code based on technician diagnosis and part.
 * @param {string} technicianDiagnosis - The technician's detailed diagnosis.
 * @param {string} partName - The name of the part involved.
 * @returns {Promise<string>} The best matching failure code and its full name.
 */
async function getFailureCodeFromGemini(technicianDiagnosis, partName) {
    const apiKey = 'YOUR_GEMINI_API_KEY'; // Replace with your actual Gemini API Key

    const prompt = `
You are a highly specialized automotive warranty engineer assistant.
Based on the following technician's diagnosis: "${technicianDiagnosis}" and the part involved: "${partName}",
return ONLY the best matching warranty failure code and its full name from this list.
Focus strictly on the diagnostic and root cause information provided.

Failure Codes:
- F213 - Gearbox Synchronizer Failure
- F107 - Hydraulic Seal Failure
- F305 - Electrical Wiring Burnout
- F412 - Bearing Wear and Tear
- F999 - Unknown or Unclassified (Use if no clear match)

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
 * Simulates a local AI match with confidence and matched keywords based on technician's diagnosis.
 * This is a simplified keyword matching for demo purposes.
 * @param {string} diagnosis - The technician's diagnosis.
 * @param {string} part - The part name.
 * @returns {{code: string, name: string, confidence: number, matchedKeywords: string[]}}
 */
function getSimulatedFailureCode(diagnosis, part) {
    // Combine diagnosis and part for tokenization
    const tokens = new Set([...diagnosis.split(/\s+/), ...part.split(/\s+/)].map(t => t.toLowerCase().replace(/[^a-z0-9]/g, '')));
    let bestMatch = { code: "F999", name: "Unknown or Unclassified", confidence: 30, matchedKeywords: [] };
    let highestScore = -1;

    for (const failureType of FAILURE_CODES_LOCAL) {
        let score = 0;
        const currentMatchedKeywords = [];

        // Score based on keywords in diagnosis
        for (const keyword of failureType.keywords) {
            if (tokens.has(keyword)) {
                score += 10;
                currentMatchedKeywords.push(keyword);
            }
        }

        // Score based on part name
        for (const partKeyword of failureType.parts) {
            if (part.includes(partKeyword)) {
                score += 15; // Higher weight for part match
                if (!currentMatchedKeywords.includes(partKeyword)) {
                    currentMatchedKeywords.push(partKeyword);
                }
            }
        }

        // Add base confidence
        score += failureType.baseConfidence;

        // Apply a penalty if part-specific keywords were expected but not found in the diagnosis
        if (failureType.parts.length > 0 && currentMatchedKeywords.filter(k => failureType.parts.includes(k)).length === 0) {
             score = Math.max(score - 10, 0);
        }

        if (score > highestScore) {
            highestScore = score;
            // Cap confidence at 100
            bestMatch = {
                code: failureType.code,
                name: failureType.name,
                confidence: Math.min(100, score),
                matchedKeywords: Array.from(new Set(currentMatchedKeywords)) // Ensure unique keywords
            };
        }
    }
    return bestMatch;
}

/**
 * Determines required documentation based on part name and diagnosis.
 * @param {string} part - The part name.
 * @param {string} diagnosis - The technician's diagnosis.
 * @returns {string[]} An array of required document names.
 */
function getRequiredDocuments(part, diagnosis) {
    const docs = ["Completed Service Order Form (with VIN/Serial No.)", "Customer Concern Narrative (signed/verified)"];

    // Add general diagnostic report
    if (diagnosis.length > 20) { // If diagnosis is substantive
        docs.push("Technician's Detailed Diagnostic Report");
    }

    // Specific documentation based on part or diagnosis keywords
    if (part.includes("gear") || part.includes("transmission") || part.includes("synchronizer")) {
        docs.push("High-Resolution Photo/Video of Damaged Gearbox Components", "Dealer Diagnostic Report (including DTCs if any)");
    } else if (part.includes("hydraulic") || part.includes("cylinder") || part.includes("pump") || part.includes("seal") || diagnosis.includes("leak")) {
        docs.push("High-Resolution Leak Photo (clearly showing fluid source and path)", "Technician's Operational Test Report (e.g., pressure readings)");
    } else if (part.includes("electrical") || part.includes("wiring") || part.includes("circuit") || part.includes("module") || diagnosis.includes("electrical") || diagnosis.includes("fuse")) {
        docs.push("Circuit Diagram or Schematic Reference", "Photo of Burnt Area / Physical Damage (if visible)", "Diagnostic Trouble Codes (DTCs) from ECU");
    } else if (part.includes("bearing") || part.includes("wheel") || part.includes("axle") || part.includes("hub") || diagnosis.includes("noise") || diagnosis.includes("vibration")) {
        docs.push("Sound/Video Recording of Anomalous Noise (e.g., grinding)", "Bearing Play/Runout Measurement Report");
    }
    docs.push("Any Other Relevant Supporting Evidence (e.g., historical service records, specific test results)"); // Always include
    return Array.from(new Set(docs)); // Use Set to remove duplicates
}


// --- Event Listener ---
if (claimForm) {
    claimForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        // 1. Initial UI Setup & Loading State
        resultsSection.style.display = 'block';
        outputDiv.innerHTML = `<h2>Warranty Claim Summary</h2>`; // Start with just the main heading
        statusMessage.textContent = '';
        statusMessage.classList.add('loading');

        // Disable form elements to prevent re-submission
        generateClaimBtn.disabled = true;
        productInput.disabled = true;
        partInput.disabled = true;
        vinInput.disabled = true;
        odometerInput.disabled = true;
        customerComplaintInput.disabled = true;
        technicianDiagnosisInput.disabled = true;
        purchaseDateInput.disabled = true;

        // Get input values
        const product = productInput.value.trim();
        const part = partInput.value.trim().toLowerCase();
        const vin = vinInput.value.trim().toUpperCase(); // VINs are uppercase
        const odometer = parseInt(odometerInput.value);
        const customerComplaint = customerComplaintInput.value.trim().toLowerCase();
        const technicianDiagnosis = technicianDiagnosisInput.value.trim().toLowerCase();
        const purchaseDate = new Date(purchaseDateInput.value); // This is just the customer's stated purchase date

        const today = new Date();


        // --- Theatrical Agent Steps ---

        // Step 1: Gathering Customer & Vehicle Data
        await animateText(statusMessage, "1. Gathering customer & vehicle data: VIN, Odometer, Product & Component details...");
        await wait(STEP_DELAY);

        outputDiv.innerHTML += `
            <div class="summary-section" id="section-claim-info">
                <p><strong>Product Model:</strong> ${product}</p>
                <p><strong>Affected Component:</strong> ${part}</p>
                <p><strong>VIN:</strong> ${vin}</p>
                <p><strong>Odometer Reading:</strong> ${odometer.toLocaleString()} miles</p>
                <p><strong>Customer Reported Purchase Date:</strong> ${purchaseDate.toLocaleDateString()}</p>
                <p><strong>Customer Concern / Reported Symptom:</strong> "${customerComplaint}"</p>
                <p><strong>Technician's Findings & Root Cause:</strong> "${technicianDiagnosis}"</p>
            </div>
        `;
        await wait(50); // Small pause for DOM update
        document.getElementById('section-claim-info').classList.add('visible');
        await wait(STEP_DELAY); // Pause after reveal


        // Step 2: Cross-referencing VIN with OEM Policy and Eligibility Check
        await animateText(statusMessage, "2. Cross-referencing VIN with OEM warranty policies & verifying eligibility...");
        await wait(STEP_DELAY);

        // --- Simulated OEM Data Lookup (Highly theatrical for the demo!) ---
        // In a real system, this would be an API call to an OEM database.
        const simulatedOEMData = {
            inServiceDate: new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate() + 30), // Simulate a common 30-day delay for registration
            warrantyType: "Bumper-to-Bumper Warranty",
            standardWarrantyYears: 3,
            standardWarrantyMiles: 36000
        };

        // Calculate eligibility based on simulated OEM data
        const actualInServiceDate = simulatedOEMData.inServiceDate;
        const yearsSinceInService = (today - actualInServiceDate) / MS_PER_YEAR;

        const isEligibleByDate = yearsSinceInService <= simulatedOEMData.standardWarrantyYears;
        const isEligibleByMileage = odometer <= simulatedOEMData.standardWarrantyMiles;
        const isEligibleFinal = isEligibleByDate && isEligibleByMileage;

        const eligibilityDetails = [];
        eligibilityDetails.push(`<strong>Coverage Term (Time):</strong> ${yearsSinceInService.toFixed(1)} yrs (Max ${simulatedOEMData.standardWarrantyYears} yrs) - ${isEligibleByDate ? '✅ Covered' : '❌ Expired'}`);
        eligibilityDetails.push(`<strong>Coverage Term (Mileage):</strong> ${odometer.toLocaleString()} miles (Max ${simulatedOEMData.standardWarrantyMiles.toLocaleString()} miles) - ${isEligibleByMileage ? '✅ Covered' : '❌ Exceeded'}`);

        const finalEligibleText = isEligibleFinal ? "Eligible for Warranty Coverage" : "Not Eligible for Warranty Coverage";
        const finalEligibleClass = isEligibleFinal ? "eligible" : "not-eligible";

        outputDiv.innerHTML += `
            <div class="summary-section" id="section-eligibility">
                <p><strong>Applicable OEM Warranty Program:</strong> ${simulatedOEMData.warrantyType} (${simulatedOEMData.standardWarrantyYears} Years / ${simulatedOEMData.standardWarrantyMiles.toLocaleString()} Miles)</p>
                <p><strong>Vehicle In-Service Date:</strong> ${actualInServiceDate.toLocaleDateString()}</p>
                <p class="eligibility-status ${finalEligibleClass}">
                    <strong>Claim Eligibility Status:</strong> ${finalEligibleText}
                    <small style="font-weight: normal; margin-left: 10px; color: var(--text-light);">
                        <ul>
                            ${eligibilityDetails.map(detail => `<li>${detail}</li>`).join('')}
                        </ul>
                    </small>
                </p>
            </div>
        `;
        await wait(50);
        document.getElementById('section-eligibility').classList.add('visible');
        await wait(STEP_DELAY);


        // Step 3: Checking for relevant Technical Service Bulletins (TSBs) and Recalls
        await animateText(statusMessage, "3. Checking for relevant TSBs & Recalls based on VIN and diagnosis...");
        await wait(STEP_DELAY);

        // Simulate TSB/Recall lookup based on product/part/diagnosis
        let tsbInfo = "No active TSBs or Recalls found for this specific issue or VIN.";
        if (product.toLowerCase().includes("tractor x120") && part.includes("gearbox") && technicianDiagnosis.includes("grinding")) {
            tsbInfo = "<strong>Found TSB 24-005-TRX:</strong> Gearbox Synchronizer Grinding Noise. Refer to bulletin for updated diagnostic procedure and parts.";
        } else if (product.toLowerCase().includes("model s sedan") && technicianDiagnosis.includes("leak") && part.includes("hydraulic")) {
            tsbInfo = "<strong>Found Recall 23V-123:</strong> Hydraulic Hose Leak Inspection. Immediate repair required per recall guidelines.";
        } else if (technicianDiagnosis.includes("electrical") && technicianDiagnosis.includes("smoke")) {
            tsbInfo = "<strong>Found TSB EL-2023-015:</strong> Wiring Harness Inspection for Overheating. Check for affected production dates.";
        }

        outputDiv.innerHTML += `
            <div class="summary-section" id="section-tsb">
                <p><strong>Relevant TSBs / Recalls:</strong></p>
                <p>${tsbInfo}</p>
            </div>
        `;
        await wait(50);
        document.getElementById('section-tsb').classList.add('visible');
        await wait(STEP_DELAY);


        // Step 4: Performing Initial Local AI Analysis on Technician's Diagnosis
        await animateText(statusMessage, "4. Performing preliminary AI analysis on Technician's Diagnosis for failure mode suggestion...");
        await wait(STEP_DELAY);
        simulatedFailureMatch = getSimulatedFailureCode(technicianDiagnosis, part);

        const keywordsHtml = simulatedFailureMatch.matchedKeywords.length > 0
            ? `<p class="matched-keywords">Matched keywords: ${simulatedFailureMatch.matchedKeywords.map(k => `<span>${k}</span>`).join('')}</p>`
            : `<p class="matched-keywords">No specific keywords matched locally.</p>`;

        outputDiv.innerHTML += `
            <div class="summary-section" id="section-local-ai">
                <p><strong>Preliminary AI Failure Mode Suggestion:</strong></p>
                <p class="failure-code-display">${simulatedFailureMatch.code} - ${simulatedFailureMatch.name}</p>
                <p class="confidence-score">Confidence: ${simulatedFailureMatch.confidence}%</p>
                ${keywordsHtml}
            </div>
        `;
        await wait(50);
        document.getElementById('section-local-ai').classList.add('visible');
        await wait(STEP_DELAY);


        // Step 5: Consulting Advanced AI (Gemini) for definitive failure code
        await animateText(statusMessage, "5. Consulting advanced Gemini AI for system-recommended failure code...");
        await wait(STEP_DELAY);
        geminiFailureCode = await getFailureCodeFromGemini(technicianDiagnosis, part);

        // Append to the local AI section or create new if you prefer
        // For theatrical demo, let's update the existing section
        const localAiSection = document.getElementById('section-local-ai');
        if (localAiSection) {
            localAiSection.innerHTML += `
                <p style="margin-top: 15px;"><strong>System-Recommended Failure Code:</strong></p>
                <p class="failure-code-display" style="color: var(--primary-color);">${geminiFailureCode}</p>
            `;
        }
        await wait(STEP_DELAY);


        // Step 6: Compiling Required Documentation
        await animateText(statusMessage, "6. Compiling required claim documentation...");
        await wait(STEP_DELAY);
        const docs = getRequiredDocuments(part, technicianDiagnosis);

        outputDiv.innerHTML += `
            <div class="summary-section" id="section-docs">
                <p><strong>Required Claim Documentation:</strong></p>
                <ul>${docs.map(d => `<li>${d}</li>`).join('')}</ul>
            </div>
        `;
        await wait(50);
        document.getElementById('section-docs').classList.add('visible');
        await wait(STEP_DELAY);

        // Final Step: Analysis Complete & Call to Action
        await animateText(statusMessage, "✅ Warranty claim analysis complete! Ready for Submission.");
        statusMessage.classList.remove('loading');
        await wait(STEP_DELAY / 2);

        // Add final action buttons with the 'output-actions' class
        outputDiv.innerHTML += `
            <div class="output-actions">
                <button class="button" type="button" onclick="alert('In a real system, this would securely submit the claim details to your OEM Warranty Management System (WMS)!');">Submit Claim to OEM WMS</button>
                <button class="secondary-btn" type="button" onclick="alert('In a real system, this would allow you to correct AI suggestions and provide feedback for model improvement. This data helps the AI learn!');">Provide Feedback / Correct AI</button>
            </div>
        `;

        // Re-enable form elements
        generateClaimBtn.disabled = false;
        productInput.disabled = false;
        partInput.disabled = false;
        vinInput.disabled = false;
        odometerInput.disabled = false;
        customerComplaintInput.disabled = false;
        technicianDiagnosisInput.disabled = false;
        purchaseDateInput.disabled = false;

        // Scroll to results for better UX on smaller screens
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
} else {
    console.error("Claim form not found!");
}
