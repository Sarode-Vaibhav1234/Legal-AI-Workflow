import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Calendar, FileText, X, Trash2, ShieldCheck, Briefcase,
  Clock, Building2, User, Scale, ChevronRight, Loader2, BookOpen, AlertCircle, Mail
} from 'lucide-react';
import axios from 'axios';

const HEARING_TYPES = ['Argument', 'Evidence', 'Final Hearing', 'Bail', 'Mention', 'Judgment', 'Other'];

const HEARING_TYPE_COLORS = {
  'Argument':      { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  'Evidence':      { bg: 'bg-purple-500/10',  text: 'text-purple-400', border: 'border-purple-500/30' },
  'Final Hearing': { bg: 'bg-rose-500/10',     text: 'text-rose-400',    border: 'border-rose-500/30' },
  'Bail':          { bg: 'bg-cyan-500/10',  text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Mention':       { bg: 'bg-slate-500/10',    text: 'text-slate-400',   border: 'border-slate-500/30' },
  'Judgment':      { bg: 'bg-emerald-500/10',   text: 'text-emerald-400',  border: 'border-emerald-500/30' },
  'Other':         { bg: 'bg-violet-500/10',  text: 'text-violet-400', border: 'border-violet-500/30' },
};

const emptyForm = {
  hearingDate: '',
  hearingTime: '',
  courtName: '',
  judgeName: '',
  hearingType: 'Other',
  notes: '',
};

const CaseWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hearings, setHearings]         = useState([]);
  const [caseDetails, setCaseDetails]   = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');
  const [deletingId, setDeletingId]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [notices, setNotices]           = useState([]);

  useEffect(() => {
    if (id) {
      fetchCaseDetails();
      fetchHearings();
      fetchNotices();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchNotices = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/notices/case/${id}`, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setNotices(res.data);
    } catch (err) {
      console.error('Error fetching notices', err);
    }
  };

  /* ─── Data Fetching ─────────────────────────────── */
  const fetchCaseDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/cases/${id}`, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setCaseDetails(res.data);
    } catch (err) {
      console.error('Error fetching case details', err);
      setCaseDetails({ title: 'Unknown Case', caseType: 'Unknown' });
    }
  };

  const fetchHearings = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/hearings/case/${id}`, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setHearings(res.data);
    } catch (error) {
      console.error('Error fetching hearings', error);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Create Hearing ─────────────────────────────── */
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');
    if (!form.hearingDate) { setFormError('Hearing date is required.'); return; }
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:5000/api/hearings/case/${id}`, form, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setShowModal(false);
      setForm(emptyForm);
      fetchHearings();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create hearing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (hId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this hearing?')) return;
    setDeletingId(hId);
    try {
      await axios.delete(`http://localhost:5000/api/hearings/${hId}`, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setHearings(hearings.filter(h => h._id !== hId));
    } catch (err) {
      alert('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const typeStyle = type => HEARING_TYPE_COLORS[type] || HEARING_TYPE_COLORS['Other'];

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <div className="bg-violet-500/10 p-6 rounded-full mb-6">
          <Briefcase size={64} className="text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Case Selected</h2>
        <p className="text-slate-400 max-w-md mb-8">Please select a case from the dashboard to view its workspace and hearings.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20"
        >
          <ArrowLeft size={20} /> Go to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="text-violet-400 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors mb-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold truncate max-w-xl">{caseDetails?.title}</h1>
            {caseDetails?.urgency === 'High' && (
              <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-tighter">
                High Priority
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {caseDetails?.clientDetails?.name
              ? `Client: ${caseDetails.clientDetails.name} • ${caseDetails.caseType}`
              : 'Case Workspace — Hearing-by-Hearing Tracking'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2 flex-shrink-0 shadow-lg shadow-violet-500/20"
        >
          <Plus size={20} /> New Hearing
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Case Details & Precedents ── */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Case Summary */}
          {caseDetails?.caseSummary && (
            <div className="glass-card p-6 border-t-2 border-t-violet-500">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-violet-400" /> AI Intelligence Summary
              </h2>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {caseDetails.caseSummary}
              </div>
            </div>
          )}

          {/* Reference Cases */}
          {caseDetails?.referenceCases?.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Scale size={20} className="text-purple-400" /> Legal Precedents (Kaggle)
              </h2>
              <div className="space-y-4">
                {caseDetails.referenceCases.map((ref, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 rounded-lg border border-violet-500/10">
                    <h4 className="font-bold text-sm text-violet-400">{ref.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3">{ref.summary}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-cyan-400 font-medium opacity-60 italic">{ref.source}</span>
                      {ref.url && (
                        <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400 hover:underline font-bold">
                          View Original ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Notices */}
          <div className="glass-card p-6 border border-violet-500/10">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-violet-400">
              <Mail size={20} /> Related Notices
            </h2>
            {notices.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No notices linked to this case.</p>
            ) : (
              <div className="space-y-3">
                {notices.map(notice => (
                  <div key={notice._id} className="p-3 bg-slate-900/60 rounded-lg border border-violet-500/10 flex justify-between items-center group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate pr-2 text-slate-200">{notice.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Received: {new Date(notice.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => navigate('/notices')}
                      className="text-cyan-400 hover:text-white"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button 
              onClick={() => navigate('/notices')}
              className="mt-4 w-full py-2 bg-violet-500/10 text-violet-400 rounded-lg text-xs font-bold hover:bg-violet-500/20 transition-all border border-violet-500/20"
            >
              Manage Notices
            </button>
          </div>

          {/* Case Documents Overview */}
          <div className="glass-card p-6 border border-cyan-500/10">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-cyan-400">
              <FileText size={20} /> Case Documents
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-violet-500/10 flex items-center justify-between">
                <span className="text-sm">Total Uploads</span>
                <span className="text-sm font-bold">{hearings.reduce((acc, h) => acc + (h.documents?.length || 0), 0)}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-violet-500/10 flex items-center justify-between">
                <span className="text-sm">AI Summaries</span>
                <span className="text-sm font-bold">{hearings.filter(h => h.reports?.length > 0).length}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 italic text-center">Open individual hearings to view and download secure documents.</p>
          </div>

          {/* Key Entities & Sections */}
          {caseDetails?.extractedData && (
            <div className="glass-card p-6 border border-teal-500/10">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-teal-400">
                <ShieldCheck size={20} /> Smart Extraction
              </h2>
              <div className="space-y-3">
                {caseDetails.extractedData.sections?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Applicable Sections</p>
                    <div className="flex flex-wrap gap-1">
                      {caseDetails.extractedData.sections.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded text-xs border border-teal-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Hearings Timeline ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 min-h-[400px] border border-violet-500/10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Calendar size={22} className="text-violet-400" /> Hearings Timeline
            </h2>

            {hearings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-violet-500/20">
                <Calendar size={48} className="text-slate-700 mb-4" />
                <p className="text-slate-400 font-medium">No hearings scheduled yet</p>
                <p className="text-slate-500 text-sm mt-1">Click <strong className="text-violet-400">New Hearing</strong> to schedule the first one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hearings.map(hearing => {
                  const ts = typeStyle(hearing.hearingType);
                  return (
                    <div
                      key={hearing._id}
                      onClick={() => navigate(`/cases/${id}/hearings/${hearing._id}`)}
                      className="glass-card p-5 flex items-center gap-5 hover:border-violet-500/40 cursor-pointer transition-all group relative overflow-hidden bg-slate-900/40"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${ts.bg.replace('/10', '')}`}></div>
                      
                      {/* Date Block */}
                      <div className="flex-shrink-0 text-center bg-slate-950 border border-violet-500/20 rounded-lg px-4 py-3 min-w-[80px]">
                        <div className="text-2xl font-black text-white leading-none">
                          {new Date(hearing.hearingDate).getDate()}
                        </div>
                        <div className="text-[10px] font-bold text-violet-400 uppercase mt-1 tracking-widest">
                          {new Date(hearing.hearingDate).toLocaleDateString('en-IN', { month: 'short' })}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-black ${ts.bg} ${ts.text} ${ts.border}`}>
                            {hearing.hearingType || 'Other'}
                          </span>
                          {hearing.hearingTime && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                              <Clock size={12} className="text-cyan-400" /> {hearing.hearingTime}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                          {hearing.courtName && (
                            <span className="flex items-center gap-1.5 opacity-80">
                              <Building2 size={14} className="text-cyan-400 flex-shrink-0" />
                              {hearing.courtName}
                            </span>
                          )}
                          {hearing.judgeName && (
                            <span className="flex items-center gap-1.5 opacity-80">
                              <User size={14} className="text-cyan-400 flex-shrink-0" />
                              {hearing.judgeName}
                            </span>
                          )}
                        </div>
                        {hearing.notes && (
                          <p className="text-xs text-gray-500 mt-2 truncate max-w-lg italic">"{hearing.notes}"</p>
                        )}
                      </div>

                      {/* Right Side Counters + Actions */}
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-bold text-white">{hearing.documents?.length || 0}</span>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Files</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => handleDelete(hearing._id, e)}
                            disabled={deletingId === hearing._id}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete hearing"
                          >
                            {deletingId === hearing._id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />}
                          </button>
                          <ChevronRight size={20} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── New Hearing Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-950 border border-violet-500/30 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-violet-500/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-violet-400">
                  <Scale size={20} /> Schedule New Hearing
                </h2>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Case: {caseDetails?.title}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Hearing Date</label>
                  <input type="date" name="hearingDate" value={form.hearingDate} onChange={handleChange} className="w-full p-3 rounded-lg bg-slate-900 border border-violet-500/20 focus:border-violet-500 outline-none text-white text-sm" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Hearing Time</label>
                  <input type="time" name="hearingTime" value={form.hearingTime} onChange={handleChange} className="w-full p-3 rounded-lg bg-slate-900 border border-violet-500/20 focus:border-violet-500 outline-none text-white text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Hearing Type</label>
                <div className="flex flex-wrap gap-2">
                  {HEARING_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, hearingType: type })}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        form.hearingType === type 
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-none' 
                        : 'bg-slate-900 text-slate-400 border-violet-500/10 hover:border-violet-500/30'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Court Name</label>
                  <input type="text" name="courtName" value={form.courtName} onChange={handleChange} placeholder="e.g. High Court, Delhi" className="w-full p-3 rounded-lg bg-slate-900 border border-violet-500/20 focus:border-violet-500 outline-none text-white text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Judge Name</label>
                  <input type="text" name="judgeName" value={form.judgeName} onChange={handleChange} placeholder="e.g. Justice R. Nariman" className="w-full p-3 rounded-lg bg-slate-900 border border-violet-500/20 focus:border-violet-500 outline-none text-white text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Strategic Notes</label>
                <textarea name="notes" rows="4" value={form.notes} onChange={handleChange} placeholder="Arguments, key evidence to present, witnesses..." className="w-full p-3 rounded-lg bg-slate-900 border border-violet-500/20 focus:border-violet-400 outline-none text-white text-sm resize-none"></textarea>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg border border-violet-500/10 text-slate-400 hover:text-white transition-colors font-bold">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Create Hearing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseWorkspace;
