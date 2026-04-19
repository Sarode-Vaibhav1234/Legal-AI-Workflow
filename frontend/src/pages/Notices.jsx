import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mail, Upload, Plus, Link as LinkIcon, Briefcase, 
  Calendar, Clock, AlertCircle, CheckCircle2, 
  Search, FileText, ChevronRight, Loader2
} from 'lucide-react';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // New Notice State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeText, setNoticeText] = useState('');
  
  // Link State
  const [linkingNoticeId, setLinkingNoticeId] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [noticesRes, casesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/notices', {
          headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
        }),
        axios.get('http://localhost:5000/api/cases', {
          headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
        })
      ]);
      setNotices(noticesRes.data);
      setCases(casesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await axios.post('http://localhost:5000/api/notices/upload', 
        { title: noticeTitle, textContent: noticeText },
        { headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') } }
      );
      setNoticeTitle('');
      setNoticeText('');
      setShowUploadModal(false);
      fetchData();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/notices/${linkingNoticeId}/link`, 
        { caseId: selectedCaseId },
        { headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') } }
      );
      setLinkingNoticeId(null);
      setSelectedCaseId('');
      fetchData();
    } catch (err) {
      console.error('Linking failed:', err);
    }
  };

  const handleCreateCase = async (noticeId) => {
    try {
      await axios.post(`http://localhost:5000/api/notices/${noticeId}/create-case`, 
        {},
        { headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') } }
      );
      fetchData();
    } catch (err) {
      console.error('Case creation failed:', err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-violet-400" size={32} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="text-violet-400" size={32} />
            Notice Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Upload and process court or opposition notices automatically.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} /> Upload Notice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Notices */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="text-cyan-400" size={20} />
            Recent Notices
          </h2>
          
          {notices.length === 0 ? (
            <div className="glass-card p-12 text-center opacity-50 italic border-violet-500/10">
              No notices uploaded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map(notice => (
                <div key={notice._id} className="glass-card p-5 border-l-4 border-cyan-500 hover:border-violet-500 transition-all group bg-slate-900/40">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-violet-400 transition-colors text-slate-200">{notice.title}</h3>
                      <p className="text-xs text-slate-500">Received on: {new Date(notice.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      notice.status === 'Pending' ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {notice.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="bg-slate-950 p-3 rounded-lg border border-violet-500/10">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Case No</p>
                      <p className="font-medium text-slate-300">{notice.extractedData?.caseNumber || 'Not specified'}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-violet-500/10">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Hearing Date</p>
                      <p className="font-medium text-violet-400">
                        {notice.extractedData?.hearingDate 
                          ? new Date(notice.extractedData.hearingDate).toLocaleDateString() 
                          : 'No date found'}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {notice.extractedData?.summary}
                  </div>

                  <div className="flex gap-3 mt-4 pt-4 border-t border-violet-500/10">
                    {notice.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => setLinkingNoticeId(notice._id)}
                          className="text-xs flex items-center gap-1.5 text-cyan-400 hover:text-white transition-colors font-bold"
                        >
                          <LinkIcon size={14} /> Link to Case
                        </button>
                        <button 
                          onClick={() => handleCreateCase(notice._id)}
                          className="text-xs flex items-center gap-1.5 text-violet-400 hover:text-white transition-colors font-bold"
                        >
                          <Plus size={14} /> Create New Case
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 size={14} /> Linked to: {notice.caseId?.title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats & Quick Actions */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-violet-500/10">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-violet-400" />
              Notice Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Notices</span>
                <span className="font-bold text-slate-200">{notices.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pending Action</span>
                <span className="font-bold text-violet-400">{notices.filter(n => n.status === 'Pending').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Upcoming Hearings</span>
                <span className="font-bold text-cyan-400">
                  {notices.filter(n => n.extractedData?.hearingDate && new Date(n.extractedData.hearingDate) > new Date()).length}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-cyan-500/20">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Briefcase size={18} className="text-cyan-400" />
              Auto-Link Rules
            </h3>
            <p className="text-xs text-slate-400 mb-4">The AI automatically extracts details and suggests links based on Case Numbers and Parties.</p>
            <div className="p-3 bg-slate-950 rounded-lg border border-cyan-500/10 flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" />
              <span className="text-[11px] text-slate-300">New hearing dates are automatically added to your calendar once linked.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-violet-500/20">
            <div className="p-6 border-b border-violet-500/10 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload size={20} className="text-violet-400" />
                Upload New Notice
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notice Title</label>
                <input 
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Notice from Mumbai High Court"
                  className="w-full bg-slate-900 border border-violet-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notice Content (Text)</label>
                <textarea 
                  required
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="Paste the text of the notice here. AI will extract details..."
                  className="w-full bg-slate-900 border border-violet-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 h-48 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg border border-violet-500/20 text-slate-400 font-bold hover:bg-violet-500/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  {uploading ? 'Processing AI...' : 'Analyze & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Linking Modal */}
      {linkingNoticeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border-cyan-500/20">
            <div className="p-6 border-b border-cyan-500/20 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LinkIcon size={20} className="text-cyan-400" />
                Link to Case
              </h2>
              <button onClick={() => setLinkingNoticeId(null)} className="text-slate-500 hover:text-white transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleLink} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Existing Case</label>
                <select 
                  required
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-violet-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">-- Choose Case --</option>
                  {cases.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="bg-violet-500/10 border border-violet-500/30 p-4 rounded-lg flex items-start gap-3">
                <Calendar size={18} className="text-violet-400 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Linking this notice will automatically create a <strong className="text-violet-400">Hearing Schedule</strong> in your calendar for the extracted date.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setLinkingNoticeId(null)}
                  className="flex-1 px-4 py-3 rounded-lg border border-violet-500/20 text-slate-400 font-bold hover:bg-violet-500/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!selectedCaseId}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/20"
                >
                  <CheckCircle2 size={18} /> Link Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
