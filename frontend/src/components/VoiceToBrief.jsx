import React, { useState } from 'react';
import { Mic, Square, Loader2, CheckCircle, FileAudio } from 'lucide-react';

const VoiceToBrief = ({ onAddHearing }) => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [seconds, setSeconds] = useState(0);

  React.useEffect(() => {
    let interval = null;
    if (recording) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (!recording && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording, seconds]);

  const handleStartRecording = () => {
    setRecording(true);
    setSeconds(0);
    setSuccess(false);
  };

  const handleStopRecording = () => {
    setRecording(false);
    setProcessing(true);
    
    // Simulate AI Whisper + Summarization API call
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      
      // Simulate adding the processed hearing to the timeline
      if (onAddHearing) {
        onAddHearing({
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          title: 'Voice Note: Hearing Summary',
          notes: 'AI Extracted: The witness cross-examination concluded today. The judge has scheduled the next hearing for evidence submission on next Monday.',
          documents: [],
          status: 'Completed'
        });
      }
    }, 2500); // 2.5s simulation
  };

  return (
    <div className="bg-legal-navy/30 border border-legal-teal/30 p-6 rounded-xl mt-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
        <FileAudio size={20} className="text-legal-teal" />
        AI Voice-to-Brief
      </h3>
      <p className="text-sm text-gray-400 mb-6">Record a quick voice note after a hearing. The AI will convert it to text, extract the summary, and add it to the timeline automatically.</p>
      
      <div className="flex items-center gap-6">
        {!recording && !processing && !success && (
          <button 
            onClick={handleStartRecording}
            className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            <Mic size={24} />
          </button>
        )}
        
        {recording && (
          <button 
            onClick={handleStopRecording}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]"
          >
            <Square size={24} fill="currentColor" />
          </button>
        )}

        {processing && (
          <div className="w-16 h-16 rounded-full border border-legal-teal flex items-center justify-center text-legal-teal">
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}

        {success && (
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-green-400">
            <CheckCircle size={24} />
          </div>
        )}

        <div>
          {recording && <p className="text-red-400 font-mono text-xl animate-pulse">Recording... 00:{seconds.toString().padStart(2, '0')}</p>}
          {processing && <p className="text-legal-teal font-medium">Whisper AI processing & summarizing...</p>}
          {success && <p className="text-green-400 font-medium">Brief extracted and added to timeline!</p>}
          {!recording && !processing && !success && <p className="text-gray-500">Ready to record.</p>}
        </div>
      </div>
    </div>
  );
};

export default VoiceToBrief;
