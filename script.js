document.getElementById("claimForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const product = document.getElementById("product").value.trim();
  const part = document.getElementById("part").value.trim().toLowerCase();
  const failure = document.getElementById("failure").value.trim().toLowerCase();
  const purchaseDate = new Date(document.getElementById("purchaseDate").value);
  const today = new Date();

  const ageInYears = (today - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
  const eligible = ageInYears <= 2 ? "✅ Eligible" : "❌ Not Eligible";

  // Simple failure code matching
  let failureCode = "Unknown";
  if (failure.includes("grind") && part.includes("gear")) failureCode = "F213 - Gearbox Synchronizer Failure";
  else if (failure.includes("leak") && part.includes("hydraulic")) failureCode = "F107 - Hydraulic Seal Failure";

  // Mock documentation recommendations
  const docs = ["Service Order Invoice"];
  if (part.includes("gear")) docs.push("Image of Damaged Gearbox", "Dealer Inspection Report");
  else if (part.includes("hydraulic")) docs.push("Leak Photo", "Service Technician Notes");

  // Show result
  document.getElementById("output").innerHTML = `
    <h2>Warranty Claim Summary</h2>
    <p><strong>Product:</strong> ${product}</p>
    <p><strong>Part:</strong> ${part}</p>
    <p><strong>Product Age:</strong> ${ageInYears.toFixed(1)} years</p>
    <p><strong>Warranty Status:</strong> ${eligible}</p>
    <p><strong>Failure Code:</strong> ${failureCode}</p>
    <p><strong>Required Documentation:</strong></p>
    <ul>${docs.map(d => `<li>${d}</li>`).join('')}</ul>
  `;
});

//  Code for adding Gemini based intelligence

async function getFailureCodeFromGemini(failureDescription, partName) {
  const apiKey = 'AIzaSyBUHFr6rqFvPN6oqN25a_vfIXuORlDqnME';

  const prompt = `
You are a warranty engineer assistant. A customer reports: "${failureDescription}" involving part "${partName}".
Return the best matching failure code from this list:
- F213 - Gearbox Synchronizer Failure
- F107 - Hydraulic Seal Failure
- F305 - Electrical Wiring Burnout
- F412 - Bearing Wear and Tear
- F999 - Unknown or Unclassified

Respond ONLY with the best matching failure code and its name.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "F999 - Unknown";
  return textResponse.trim();
}

