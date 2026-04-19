import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Send, FileText, Download, ShieldCheck,
  Database, BrainCircuit, Loader2, Clock, Building2, User,
  Scale, X, CheckCircle2, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';

/* ─── Helpers ─────────────────────────────────────────────── */
const fileIcon = (type = '') => {
  if (type.startsWith('image/'))  return '🖼️';
  if (type.startsWith('video/'))  return '🎬';
  if (type.startsWith('audio/'))  return '🎵';
  if (type.includes('pdf'))       return '📄';
  return '📎';
};

const formatBytes = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

/* ─── Drop Zone Component ──────────────────────────────────── */
const DropZone = ({ onFileSelect, accept, file, uploading, onUpload, onClear }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelect(dropped);
  }, [onFileSelect]);

  const handleDrag = (e) => { e.preventDefault(); setDragOver(e.type === 'dragover'); };

  return (
    <div>
      {/* Drop target */}
      <div
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          dragOver
            ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
            : file
            ? 'border-cyan-500/60 bg-cyan-500/5'
            : 'border-violet-500/30 bg-slate-900/40 hover:border-cyan-500/60 hover:bg-cyan-500/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }}
        />

        {file ? (
          /* File selected preview */
          <div className="p-4 flex items-center gap-3">
            <span className="text-2xl">{fileIcon(file.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{file.name}</p>
              <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onClear(); if (inputRef.current) inputRef.current.value = ''; }}
              className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="p-6 text-center">
            <Upload size={28} className="mx-auto text-cyan-500/60 mb-2" />
            <p className="text-sm font-medium text-slate-300">Drag & drop or <span className="text-cyan-400 underline">browse</span></p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOC, Images, Audio, Video — any format</p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && (
        <button
          type="button"
          onClick={onUpload}
          disabled={uploading}
          className="mt-3 w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
        >
          {uploading
            ? <><Loader2 size={15} className="animate-spin" /> Encrypting & Uploading…</>
            : <><ShieldCheck size={15} /> Secure Upload</>}
        </button>
      )}
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────── */
const HearingPage = () => {
  const { caseId, hearingId } = useParams();
  const navigate = useNavigate();

  const [hearing, setHearing]         = useState(null);
  const [file, setFile]               = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [chatInput, setChatInput]     = useState('');
  const [messages, setMessages]       = useState([]);
  const [isTyping, setIsTyping]       = useState(false);
  const chatEndRef                    = useRef(null);

  // Mobile: toggle between sidebar (docs) and chat
  const [mobileTab, setMobileTab]     = useState('chat'); // 'details' | 'chat'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetchHearing(); }, [hearingId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── Fetch ──────────────────────────── */
  const fetchHearing = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/hearings/${hearingId}`);
      setHearing(res.data);
    } catch (err) {
      console.error('Fetch hearing error', err);
    }
  };

  /* ── Upload ─────────────────────────── */
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`http://localhost:5000/api/hearings/${hearingId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      fetchHearing();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /* ── Download ───────────────────────── */
  const handleDownload = async (docId, fileName) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/hearings/${hearingId}/document/${docId}`,
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error', err);
    }
  };

  /* ── Chat ───────────────────────────── */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query) return;

    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await axios.post(`http://localhost:5000/api/hearings/${hearingId}/chat`, { query });

      if (query.toLowerCase() === 'generate report') {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: '✅ Reports generated and stored securely. Check the Reports section in the sidebar.',
          transparency: { mcpUsed: true, ragSources: [], kaggleSources: [] }
        }]);
        fetchHearing();
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: res.data.text,
          transparency: res.data.transparency
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Error processing your request. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  /* ── Loading ─────────────────────── */
  if (!hearing) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-violet-400" size={32} />
    </div>
  );

  /* ── Sidebar content (shared between desktop and mobile drawer) */
  const SidebarContent = () => (
    <div className="flex flex-col gap-4 h-full">
      {/* Hearing Meta */}
      <div className="glass-card p-4 border-violet-500/10">
        <h2 className="text-base font-bold mb-3 border-b border-violet-500/10 pb-2 text-slate-200">Hearing Details</h2>
        <div className="space-y-2 text-sm">
          {hearing.hearingTime && (
            <div className="flex items-center gap-2 text-slate-300">
              <Clock size={13} className="text-violet-400 flex-shrink-0" />
              {hearing.hearingTime}
            </div>
          )}
          {hearing.courtName && (
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 size={13} className="text-violet-400 flex-shrink-0" />
              {hearing.courtName}
            </div>
          )}
          {hearing.judgeName && (
            <div className="flex items-center gap-2 text-slate-300">
              <User size={13} className="text-violet-400 flex-shrink-0" />
              {hearing.judgeName}
            </div>
          )}
          {hearing.hearingType && (
            <div className="flex items-center gap-2 text-slate-300">
              <Scale size={13} className="text-violet-400 flex-shrink-0" />
              {hearing.hearingType}
            </div>
          )}
        </div>
        {hearing.notes && (
          <div className="mt-3 pt-3 border-t border-violet-500/10">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{hearing.notes}</p>
          </div>
        )}
      </div>

      {/* Secure Upload */}
      <div className="glass-card p-4 border-violet-500/10">
        <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-slate-200">
          <ShieldCheck size={16} className="text-emerald-500" /> Secure Upload
        </h2>
        <p className="text-xs text-slate-500 mb-3">Files are AES-256 encrypted and indexed for AI analysis.</p>

        <DropZone
          file={file}
          uploading={uploading}
          onFileSelect={setFile}
          onUpload={handleUpload}
          onClear={() => setFile(null)}
          accept="*"
        />

        {uploadSuccess && (
          <div className="mt-2 flex items-center gap-2 text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg p-2">
            <CheckCircle2 size={14} /> File uploaded and encrypted successfully!
          </div>
        )}
        {uploadError && (
          <div className="mt-2 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            <AlertCircle size={14} /> {uploadError}
          </div>
        )}

        {/* Uploaded docs list */}
        {hearing.documents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded ({hearing.documents.length})</p>
            {hearing.documents.map(doc => (
              <div key={doc._id} className="flex items-center gap-2 p-2 bg-slate-950/60 rounded border border-violet-500/10 group">
                <span className="text-base flex-shrink-0">{fileIcon(doc.originalType)}</span>
                <span className="text-xs truncate flex-1 text-slate-300">{doc.fileName}</span>
                <button
                  onClick={() => handleDownload(doc._id, doc.fileName)}
                  className="flex-shrink-0 p-1 text-slate-500 hover:text-violet-400 rounded transition-colors"
                  title="Decrypt & Download"
                >
                  <Download size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports */}
      <div className="glass-card p-4 flex-1 border-violet-500/10">
        <h2 className="text-base font-bold mb-1 text-slate-200">Finalized Reports</h2>
        <p className="text-xs text-slate-500 mb-3">Encrypted reports. Type <strong className="text-violet-400">"Generate report"</strong> in chat to create.</p>

        {hearing.reports.length === 0 ? (
          <div className="text-center py-6 text-gray-600">
            <FileText size={28} className="mx-auto opacity-30 mb-2" />
            <p className="text-xs">No reports yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hearing.reports.map(report => (
              <div key={report._id} className="p-3 bg-slate-950/60 rounded border border-violet-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-400">{report.type} Report</span>
                  <button
                    onClick={() => handleDownload(report._id, `${report.type}_Report.txt`)}
                    className="text-slate-400 hover:text-violet-400 transition-colors"
                    title="Download"
                  >
                    <Download size={13} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto flex flex-col pb-4" style={{ height: 'calc(100vh - 80px)' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <button
          onClick={() => navigate(`/cases/${caseId}`)}
          className="p-2 hover:bg-violet-500/20 rounded-lg transition-colors flex-shrink-0 text-slate-300"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold truncate text-slate-100">
            Hearing — {new Date(hearing.hearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-tight">MCP context active · RAG indexed</p>
        </div>

        {/* Mobile: toggle sidebar drawer */}
        <button
          className="lg:hidden flex items-center gap-1 text-xs bg-violet-500/20 text-violet-400 px-3 py-1.5 rounded-lg border border-violet-500/30 font-bold"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FileText size={13} />
          Docs {sidebarOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
        </button>
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      {sidebarOpen && (
        <div className="lg:hidden mb-3 max-h-[50vh] overflow-y-auto custom-scrollbar flex-shrink-0">
          <SidebarContent />
        </div>
      )}

      {/* ── Main Body ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left sidebar — desktop only */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col gap-4 overflow-y-auto custom-scrollbar flex-shrink-0 pr-1">
          <SidebarContent />
        </div>

        {/* ── Chat Column ── */}
        <div className="flex-1 glass-card flex flex-col overflow-hidden min-w-0 border-violet-500/10">

          {/* Chat header */}
          <div className="p-3 sm:p-4 border-b border-violet-500/10 bg-slate-950/40 flex flex-wrap justify-between items-center gap-2 flex-shrink-0">
            <h2 className="font-bold flex items-center gap-2 text-sm sm:text-base text-slate-200">
              <BrainCircuit size={16} className="text-cyan-400" /> Intelligence Module
            </h2>
            <div className="flex gap-2 text-[10px] sm:text-xs">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Database size={10}/> MCP
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                <Database size={10}/> RAG
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 text-center px-4">
                <BrainCircuit size={40} className="opacity-20" />
                <p className="text-sm">I have full context of this case and hearing.</p>
                <p className="text-xs max-w-xs text-gray-600">
                  Ask me anything or type <strong className="text-gray-400">"Generate report"</strong> when ready to finalize.
                </p>
                {/* Quick prompts */}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {['Summarize this hearing', 'What are the key legal issues?', 'Generate report'].map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => setChatInput(prompt)}
                      className="text-xs px-3 py-1.5 rounded-full border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-colors font-medium"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] sm:max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-br-sm shadow-lg shadow-violet-500/10'
                    : 'bg-slate-900 border border-violet-500/10 text-slate-200 rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.role === 'ai' && msg.transparency && (
                  <div className="mt-1 text-[10px] text-gray-600 flex flex-wrap gap-2 ml-1">
                    {msg.transparency.ragSources?.length > 0 &&
                      <span>📎 {msg.transparency.ragSources.join(', ')}</span>}
                    {msg.transparency.kaggleSources?.length > 0 &&
                      <span>📊 {msg.transparency.kaggleSources.join(', ')}</span>}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-slate-900 border border-violet-500/10 text-slate-400 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-cyan-400" />
                  <span className="text-xs">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-violet-500/10 bg-slate-950/60 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask a question or type 'Generate report'…"
              className="flex-1 bg-slate-900 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none transition-colors min-w-0 text-slate-200"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isTyping}
              className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white p-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HearingPage;
