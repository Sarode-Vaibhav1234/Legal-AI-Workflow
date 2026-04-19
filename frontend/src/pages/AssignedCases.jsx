import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, ChevronRight, Loader2, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AssignedCases = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAssignedCases(), fetchMyInvites()]);
    setLoading(false);
  };

  const fetchMyInvites = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/team/my-invitations');
      setInvites(res.data);
    } catch (err) {
      console.error('Error fetching invites', err);
    }
  };

  const fetchAssignedCases = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/cases');
      const currentUserId = String(user.id || user._id);
      
      const filtered = res.data.filter(c => {
        const leadId = String(c.user?._id || c.user);
        const assigneeId = c.assignedTo ? String(c.assignedTo?._id || c.assignedTo) : null;
        
        const isOwner = leadId === currentUserId;
        const isAssignee = assigneeId === currentUserId;
        
        return isAssignee || (isOwner && c.assignedTo);
      });
      setCases(filtered);
    } catch (error) {
      console.error('Error fetching assigned cases', error);
    }
  };

  const handleAcceptInvite = async (token) => {
    setAccepting(token);
    try {
      await axios.post('http://localhost:5000/api/team/accept-invite', { token });
      await fetchData();
    } catch (err) {
      alert('Failed to accept invitation');
    } finally {
      setAccepting(null);
    }
  };

  const urgencyColor = (u) => {
    switch (u) {
      case 'High': return 'bg-rose-500';
      case 'Medium': return 'bg-violet-500';
      case 'Low': return 'bg-cyan-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Briefcase className="text-violet-400" size={32} />
          Assigned & Delegated Cases
        </h1>
        <p className="text-slate-400 mt-2">
          Track cases you have delegated to others or those assigned to you.
        </p>
      </div>

      {invites.length > 0 && (
        <div className="glass-card p-6 border-violet-500/30 bg-violet-500/5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-violet-400">
            <Clock size={20} /> Pending Invitations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invites.map(inv => (
              <div key={inv._id} className="p-4 bg-slate-900 border border-violet-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-200">{inv.caseId?.title}</h3>
                  <p className="text-xs text-slate-500">From: {inv.invitedBy?.name} ({inv.invitedBy?.email})</p>
                </div>
                <button 
                  onClick={() => handleAcceptInvite(inv.token)}
                  disabled={accepting === inv.token}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                >
                  {accepting === inv.token ? 'Accepting...' : 'Accept Access'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6 border-violet-500/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-4 text-violet-400" size={40} />
            <p>Fetching assigned cases...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 bg-slate-950/30 rounded-xl border border-dashed border-violet-500/20">
            <Briefcase size={48} className="mx-auto opacity-20 mb-4 text-violet-400" />
            <p className="text-slate-400">No assigned cases found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((c) => (
              <div 
                key={c._id} 
                onClick={() => navigate(`/cases/${c._id}`)}
                className="flex items-center justify-between p-5 bg-slate-900/40 rounded-xl border border-violet-500/10 hover:border-violet-500 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${urgencyColor(c.urgency)} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate pr-2 text-slate-200">{c.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        {c.caseType}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} /> {c.hearings?.length || 0} Hearings
                      </span>
                      {/* Show the other party's email */}
                      <span className="text-xs text-violet-400 flex items-center gap-1">
                        <User size={12} /> 
                        {String(c.assignedTo?._id || c.assignedTo) === String(user.id || user._id) 
                          ? `From: ${c.user?.email || 'Lead Lawyer'}`
                          : `To: ${c.assignedTo?.email || 'Junior'}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Status</p>
                    <p className="text-sm font-medium text-slate-300">{c.status}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedCases;
