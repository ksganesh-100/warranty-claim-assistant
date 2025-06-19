## Interactive Multi-Agent Warranty System Demo
This project provides an interactive, single-page web application (SPA) that visually demonstrates the workflow of an AI-powered multi-agent system for processing warranty claims. It aims to make the complex concept of agent orchestration easily understandable and explorable by guiding the user through each step of the claim analysis process.

### Architecture Overview
The system is conceptualized around a Master Agent that orchestrates various specialized Helper Agents. The SPA simulates this orchestration, revealing the actions and findings of each agent sequentially.

Master Agent (Claim Orchestrator)
The Master Agent serves as the central control unit.

Responsibilities:
- Initiates the claim analysis upon user command.
- Manages the flow, sequentially invoking each helper agent.
- Gathers and consolidates outputs from all helper agents.
- Presents a comprehensive, step-by-step summary of the claim analysis.

### Helper Agents
Each helper agent is a specialized module performing a distinct task in the warranty claim processing pipeline.

**1. VIN & Warranty Eligibility Agent**
Role: Verifies the vehicle's warranty status against OEM policies.

Simulated Actions: Determines time and mileage coverage eligibility.

Visualized Output: Progress bars showing time and mileage used vs. allowed, and a clear eligibility status.

**2. TSB & Recall Lookup Agent**
Role: Identifies relevant Technical Service Bulletins (TSBs) or recalls.

Simulated Actions: Checks for known issues impacting the product and reported symptoms.

Visualized Output: Textual notification of any relevant TSBs or recalls found.

**3. NLP Early Warning Agent**
Role: Performs a preliminary analysis of the technician's diagnosis using local AI knowledge.

Simulated Actions: Suggests an initial failure code and confidence score based on keyword matching.

Visualized Output: A donut chart representing confidence level, suggested failure code, and matched keywords.

**4. Advanced AI (Gemini) Diagnosis Agent**
Role: Provides a definitive, system-recommended failure code using a more advanced AI model.

Simulated Actions: Refines the diagnosis based on more sophisticated analysis (represented by Gemini API concept).

Visualized Output: A final, confirmed system-recommended failure code.

**5. Documentation Compiler Agent**
Role: Compiles a list of all necessary supporting documents for claim submission.

Simulated Actions: Generates a checklist of required documents based on the determined failure type and warranty status.

Visualized Output: A bulleted list of essential claim documentation.

### Key Features
- Interactive Workflow: Step-by-step visualization of a multi-agent system.
- Clear Agent Roles: Each section highlights the specific function and output of a different "agent."
- Dynamic Content: Information and visualizations update as you progress through the analysis.
- Responsive Design: Optimized for viewing on various devices (desktop, tablet, mobile).
- Intuitive UI: Simple navigation for easy exploration and understanding of the process.

### Technologies Used
- HTML5: For the core structure of the single-page application.
- CSS3 (Tailwind CSS): For responsive layout, styling, and modern visual aesthetics.
- JavaScript (Vanilla JS): For controlling the interactive flow, dynamic content updates, and event handling.
- Chart.js: For generating the interactive confidence score donut chart.

### Future Enhancements
- Integration with real backend APIs for live data and actual AI model calls.
- More complex data inputs and outputs for each agent.
- User input forms to simulate new claims dynamically.
- Persistence of claim data (e.g., using a local database or cloud storage).
- Additional types of interactive visualizations for other data points.
- Accessibility improvements (e.g., keyboard navigation, ARIA attributes).
