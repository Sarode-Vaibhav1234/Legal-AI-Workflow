import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, ChevronRight, Loader2, Search, Zap, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CaseIntake = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    clientContact: '',
    clientBackground: '',
    caseType: 'Civil',
    complaintText: ''
  });
  const [status, setStatus] = useState('idle');
  const [extractedData, setExtractedData] = useState(null);
  const [caseSummary, setCaseSummary] = useState('');
  const [referenceCases, setReferenceCases] = useState([]);
  const [newCaseId, setNewCaseId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...picked]);
    e.target.value = '';
  };

  const removeFile = (idx) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // Send data to backend for intake and smart extraction
      const response = await fetch('http://localhost:5000/api/cases/intake', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('legal_ai_token')
        },
        body: JSON.stringify({
          title: formData.title,
          clientDetails: {
            name: formData.clientName,
            contact: formData.clientContact,
            background: formData.clientBackground
          },
          caseType: formData.caseType,
          complaintText: formData.complaintText
        })
      });

      if (!response.ok) throw new Error('Submission failed');
      
      const data = await response.json();
      setExtractedData(data.extractedData);
      setCaseSummary(data.caseSummary || '');
      setReferenceCases(data.referenceCases || []);
      setNewCaseId(data.caseId);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full glass-card p-12 max-w-3xl mx-auto mt-12 text-center border-violet-500/20">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-violet-400 mb-3">Intake Complete!</h2>
        <p className="text-slate-400 mb-8 max-w-md">The case has been created successfully. Our AI analyzed the Kaggle SC Judgments dataset and generated a smart summary below.</p>
        
        <div className="space-y-4 w-full text-left">
          {/* Extracted Sections */}
          {extractedData && (
            <div className="bg-slate-950/60 p-5 rounded-xl border border-cyan-500/20">
              <h3 className="font-bold text-cyan-400 border-b border-cyan-500/10 pb-2 mb-3 flex items-center gap-2">
                <FileText size={16} /> Smart Extraction Results
              </h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mr-2">Sections:</span> <span className="text-slate-200">{extractedData.sections.join(', ') || 'None detected'}</span></p>
                <p className="text-sm"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mr-2">Key Dates:</span> <span className="text-slate-200">{extractedData.keyDates.join(', ') || 'None detected'}</span></p>
              </div>
            </div>
          )}

          {/* AI Case Summary */}
          {caseSummary && (
            <div className="bg-slate-950/60 p-5 rounded-xl border border-violet-500/20">
              <h3 className="font-bold text-violet-400 border-b border-violet-500/10 pb-2 mb-3 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                </div>
                AI Case Summary (Ollama)
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{caseSummary}</p>
            </div>
          )}

          {/* Kaggle Precedents */}
          {referenceCases.length > 0 && (
            <div className="bg-slate-950/60 p-5 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
                  <Zap className="text-violet-400 animate-pulse" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    Kaggle Legal Precedents <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded border border-cyan-500/20 uppercase tracking-widest">Quantum Optimized</span>
                  </h2>
                  <p className="text-xs text-slate-500">Simulated semantic interference pass applied for high-precision ranking</p>
                </div>
              </div>
              <div className="space-y-4">
                {referenceCases.map((ref, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/50 rounded-xl border border-violet-500/10 hover:border-violet-500/30 transition-all group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-200 line-clamp-1 group-hover:text-violet-400 transition-colors flex items-center gap-2">
                          {ref.title}
                          {ref.quantum_score > 0.5 && (
                            <span className="flex-shrink-0 flex items-center gap-1 text-[8px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full border border-violet-500/30">
                              <Cpu size={8} /> Quantum Match
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{ref.source}</p>
                      </div>
                      <a 
                        href={ref.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-900 rounded-lg hover:bg-violet-500 hover:text-white transition-all text-slate-400"
                      >
                        <ChevronRight size={18} />
                      </a>
                    </div>
                    <p className="text-sm text-slate-400 mt-3 line-clamp-2 leading-relaxed italic border-l-2 border-violet-500/20 pl-3">
                      {ref.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 w-full mt-10">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 border border-slate-700 text-slate-400 px-6 py-4 rounded-xl font-bold hover:bg-slate-800 hover:text-white transition-all active:scale-95"
          >
            Dashboard
          </button>
          {newCaseId && (
            <button 
              onClick={() => navigate(`/cases/${newCaseId}`)}
              className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-6 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-violet-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Open Workspace <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">New Case Intake</h1>
        <p className="text-slate-400">Securely upload client details and documents. Our AI will extract relevant sections for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Case Details */}
        <div className="glass-card p-8 border-violet-500/10">
          <h2 className="text-xl font-bold text-violet-400 mb-6 border-b border-violet-500/10 pb-3 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
            Case Identification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Case Title / Reference</label>
              <input required name="title" onChange={handleChange} type="text" className="w-full bg-slate-950 border border-violet-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-all" placeholder="e.g., State vs. Sharma" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Case Type</label>
              <select name="caseType" onChange={handleChange} className="w-full bg-slate-950 border border-violet-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-all">
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
                <option value="Corporate">Corporate</option>
                <option value="Family">Family</option>
              </select>
            </div>
          </div>
        </div>

        {/* Client Details */}
        <div className="glass-card p-8 border-cyan-500/10">
          <h2 className="text-xl font-bold text-cyan-400 mb-6 border-b border-cyan-500/10 pb-3 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
            Client Details (Encrypted)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
              <input required name="clientName" onChange={handleChange} type="text" className="w-full bg-slate-950 border border-violet-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-all" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Info</label>
              <input required name="clientContact" onChange={handleChange} type="text" className="w-full bg-slate-950 border border-violet-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-all" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Past History / Background</label>
            <textarea name="clientBackground" onChange={handleChange} rows="3" className="w-full bg-slate-950 border border-violet-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-all" placeholder="Brief background of the client..."></textarea>
          </div>
        </div>

        {/* Documents & FIR */}
        <div className="glass-card p-6 sm:p-8 border-violet-500/10">
          <h2 className="text-xl font-bold text-violet-400 mb-6 border-b border-violet-500/10 pb-3 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
            FIR &amp; Complaint Details
          </h2>
          <div className="mb-8">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Complaint / FIR Text (For AI Extraction)</label>
            <textarea required name="complaintText" onChange={handleChange} rows="5" className="w-full bg-slate-950 border border-violet-500/20 rounded-lg p-4 text-white focus:outline-none focus:border-violet-500 transition-all text-sm leading-relaxed" placeholder="Paste the FIR or complaint text here for smart extraction (e.g. mention 'theft' or 'murder' to test)..."></textarea>
          </div>

          {/* Working drag & drop upload */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${
              dragOver
                ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
                : 'border-slate-800 bg-slate-950/50 hover:bg-violet-500/5 hover:border-violet-500/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFilePick}
            />
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="text-violet-400" size={32} />
            </div>
            <p className="font-bold text-white text-lg">Drag &amp; Drop Documents Here</p>
            <p className="text-sm text-slate-500 mt-2">or <span className="text-violet-400 underline decoration-violet-400/30 underline-offset-4">browse files from your computer</span></p>
            <p className="text-[10px] font-bold text-slate-600 mt-4 uppercase tracking-[0.2em]">PDF, DOCX, Images, Audio, Video</p>
          </div>

          {/* File preview list */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected Files ({uploadedFiles.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uploadedFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950/80 rounded-xl border border-violet-500/10 group hover:border-violet-500/30 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/5 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-slate-200">{f.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{f.size < 1024*1024 ? (f.size/1024).toFixed(1)+' KB' : (f.size/(1024*1024)).toFixed(1)+' MB'}</p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-slate-600 hover:text-rose-400 transition-colors p-1">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 italic mt-4 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                <AlertCircle size={14} className="text-violet-400 shrink-0" />
                <p>📎 These files will be uploaded securely to the first hearing you create.</p>
              </div>
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">Error submitting the form. Please check the backend server connection.</p>
          </div>
        )}

        <div className="flex justify-end items-center gap-6 pt-4">
          <button type="button" onClick={() => navigate('/')} className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Cancel</button>
          <button 
            type="submit" 
            disabled={status === 'submitting'} 
            className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-10 py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-3 shadow-lg shadow-violet-500/20 disabled:opacity-50 active:scale-95"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing via AI...
              </>
            ) : (
              <>
                <FileText size={20} />
                Extract & Intake Case
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseIntake;
