// In a production app, we would use a persistent store (e.g., MongoDB Atlas Vector Search).
// For this MVP, we use a simple in-memory store.
const stores = new Map();

const getStore = (caseId) => {
  if (!stores.has(caseId)) {
    stores.set(caseId, []);
  }
  return stores.get(caseId);
};

const addDocumentToStore = async (caseId, text, metadata = {}) => {
  if (!text || text.trim() === '') return;
  
  const store = getStore(caseId);
  
  // Simple chunking strategy for the text
  const chunks = text.match(/[\s\S]{1,1000}/g) || [];
  
  chunks.forEach(chunk => {
    store.push({
      pageContent: chunk,
      metadata: metadata
    });
  });
};

const queryStore = async (caseId, query, limit = 3) => {
  if (!stores.has(caseId)) return [];
  const store = getStore(caseId);
  
  // Basic substring / keyword match for MVP purposes instead of actual vector math
  // to avoid complex dependency conflicts.
  const queryTerms = query.toLowerCase().split(' ');
  
  const scoredDocs = store.map(doc => {
    let score = 0;
    const content = doc.pageContent.toLowerCase();
    queryTerms.forEach(term => {
      if (term.length > 3 && content.includes(term)) {
        score++;
      }
    });
    return { ...doc, score };
  });

  // Sort by score and take top 'limit' docs, or just take the first few if no match
  scoredDocs.sort((a, b) => b.score - a.score);
  
  return scoredDocs.slice(0, limit);
};

module.exports = {
  addDocumentToStore,
  queryStore
};
