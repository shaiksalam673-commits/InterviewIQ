import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { Shield, RefreshCw, Trash2, Users, Database, FileText, Award, MapPin } from 'lucide-react';

export default function AdminPage({ onStartNew }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/logs`);
      if (!response.ok) {
        throw new Error('Failed to retrieve server logs');
      }
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the logs server. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all server usage logs? This cannot be undone.')) {
      return;
    }
    setClearing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/clear`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to clear logs');
      }
      setLogs([]);
    } catch (err) {
      console.error(err);
      alert('Error clearing logs');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Compute metrics
  const totalRequests = logs.length;
  const uniqueUsers = new Set(logs.map(log => log.email).filter(e => e && e !== 'anonymous' && e !== 'Guest')).size;
  
  const scoreLogs = logs.filter(log => log.score !== null);
  const avgScore = scoreLogs.length > 0 
    ? Math.round(scoreLogs.reduce((acc, log) => acc + log.score, 0) / scoreLogs.length)
    : 0;

  const resumesAnalyzed = logs.filter(log => log.action === 'Resume Analysis').length;

  // Aggregate Roles Data for BarChart
  const roleCounts = {};
  logs.forEach(log => {
    if (log.targetRole && log.targetRole !== 'N/A') {
      roleCounts[log.targetRole] = (roleCounts[log.targetRole] || 0) + 1;
    }
  });
  const chartRoleData = Object.keys(roleCounts).map(role => ({
    name: role,
    "Requests": roleCounts[role],
  }));

  // Aggregate Scores Data for AreaChart
  const chartScoreData = scoreLogs.map((log, index) => ({
    name: `Test ${scoreLogs.length - index}`,
    "Score": log.score,
  })).reverse(); // Oldest first to show progress

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 page-transition flex flex-col gap-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-darkBorder">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Shield className="text-accent" size={32} />
            Admin Console
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor mock service telemetry, user identities, API interactions, and scoring distribution in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-darkBorder hover:border-gray-500 bg-card/25 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title="Reload Logs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleClearLogs}
            disabled={clearing || logs.length === 0}
            className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            <span>Clear Logs</span>
          </button>
          <button
            onClick={onStartNew}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accentHover text-white text-xs font-bold shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Back to App
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/35 border border-red-500/35 text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total requests card */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
            <Database size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">API Events Logged</span>
            <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">{totalRequests}</span>
          </div>
        </div>

        {/* Unique candidates card */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Unique Users</span>
            <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">{uniqueUsers}</span>
          </div>
        </div>

        {/* Average score card */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Avg Evaluation Score</span>
            <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">{avgScore}%</span>
          </div>
        </div>

        {/* Resumes analyzed card */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Resumes Processed</span>
            <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">{resumesAnalyzed}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 min-h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400 text-sm font-semibold">Loading Telemetry Logs...</span>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-darkBorder bg-card/25 p-16 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto mt-8 w-full">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
            <Database size={28} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">No active metrics yet</h3>
            <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed">
              When candidates trigger resume parsing, submit answers, or compile interview reports, telemetry events will automatically populate in this Admin dashboard.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Roles Bar Chart */}
            <div className="rounded-2xl glass-panel border border-darkBorder p-5 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-gray-400">Target Role Popularity</h3>
              <div className="h-60 w-full">
                {chartRoleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartRoleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                      <YAxis stroke="#666" fontSize={10} allowDecimals={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }} 
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }} 
                      />
                      <Bar dataKey="Requests" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                    Not enough data to graph target roles.
                  </div>
                )}
              </div>
            </div>

            {/* Score Over Time Area Chart */}
            <div className="rounded-2xl glass-panel border border-darkBorder p-5 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-gray-400">Answer Scoring Progression</h3>
              <div className="h-60 w-full">
                {chartScoreData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartScoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                      <YAxis stroke="#666" fontSize={10} domain={[0, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }} 
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }} 
                      />
                      <Area type="monotone" dataKey="Score" stroke="#7C3AED" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                    Answer evaluations must be submitted to view score distribution.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Raw Log Event Table */}
          <div className="rounded-2xl glass-panel border border-darkBorder flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-darkBorder bg-card/25 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">Live Telemetry Event Log</h3>
              <span className="text-[10px] text-gray-500 font-mono">Showing last {logs.length} entries</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-darkBorder bg-black/10 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Action</th>
                    <th className="py-3 px-5">Role Context</th>
                    <th className="py-3 px-5">Result Metric</th>
                    <th className="py-3 px-5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkBorder/30 text-xs font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-3 px-5 text-gray-500 font-mono whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-5">
                        <div className="text-white font-semibold">{log.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{log.email}</div>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.action.includes('Question') ? 'bg-blue-950/20 text-blue-300 border-blue-500/20' :
                          log.action === 'Resume Analysis' ? 'bg-purple-950/20 text-purple-300 border-purple-500/20' :
                          log.action === 'Report Compilation' ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/20' :
                          'bg-amber-950/20 text-amber-300 border-amber-500/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-300">
                        {log.targetRole}
                      </td>
                      <td className="py-3 px-5 font-mono">
                        {log.score !== null && (
                          <span className={`font-bold ${log.score >= 90 ? 'text-emerald-400' : log.score >= 70 ? 'text-accent' : 'text-yellow-400'}`}>
                            {log.score}% Score
                          </span>
                        )}
                        {log.matchPercentage !== null && (
                          <span className="text-purple-400 font-bold">
                            {log.matchPercentage}% Match
                          </span>
                        )}
                        {log.score === null && log.matchPercentage === null && (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-gray-500 font-mono text-[10px] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {log.ip}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
