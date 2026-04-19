import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    handleAccept();
  }, [token]);

  const handleAccept = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/team/accept-invite', { token });
      setStatus('success');
      setMsg(res.data.msg);
      setTimeout(() => {
        navigate(`/cases/${res.data.caseId}`);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setMsg(err.response?.data?.msg || 'Failed to accept invitation. It may have expired.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-10 text-center space-y-6 border-violet-500/20">
        <div className="flex justify-center">
          <div className="p-4 bg-violet-500/10 rounded-full">
            <ShieldCheck size={48} className="text-violet-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold">Case Assignment</h1>
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="animate-spin text-violet-400 mx-auto" size={32} />
            <p className="text-slate-400">Verifying invitation and granting access...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="text-emerald-500 mx-auto" size={32} />
            <p className="text-emerald-400 font-bold">{msg}</p>
            <p className="text-slate-500 text-sm">Redirecting to case workspace...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="text-rose-500 mx-auto" size={32} />
            <p className="text-rose-400 font-bold">{msg}</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
