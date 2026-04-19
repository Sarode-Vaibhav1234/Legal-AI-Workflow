import React, { useState, useEffect, useContext } from 'react';
import { Users, UserPlus, Mail, Shield, ShieldOff, Loader2, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const TeamManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [invitations, setInvitations] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState({ type: '', content: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invitesRes, casesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/team/invitations'),
        axios.get('http://localhost:5000/api/cases')
      ]);
      setInvitations(invitesRes.data);
      // Lead lawyer can only invite to their own cases
      setCases(casesRes.data.filter(c => {
        const leadId = String(c.user?._id || c.user);
        const currentId = String(currentUser?.id || currentUser?._id);
        return leadId === currentId;
      }));
    } catch (err) {
      console.error('Error fetching team data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedCaseId || !inviteEmail) return;
    
    setInviting(true);
    setMsg({ type: '', content: '' });
    
    try {
      const res = await axios.post('http://localhost:5000/api/team/invite', { 
        caseId: selectedCaseId, 
        email: inviteEmail 
      });
      setMsg({ type: 'success', content: res.data.msg });
      setInviteEmail('');
      fetchData();
      // In a real app, the email would be sent. For this demo, we can show the link.
      console.log("Mock Invite Link:", res.data.inviteLink);
    } catch (err) {
      setMsg({ type: 'error', content: err.response?.data?.msg || 'Failed to send invitation' });
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (caseId) => {
    if (!window.confirm('Are you sure you want to revoke access?')) return;
    try {
      await axios.post('http://localhost:5000/api/team/revoke', { caseId });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/team/invitation/${inviteId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="text-violet-400" size={32} />
            Case Assignment
          </h1>
          <p className="text-slate-400 mt-2">Invite junior lawyers and manage access permissions for your cases.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20"
        >
          <UserPlus size={20} />
          Invite Junior
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border-violet-500/10">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-violet-500/10 pb-4 text-slate-200">
              <Shield size={20} className="text-violet-400" />
              Active Assignments
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-violet-500/10">
                    <th className="py-4 px-2">Case Title</th>
                    <th className="py-4 px-2">Assigned To</th>
                    <th className="py-4 px-2">Status</th>
                    <th className="py-4 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-500/5">
                  {cases.map(c => (
                    <tr key={c._id} className="group hover:bg-violet-500/5 transition-colors">
                      <td className="py-4 px-2 font-medium text-slate-200">{c.title}</td>
                      <td className="py-4 px-2">
                        {c.assignedTo ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-200">{c.assignedTo.name || 'Junior Lawyer'}</span>
                            <span className="text-[10px] text-cyan-400">{c.assignedTo.email}</span>
                          </div>
                        ) : invitations.find(i => i.caseId?._id === c._id) ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-violet-400 italic">Invited</span>
                            <span className="text-[10px] text-slate-500">{invitations.find(i => i.caseId?._id === c._id).email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        {c.assignedTo ? (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-tighter">Active Access</span>
                        ) : invitations.find(i => i.caseId?._id === c._id) ? (
                          <span className="px-2 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-bold rounded uppercase tracking-tighter">Invitation Sent</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-500/10 text-slate-500 text-[10px] font-bold rounded uppercase tracking-tighter">Private</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right">
                        {c.assignedTo ? (
                          <button 
                            onClick={() => handleRevoke(c._id)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                          >
                            Revoke Access
                          </button>
                        ) : invitations.find(i => i.caseId?._id === c._id) ? (
                          <button 
                            onClick={() => handleCancelInvite(invitations.find(i => i.caseId?._id === c._id)._id)}
                            className="text-slate-400 hover:text-red-400 text-xs font-bold transition-colors"
                          >
                            Cancel Invite
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {cases.length === 0 && !loading && (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-slate-500 text-sm italic">No cases found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Pending Invitations */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-violet-500/10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-violet-400">
              <Clock size={20} />
              Pending Invites
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-violet-400" /></div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-10 space-y-3 opacity-30">
                <Mail size={32} className="mx-auto" />
                <p className="text-sm italic">No pending invitations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map(inv => (
                  <div key={inv._id} className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl group relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-cyan-400">{inv.email}</span>
                      <span className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded uppercase">Pending</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Case: {inv.caseId?.title}</p>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-[10px] text-slate-600 italic">Expires in 48h</p>
                      <button 
                        onClick={() => handleCancelInvite(inv._id)}
                        className="text-[10px] text-red-400 hover:underline font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}></div>
          <div className="relative glass-card w-full max-w-md p-8 animate-in zoom-in duration-200 border-violet-500/10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-200">
              <Mail className="text-violet-400" size={24} />
              Invite Junior Lawyer
            </h2>
            
            <form onSubmit={handleInvite} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Select Case to Share</label>
                <select 
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-violet-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="">Select a case...</option>
                  {cases.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

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

              {msg.content && (
                <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {msg.content}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg font-bold text-slate-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50"
                >
                  {inviting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
