import React, { useState } from 'react';
import { Calendar, FileText, Upload, MoreVertical } from 'lucide-react';
import VoiceToBrief from './VoiceToBrief';

const initialHearings = [
  {
    id: 1,
    date: '2026-04-10',
    title: 'First Hearing - Charges Framed',
    notes: 'The accused pleaded not guilty. The judge requested the prosecution to present CCTV evidence by the next hearing.',
    documents: ['FIR_Copy.pdf', 'Initial_Charge_Sheet.pdf'],
    status: 'Completed'
  },
  {
    id: 2,
    date: '2026-04-20',
    title: 'Evidence Presentation',
    notes: 'Pending submission of the CCTV footage analysis from forensics.',
    documents: [],
    status: 'Upcoming'
  }
];

const TimelineView = () => {
  const [hearings, setHearings] = useState(initialHearings);

  const handleAddHearing = (newHearing) => {
    // Add new hearing
    setHearings(prev => [...prev, newHearing]);
  };

  return (
    <div className="relative border-l-2 border-legal-teal/30 ml-4 py-4 space-y-8">
      {hearings.map((hearing, index) => (
        <div key={hearing.id} className="relative pl-8 group">
          {/* Timeline Dot */}
          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-legal-darker ${hearing.status === 'Completed' ? 'bg-legal-gold' : 'bg-legal-teal'}`}></div>
          
          <div className="glass-card p-6 border-l-4 hover:border-l-legal-gold transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-xs font-bold px-2 py-1 rounded mb-2 inline-block ${hearing.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {hearing.status}
                </span>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar size={18} className="text-legal-teal" />
                  {hearing.date}: {hearing.title}
                </h3>
              </div>
              <button className="text-gray-400 hover:text-legal-light"><MoreVertical size={20} /></button>
            </div>
            
            <p className="text-gray-300 mb-6 bg-legal-darker/50 p-4 rounded-lg border border-legal-teal/20">
              {hearing.notes}
            </p>

            <div>
              <h4 className="text-sm font-semibold text-legal-gold mb-3 flex items-center gap-2">
                <FileText size={16} /> Attached Documents
              </h4>
              {hearing.documents.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {hearing.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 bg-legal-navy/50 border border-legal-teal/30 px-3 py-2 rounded-lg text-sm hover:bg-legal-teal/20 cursor-pointer transition-colors">
                      <FileText size={14} className="text-legal-teal" />
                      {doc}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No documents attached yet.</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-legal-teal/20 flex gap-4">
               <button className="text-sm flex items-center gap-1 text-legal-teal hover:text-legal-gold transition-colors">
                 <Upload size={16} /> Upload Document
               </button>
            </div>
          </div>
        </div>
      ))}

      {/* Voice to Brief Feature */}
      <div className="relative pl-8 mt-8">
        <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full border-2 border-legal-darker bg-gray-600"></div>
        <VoiceToBrief onAddHearing={handleAddHearing} />
      </div>
    </div>
  );
};

export default TimelineView;
