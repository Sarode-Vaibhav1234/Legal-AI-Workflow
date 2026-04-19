const Groq = require("groq-sdk");
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Common Helper for Groq API
 */
const callGroq = async (promptText) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: promptText }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1 // Low temperature for high precision legal tasks
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (err) {
    console.error("Groq Agent API Error:", err.message);
    throw new Error("AI Service currently unavailable.");
  }
};

/**
 * 1. Researcher Agent
 * Purpose: Finds similar cases, arguments, and provide DOCUMENT LINKS.
 */
const runResearcherAgent = async (query, caseContext) => {
  const promptText = `
    You are an expert Legal Researcher Agent specialized in Indian Law.
    
    CASE CONTEXT:
    ${caseContext}
    
    LAWYER'S QUERY:
    ${query}
    
    INSTRUCTIONS:
    1. Identify the core legal issues.
    2. Suggest 3 landmark or relevant Indian Supreme Court/High Court cases.
    3. For EACH case, you MUST provide a search link to Indian Kanoon or a similar repository. 
       Use the format: [Case Name] (Link: https://indiankanoon.org/search/?q=[Encoded Case Name])
    4. Provide strategic legal arguments.
    5. Be concise and professional.
  `;

  try {
    return await callGroq(promptText);
  } catch (error) {
    return `[System Note] Researcher encountered an error. 
    Suggested Precedents:
    - K.M. Nanavati v. State of Maharashtra (Link: https://indiankanoon.org/search/?q=K.M.+Nanavati+v.+State+of+Maharashtra)
    - Bachan Singh v. State of Punjab (Link: https://indiankanoon.org/search/?q=Bachan+Singh+v.+State+of+Punjab)`;
  }
};

/**
 * 2. Scribe Agent
 * Purpose: Drafts legal documents based on templates
 */
const runScribeAgent = async (documentType, caseContext) => {
  const promptText = `
    You are an expert Legal Scribe Agent.
    Case Context: ${caseContext}
    Requested Document Type: ${documentType}
    
    Draft a professional, court-ready document based on the requested type. 
    Include standard headers (In the Court of..., Case No..., etc.).
    Use placeholder brackets like [Court Name] where information is missing.
    Ensure formal legal tone and correct terminology.
  `;

  try {
    return await callGroq(promptText);
  } catch (error) {
    return `[Mock Scribe Fallback]\n\nIN THE COURT OF [Court Name]\n\nAPPLICATION FOR ${documentType.toUpperCase()}...\n\n(Drafting error occurred.)`;
  }
};

/**
 * 3. Auditor Agent
 * Purpose: Verifies citations and checks for hallucinations.
 * FIX: Enhanced prompt and structured output requirement.
 */
const runAuditorAgent = async (draftContent) => {
  if (!draftContent || draftContent.trim().length < 10) {
    return "Audit Failed: Draft content is too short or empty. Please generate or paste a draft first.";
  }

  const promptText = `
    You are an expert Legal Auditor Agent. Your job is to strictly review the following legal draft for hallucinations and factual errors.
    
    DRAFT CONTENT:
    """
    ${draftContent}
    """
    
    INSTRUCTIONS:
    1. Scan for any cited laws (IPC, CrPC, etc.) and confirm if they exist.
    2. Check for "Hallucinated Claims" - does the AI invent facts not present in common legal practice?
    3. Identify tone issues (is it overly aggressive or unprofessional?).
    4. Provide a structured report:
       - CITATION CHECK: [OK/ERRORS]
       - FACTUAL INTEGRITY: [HIGH/LOW]
       - HALLUCINATION DETECTED: [YES/NO]
       - VERDICT: [PASS/FAIL]
       - RECOMMENDATIONS: [Brief list]
  `;

  try {
    const auditReport = await callGroq(promptText);
    return auditReport;
  } catch (error) {
    console.error("Auditor Agent failed:", error.message);
    return "AI Auditor Error: Unable to verify draft at this time. Please ensure the Groq API key is valid and has sufficient quota.";
  }
};

/**
 * 4. Notice Extraction Agent
 * Purpose: Extracts key details from a legal notice.
 */
const runNoticeExtractionAgent = async (noticeText) => {
  const promptText = `
    You are an expert Legal Document Parser.
    Extract the following details from this Legal Notice text in JSON format:
    1. Case Number (if available)
    2. Parties involved (Petitioner vs Respondent)
    3. Next Hearing Date (in YYYY-MM-DD format if found, else null)
    4. Court Name
    5. Brief Summary of the notice

    JSON Output Format:
    {
      "caseNumber": "string or null",
      "parties": "string or null",
      "hearingDate": "YYYY-MM-DD or null",
      "courtName": "string or null",
      "summary": "string"
    }

    TEXT TO PARSE:
    """
    ${noticeText}
    """

    IMPORTANT: ONLY return the JSON object, nothing else.
  `;

  try {
    const response = await callGroq(promptText);
    // Clean potential markdown wrap
    const jsonStr = response.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Notice Extraction failed:", error.message);
    throw new Error("Failed to extract notice data.");
  }
};

module.exports = {
  runResearcherAgent,
  runScribeAgent,
  runAuditorAgent,
  runNoticeExtractionAgent
};
