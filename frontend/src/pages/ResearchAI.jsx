import React, { useState, useEffect } from 'react';
import { Search, Bot, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const ResearchAI = () => {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [query, setQuery] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/cases');
      setCases(res.data);
      if (res.data.length > 0) {
        setSelectedCaseId(res.data[0]._id);
        updateContext(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching cases for research', err);
    } finally {
      setLoadingCases(false);
    }
  };

  const updateContext = (c) => {
    const ctx = `Case: ${c.title}\nType: ${c.caseType}\nSummary: ${c.caseSummary || 'No summary available.'}\nSections: ${c.extractedData?.sections?.join(', ') || 'N/A'}`;
    setContext(ctx);
  };

  const handleCaseChange = (e) => {
    const id = e.target.value;
    setSelectedCaseId(id);
    const c = cases.find(item => item._id === id);
    if (c) updateContext(c);
  };

  const handleResearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/ai/research', { 
        query, 
        caseContext: context,
        caseId: selectedCaseId 
      });
      setResult(response.data.result);
    } catch (err) {
      console.error(err);
      setResult('Error connecting to AI Researcher. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="text-violet-400" size={32} />
          Legal Research AI
        </h1>
        <p className="text-slate-400 mt-2">Query precedents, case laws, and legal strategies for your active case.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Query Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border-violet-500/10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-200">
              <BookOpen size={18} className="text-violet-400" />
              Active Context
            </h2>
            
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Select Case</label>
              {loadingCases ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 size={14} className="animate-spin text-violet-400" /> Loading...
                </div>
              ) : (
                <select 
                  value={selectedCaseId}
                  onChange={handleCaseChange}
                  className="w-full bg-slate-900 border border-violet-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                >
                  {cases.length === 0 && <option>No cases found</option>}
                  {cases.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              )}
            </div>

            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI Context (Auto-filled)</label>
            <textarea 
              className="w-full bg-slate-900 border border-violet-500/20 rounded-lg p-3 text-xs text-slate-400 focus:outline-none focus:border-violet-500"
              rows="5"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <p className="text-[10px] text-slate-500 mt-2 italic">The AI uses this context to ground its research.</p>

            {/* Reference Cases Display */}
            {cases.find(c => c._id === selectedCaseId)?.referenceCases?.length > 0 && (
              <div className="mt-6 border-t border-violet-500/20 pt-4">
                <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BookOpen size={14} /> Similar Case Precedents
                </h3>
                <div className="space-y-3">
                  {cases.find(c => c._id === selectedCaseId).referenceCases.map((ref, i) => (
                    <div key={i} className="p-3 bg-slate-950 border border-violet-500/10 rounded-lg text-[11px]">
                      <h4 className="font-bold text-slate-200">{ref.title}</h4>
                      <p className="text-slate-500 mt-1 line-clamp-2">{ref.summary}</p>
                      {ref.url && (
                        <a 
                          href={ref.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline mt-2 inline-block font-bold"
                        >
                          View Full Document ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-6 border-violet-500/10">
            <h2 className="text-lg font-bold mb-4 text-slate-200">Research Query</h2>
            <textarea 
              className="w-full bg-slate-900 border border-violet-500/30 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-violet-500 mb-4"
              rows="4"
              placeholder="e.g. Find similar cases where CCTV evidence was dismissed due to chain of custody issues..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              onClick={handleResearch}
              disabled={loading || !selectedCaseId}
              className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/20 active:scale-95"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {loading ? 'Analyzing...' : 'Run Query'}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 glass-card p-8 flex flex-col h-[600px] lg:h-auto border-violet-500/10">
          <h2 className="text-xl font-bold mb-6 border-b border-violet-500/30 pb-4 text-slate-200">Research Findings</h2>
          
          <div className="flex-1 bg-slate-950/40 rounded-xl border border-violet-500/20 p-6 overflow-y-auto font-sans">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-violet-400 animate-pulse">
                <Bot size={64} className="mb-4" />
                <p className="font-bold tracking-widest uppercase text-xs">AI Researcher is analyzing precedents...</p>
              </div>
            ) : result ? (
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                <Search size={64} className="mb-4" />
                <p className="font-medium">Enter a query to begin AI research.</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex gap-3 text-xs text-cyan-200 shadow-lg shadow-cyan-500/5">
            <AlertCircle size={20} className="shrink-0 text-cyan-400" />
            <p><strong>Auditor Note:</strong> All AI-generated citations should be independently verified before court submission. Use the Draft Auditor tool to cross-check.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchAI;
