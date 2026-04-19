const { PromptTemplate } = require("@langchain/core/prompts");
const { queryStore } = require('./ragService');
const { fetchLegalPrecedents } = require('./kaggleService');
const Groq = require("groq-sdk");
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper to build the MCP live context string
const buildMCPContext = (caseData, hearingData) => {
  return `
    CASE CONTEXT:
    - Case ID: ${caseData._id}
    - Client: ${caseData.clientDetails?.name || 'N/A'}
    - Background: ${caseData.clientDetails?.background || 'N/A'}
    - Case Type: ${caseData.caseType || 'N/A'}

    HEARING CONTEXT:
    - Hearing Date: ${hearingData.hearingDate}
    - Lawyer Notes: ${hearingData.notes}
  `;
};

// Groq API Client
const callGroq = async (promptText) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: promptText }],
      model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (err) {
    console.error("Groq API Error:", err);
    throw err;
  }
};

// Main Agent for handling Chat
const processChatQuery = async (caseData, hearingData, query) => {
  const mcpContext = buildMCPContext(caseData, hearingData);
  const ragResults = await queryStore(caseData._id.toString(), query);
  const ragContext = ragResults.map(r => r.pageContent).join('\n\n');
  const kaggleResults = await fetchLegalPrecedents(query);
  const kaggleContext = kaggleResults.map(k => `${k.title}: ${k.summary}`).join('\n');

  const promptText = `
    You are an expert Legal AI Assistant. Answer the user's query using the provided context.
    Do not make up facts. Be highly professional.

    Context:
    ${mcpContext}
    ---
    Extracted Evidence:
    ${ragContext || 'No relevant internal documents found.'}
    ---
    External Precedents:
    ${kaggleContext || 'No relevant Kaggle insights found.'}
    ---
    User Query: ${query}
  `;
  
  try {
    const responseText = await callGroq(promptText);

    return {
      text: responseText,
      transparency: {
        mcpUsed: true,
        ragSources: ragResults.map(r => r.metadata.fileName || 'Unknown Doc'),
        kaggleSources: kaggleResults.map(k => k.source)
      }
    };
  } catch (error) {
    console.warn("Groq API Failed. Falling back to Mock AI.");
    return {
      text: "**[MOCK AI RESPONSE]** There was an error connecting to Groq. This is a simulated response.\n\nBased on the context provided, the case details have been processed. If you would like me to generate the final reports, just type **'Generate report'**.",
      transparency: {
        mcpUsed: true,
        ragSources: ragResults.map(r => r.metadata.fileName || 'Unknown Doc'),
        kaggleSources: kaggleResults.map(k => k.source)
      }
    };
  }
};

// Report Generation Agent
const generateReports = async (caseData, hearingData) => {
  const mcpContext = buildMCPContext(caseData, hearingData);
  const ragResults = await queryStore(caseData._id.toString(), "summary key events entities");
  const ragContext = ragResults.map(r => r.pageContent).join('\n\n');
  const kaggleResults = await fetchLegalPrecedents("case laws precedent arguments");
  const kaggleContext = kaggleResults.map(k => `${k.title}: ${k.summary}`).join('\n');

  // 1. Generate Summarization Report
  const summaryPrompt = `
    Create a highly professional Summarization Report for the following hearing.
    Format nicely with markdown.
    Include:
    - Case Summary
    - Hearing Key Events
    - Important Entities
    
    Context:
    ${mcpContext}
    ---
    Evidence:
    ${ragContext}
  `;

  // 2. Generate Assistance Report
  const assistancePrompt = `
    Create a highly professional Legal Assistance Report.
    Format nicely with markdown.
    Include:
    - Strategic Insights
    - Suggested Arguments
    - Relevant Case Laws (Cite sources)
    
    Context:
    ${mcpContext}
    ---
    Precedents:
    ${kaggleContext}
  `;

  try {
    const [summarizationContent, assistanceContent] = await Promise.all([
      callGroq(summaryPrompt),
      callGroq(assistancePrompt)
    ]);

    return {
      summarizationReport: summarizationContent,
      assistanceReport: assistanceContent
    };
  } catch (error) {
    console.warn("Groq API Failed for Reports. Falling back to Mock Reports.");
    return {
      summarizationReport: "# Summarization Report (Mock)\n\nThis is a simulated report generated because the AI service is currently unavailable.\n\n## Key Events\n- Hearing Date: " + hearingData.hearingDate + "\n- Notes: " + hearingData.notes,
      assistanceReport: "# Assistance Report (Mock)\n\nThis is a simulated report generated because the AI service is currently unavailable.\n\n## Suggested Arguments\n1. Argue that the evidence clearly shows a breach of contract based on the uploaded documents.\n2. Request a continuance if the opposing counsel fails to produce discovery.\n\n## Relevant Case Law\n- *Mock v. Example (2026)* - Established precedent for this mock scenario."
    };
  }
};

module.exports = {
  processChatQuery,
  generateReports
};
