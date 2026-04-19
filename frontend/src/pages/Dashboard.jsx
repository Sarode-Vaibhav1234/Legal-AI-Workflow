import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Briefcase, ChevronRight, Clock, Plus, Loader2, Trash2, UserPlus, Mail, X, CheckCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningCase, setAssigningCase] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState({ type: '', content: '' });
  const [stats, setStats] = useState({ total: 0, hearings: 0, pending: 0, closed: 0 });
  const [invites, setInvites] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [upcomingHearings, setUpcomingHearings] = useState([]);
  const [pendingNotices, setPendingNotices] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCases(), fetchInvites(), fetchHearings(), fetchNotices()]);
    setLoading(false);
  };

  const fetchHearings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/hearings', {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      // Filter for upcoming
      const now = new Date();
      const upcoming = res.data.filter(h => new Date(h.hearingDate) >= now).slice(0, 5);
      setUpcomingHearings(upcoming);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notices', {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setPendingNotices(res.data.filter(n => n.status === 'Pending'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/team/my-invitations', {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setInvites(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/cases', {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      // Sort cases by upcoming hearing date if available
      const sortedCases = res.data.sort((a, b) => {
        const nextA = a.hearings?.length > 0 ? new Date(a.hearings[0].hearingDate) : new Date(8640000000000000);
        const nextB = b.hearings?.length > 0 ? new Date(b.hearings[0].hearingDate) : new Date(8640000000000000);
        return nextA - nextB;
      });
      setCases(sortedCases);
      
      setStats({
        total: res.data.length,
        hearings: res.data.reduce((acc, c) => acc + (c.hearings?.length || 0), 0),
        pending: res.data.filter(c => c.status === 'Intake Complete').length,
        closed: 0 
      });
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    }
  };

  const handleAcceptInvite = async (token) => {
    setAccepting(token);
    try {
      await axios.post('http://localhost:5000/api/team/accept-invite', { token }, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      await fetchData();
    } catch (err) {
      alert('Failed to accept invitation');
    } finally {
      setAccepting(null);
    }
  };

  const handleDeleteCase = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this case? This will remove all associated hearings and documents.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/cases/${id}`, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setCases(cases.filter(c => c._id !== id));
    } catch (error) {
      alert('Failed to delete case');
    }
  };

  const handleRevoke = async (caseId) => {
    if (!window.confirm('Are you sure you want to revoke access?')) return;
    try {
      await axios.post('http://localhost:5000/api/team/revoke', { caseId }, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      fetchCases();
    } catch (err) {
      console.error(err);
    }
  };

  const openAssignModal = (caseObj, e) => {
    e.stopPropagation();
    setAssigningCase(caseObj);
    setShowAssignModal(true);
    setInviteMsg({ type: '', content: '' });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !assigningCase) return;
    
    setInviting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/team/invite', { 
        caseId: assigningCase._id, 
        email: inviteEmail 
      }, {
        headers: { 'x-auth-token': localStorage.getItem('legal_ai_token') }
      });
      setInviteMsg({ type: 'success', content: 'Invitation link generated! Check console.' });
      console.log('Invite Link:', res.data.inviteLink);
      setTimeout(() => setShowAssignModal(false), 2000);
    } catch (err) {
      setInviteMsg({ 
        type: 'error', 
        content: err.response?.data?.msg || 'Failed to send invitation. Make sure the lawyer is registered.' 
      });
    } finally {
      setInviting(false);
    }
  };

  const urgencyColor = (u) => {
    switch (u) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Welcome back, {user?.name || 'Counsel'}</p>
        </div>
        <button 
          onClick={() => navigate('/cases/new')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-violet-500/30"
        >
          <Plus size={20} /> New Case Intake
        </button>
      </header>

      {/* Pending Invitations Section */}
      {invites.length > 0 && (
        <div className="mb-8 p-6 bg-cyan-500/5 border border-cyan-500/30 rounded-2xl animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <Clock size={22} className="animate-pulse" />
            <h2 className="text-xl font-bold">New Case Access Requests</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invites.map(inv => (
              <div key={inv._id} className="p-4 bg-slate-900/80 border border-cyan-500/20 rounded-xl flex flex-col justify-between gap-3 group hover:border-cyan-500/50 transition-all">
                <div>
                  <h3 className="font-bold text-slate-200 line-clamp-1">{inv.caseId?.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 italic">From: {inv.invitedBy?.name}</p>
                </div>
                <button 
                  onClick={() => handleAcceptInvite(inv.token)}
                  disabled={accepting === inv.token}
                  className="w-full py-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {accepting === inv.token ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {accepting === inv.token ? 'Accepting...' : 'Accept Case Access'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-violet-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400">Total Active Cases</p>
              <p className="text-3xl font-bold mt-2 text-white">{loading ? '...' : stats.total}</p>
            </div>
            <div className="p-3 bg-violet-500/20 rounded-lg"><Briefcase size={24} className="text-violet-400" /></div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-cyan-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400">Hearings Scheduled</p>
              <p className="text-3xl font-bold mt-2 text-white">{loading ? '...' : stats.hearings}</p>
            </div>
            <div className="p-3 bg-cyan-500/20 rounded-lg"><Calendar size={24} className="text-cyan-400" /></div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400">Pending Intake</p>
              <p className="text-3xl font-bold mt-2 text-white">{loading ? '...' : stats.pending}</p>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-lg"><Clock size={24} className="text-indigo-400" /></div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-teal-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400">Resolution Rate</p>
              <p className="text-3xl font-bold mt-2 text-white">--</p>
            </div>
            <div className="p-3 bg-teal-500/20 rounded-lg"><AlertCircle size={24} className="text-teal-400" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2 glass-card p-6 border border-violet-500/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="text-violet-400" /> Recent Cases
            </h2>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p>Fetching your cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-violet-500/20">
              <Briefcase size={48} className="mx-auto opacity-20 mb-4" />
              <p className="text-slate-400">No cases found.</p>
              <button 
                onClick={() => navigate('/cases/new')}
                className="mt-4 text-violet-400 hover:underline text-sm font-medium"
              >
                + Start your first case intake
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c) => (
                <div 
                  key={c._id} 
                  onClick={() => navigate(`/cases/${c._id}`)}
                  className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-violet-500/10 hover:border-violet-500/40 hover:bg-slate-900/80 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${urgencyColor(c.urgency)} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg truncate pr-2 text-slate-100">{c.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/30 rounded text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                          {c.caseType}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={12} /> {c.hearings?.length || 0} Hearings
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Status</p>
                      <p className="text-sm font-medium text-slate-300">{c.status}</p>
                    </div>
                    
                      <div className="flex items-center gap-2">
                        {!c.assignedTo ? (
                          <button 
                            onClick={(e) => openAssignModal(c, e)}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Assign Case"
                          >
                            <UserPlus size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRevoke(c._id); }}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Revoke Access"
                          >
                            <ShieldOff size={18} />
                          </button>
                        )}
                      <button 
                        onClick={(e) => handleDeleteCase(c._id, e)}
                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Case"
                      >
                        <Trash2 size={18} />
                      </button>
                      <ChevronRight size={20} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="glass-card p-6 border border-cyan-500/20">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400">
               <Calendar size={20} /> Upcoming Deadlines
             </h2>
             <div className="space-y-3">
                {upcomingHearings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No upcoming hearings.</p>
                ) : (
                  upcomingHearings.map(h => (
                    <div key={h._id} className="p-3 border-l-2 border-cyan-500 bg-slate-900/50 rounded-r-lg group cursor-pointer hover:bg-cyan-500/5" onClick={() => navigate(`/cases/${h.caseId?._id}/hearings/${h._id}`)}>
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-200">{h.caseId?.title}</p>
                        <span className="text-[10px] text-cyan-400 font-bold">{new Date(h.hearingDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{h.hearingType} • {h.courtName}</p>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Recent Notices */}
          <div className="glass-card p-6 border border-violet-500/20">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-violet-400">
               <Mail size={20} /> Recent Notices
             </h2>
             <div className="space-y-3">
                {pendingNotices.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">All notices processed.</p>
                ) : (
                  pendingNotices.slice(0, 3).map(n => (
                    <div key={n._id} className="p-3 border-l-2 border-violet-500 bg-slate-900/50 rounded-r-lg group cursor-pointer hover:bg-violet-500/5" onClick={() => navigate('/notices')}>
                      <p className="text-sm font-bold text-slate-200">{n.title}</p>
                      <p className="text-[10px] text-violet-400 mt-1 font-bold">Action Required: Link to Case</p>
                    </div>
                  ))
                )}
                {pendingNotices.length > 3 && (
                  <button onClick={() => navigate('/notices')} className="text-xs text-violet-400 hover:underline w-full text-center">
                    View all {pendingNotices.length} notices
                  </button>
                )}
             </div>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-violet-600/10 via-indigo-500/5 to-transparent border border-violet-500/20">
             <h2 className="text-lg font-bold mb-2 text-violet-300">Notice Tip</h2>
             <p className="text-sm text-slate-400 leading-relaxed">
               Upload court notices to the <strong className="text-white">Notices Module</strong> to automatically extract hearing dates and sync them with your calendar.
             </p>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
          <div className="relative glass-card w-full max-w-md p-8 animate-in zoom-in duration-200 border-violet-500/20">
            <button 
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <UserPlus className="text-violet-400" size={24} />
              Assign Case
            </h2>
            <p className="text-slate-400 text-sm mb-6">Enter the email of the junior lawyer you want to assign to <strong>{assigningCase?.title}</strong>.</p>
            
            <form onSubmit={handleAssign} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Junior Lawyer Email</label>
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="junior@example.com"
                  className="w-full bg-slate-900 border border-violet-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {inviteMsg.content && (
                <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${inviteMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {inviteMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {inviteMsg.content}
                </div>
              )}

              <button 
                type="submit"
                disabled={inviting}
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 disabled:opacity-50"
              >
                {inviting ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
