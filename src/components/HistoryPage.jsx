import React, { useState, useEffect } from 'react';
import { Award, Calendar, ChevronRight, Trash2, ShieldAlert, BookOpen, Clock } from 'lucide-react';

export default function HistoryPage({ onSelectSession, onStartNew }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('interviewiq_history');
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this interview record?")) {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      localStorage.setItem('interviewiq_history', JSON.stringify(updated));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20';
    if (score >= 70) return 'text-accent bg-accent/10 border-accent/20';
    if (score >= 50) return 'text-yellow-400 bg-yellow-950/20 border-yellow-500/20';
    return 'text-red-400 bg-red-950/20 border-red-500/20';
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 page-transition flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-darkBorder">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Interview History</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review your past mock interviews, check score progress, and reload full feedback reports.
          </p>
        </div>
        <button
          onClick={onStartNew}
          className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accentHover text-white text-xs font-bold shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Start New Mock
        </button>
      </div>

      {sessions.length === 0 ? (
        /* EMPTY STATE */
        <div className="rounded-2xl border border-darkBorder bg-card/25 p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto mt-8 w-full">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">No sessions recorded</h3>
            <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed">
              Once you complete an adaptive mock interview, your parsed profile and score sheets will show up here.
            </p>
          </div>
          <button
            onClick={onStartNew}
            className="px-4 py-2 mt-2 bg-accent hover:bg-accentHover text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Start Your First Interview
          </button>
        </div>
      ) : (
        /* HISTORY CARDS */
        <div className="grid grid-cols-1 gap-4.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="rounded-2xl glass-panel border border-darkBorder hover:border-accent/40 p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 transition-all hover:scale-[1.005] cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                {/* Visual score circle badge */}
                <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center flex-shrink-0 font-bold font-mono text-lg shadow-inner ${getScoreColor(session.score)}`}>
                  {session.score}
                  <span className="text-[8px] uppercase tracking-wider text-gray-500 font-sans mt-0.5 leading-none">Score</span>
                </div>
                
                <div className="space-y-1.5 overflow-hidden">
                  <h3 className="text-white font-bold text-base leading-tight truncate group-hover:text-accent transition-colors">
                    {session.jobRole} Mock Interview
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award size={12} />
                      {session.profile?.experienceLevel || 'Mid'} Level
                    </span>
                  </div>
                  
                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {session.skills?.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded bg-card/65 text-gray-400 border border-darkBorder"
                      >
                        {skill}
                      </span>
                    ))}
                    {session.skills?.length > 4 && (
                      <span className="text-[9px] font-bold text-accent py-0.5">
                        +{session.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 sm:border-l sm:border-darkBorder sm:pl-5 flex-shrink-0">
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="p-2.5 rounded-xl border border-darkBorder hover:border-red-500/20 bg-card/25 text-gray-500 hover:text-red-400 hover:bg-red-950/10 transition-all"
                  title="Delete Record"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => onSelectSession(session)}
                  className="px-4 py-2.5 rounded-xl bg-card/40 border border-darkBorder hover:border-gray-500 text-gray-300 font-bold text-xs flex items-center gap-1 transition-all group-hover:bg-accent group-hover:text-white group-hover:border-accent"
                >
                  <span>Review Report</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
