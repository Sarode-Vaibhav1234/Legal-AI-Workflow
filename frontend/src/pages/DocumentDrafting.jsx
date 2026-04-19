import React, { useState, useEffect } from 'react';
import { FileText, Bot, ShieldCheck, Download, Edit, Loader2, Search, AlertCircle } from 'lucide-react';
import axios from 'axios';

const DocumentDrafting = () => {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [docType, setDocType] = useState('Bail Application');
  const [context, setContext] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
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
      console.error('Error fetching cases for drafting', err);
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

  const handleGenerateDraft = async () => {
    if (!context) return;
    setDrafting(true);
    setAuditReport(null);
    try {
      const response = await axios.post('http://localhost:5000/api/ai/draft', { 
        documentType: docType, 
        caseContext: context,
        caseId: selectedCaseId 
      });
      setDraft(response.data.result);
    } catch (err) {
      console.error(err);
      setDraft('Error connecting to AI Scribe. Ensure backend and Groq API are configured.');
    } finally {
      setDrafting(false);
    }
  };

  const handleAuditDraft = async () => {
    if (!draft) return;
    setAuditing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/ai/audit', { 
        draftContent: draft,
        caseId: selectedCaseId
      });
      setAuditReport(response.data.result);
    } catch (err) {
      console.error(err);
      setAuditReport('Error connecting to AI Auditor.');
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] pb-10">
      {/* Left Panel: Settings & Audit */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:pr-6 lg:border-r border-violet-500/30 overflow-y-auto custom-scrollbar pr-2">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <FileText className="text-violet-400" size={32} />
            AI Drafting
          </h1>
          <p className="text-slate-400 text-sm">Select a case to provide context for the AI Scribe Agent.</p>
        </div>

        <div className="glass-card p-6 flex flex-col gap-4 bg-slate-950/40 border-violet-500/20">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Case</label>
            {loadingCases ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 size={14} className="animate-spin text-violet-400" /> Loading cases...
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

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Document Type</label>
            <select 
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-900 border border-violet-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
            >
              <option>Bail Application</option>
              <option>Legal Notice</option>
              <option>Writ Petition</option>
              <option>Affidavit</option>
              <option>Interlocutory Application</option>
              <option>Vakalatnama</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">AI Context (Auto-filled)</label>
            <textarea 
              className="w-full bg-slate-900 border border-violet-500/20 rounded-lg p-3 text-xs text-slate-400 focus:outline-none focus:border-violet-500 min-h-[100px]"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Case details will appear here..."
            />
          </div>

          <button 
            onClick={handleGenerateDraft}
            disabled={drafting || !selectedCaseId}
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-lg shadow-violet-500/20 active:scale-95"
          >
            {drafting ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
            {drafting ? 'AI is drafting...' : 'Generate AI Draft'}
          </button>
        </div>

        {/* Auditor Panel */}
        <div className="glass-card p-6 flex flex-col overflow-hidden border-violet-500/20 shadow-2xl bg-slate-950/40 min-h-[500px] mb-6">
          <div className="flex items-center justify-between mb-4 border-b border-violet-500/10 pb-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
              <ShieldCheck size={22} className="text-violet-400" />
              AI Compliance Auditor
            </h2>
            {auditReport && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Audit Ready
              </span>
            )}
          </div>

          <button 
            onClick={handleAuditDraft}
            disabled={auditing || !draft}
            className="w-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 px-4 py-3 rounded-lg font-bold hover:bg-cyan-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-4 shadow-lg shadow-cyan-500/10"
          >
            {auditing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            {auditing ? 'Verifying Compliance...' : 'Run Precision Audit'}
          </button>
          
          <div className="flex-1 overflow-y-auto text-sm text-slate-100 bg-slate-950/60 rounded-xl p-5 border border-violet-500/10 font-sans leading-relaxed custom-scrollbar shadow-inner">
            {auditReport ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg mb-4">
                  <AlertCircle size={18} className="text-violet-400 mt-0.5" />
                  <p className="text-xs text-violet-400 leading-normal font-medium">
                    Analysis complete. Check for potential hallucinations or section mismatches below.
                  </p>
                </div>
                <div className="whitespace-pre-wrap text-slate-300">
                  {auditReport}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-40 italic text-center px-4">
                <div className="w-16 h-16 rounded-full bg-violet-500/5 flex items-center justify-center mb-4">
                  <Search size={32} className="text-violet-400" />
                </div>
                <p className="text-base font-medium mb-1 text-slate-300">Audit Queue Empty</p>
                <p className="text-[11px] text-slate-500">Generate a draft and click 'Run Precision Audit' to verify legal accuracy.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Document Editor */}
      <div className="w-full lg:w-2/3 lg:pl-6 flex flex-col h-[600px] lg:h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-200">
            <Edit size={20} className="text-violet-400" />
            Legal Draft Editor
          </h2>
          <div className="flex gap-2">
            <button className="bg-slate-900 border border-violet-500/30 text-slate-300 px-3 py-1.5 rounded text-sm hover:border-violet-500 transition-colors">
              Save
            </button>
            <button className="bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded text-sm font-bold hover:bg-cyan-500/30 transition-colors flex items-center gap-2">
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>
        <div className="flex-1 glass-card p-0 overflow-hidden flex flex-col border-violet-500/20 shadow-2xl">
          {drafting ? (
            <div className="flex flex-col items-center justify-center h-full text-violet-400">
              <div className="relative">
                 <Bot size={64} className="mb-4 animate-bounce" />
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
              </div>
              <p className="font-bold tracking-widest uppercase text-xs">AI Scribe is constructing your {docType}...</p>
            </div>
          ) : (
            <textarea 
              className="w-full h-full bg-slate-950/80 p-10 text-slate-200 focus:outline-none resize-none font-serif text-base leading-loose shadow-inner"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Your generated legal draft will appear here. Select a case and click 'Generate' to start."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDrafting;
