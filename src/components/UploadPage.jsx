import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, ShieldAlert, PlayCircle } from 'lucide-react';

export default function UploadPage({ onAnalysisComplete, credits, isPro, onUpgradeClick, activeUser }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [dropHover, setDropHover] = useState(false);
  const fileInputRef = useRef(null);

  const isOutOfCredits = credits <= 0 && !isPro;
  const canStart = !isOutOfCredits && file && jobDescription.trim();

  const handleDragOver = (e) => { e.preventDefault(); setDropHover(true); };
  const handleDragLeave = ()  => setDropHover(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDropHover(false);
    setError('');
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateFile(droppedFile);
  };

  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (selectedFile) validateFile(selectedFile);
  };

  const validateFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      setFile(null);
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleStartInterview = async () => {
    if (isOutOfCredits) { onUpgradeClick(); return; }
    if (!file || !jobDescription.trim()) {
      setError('Please provide both your Resume PDF and the Job Description.');
      return;
    }

    setLoading(true);
    setError('');

    const steps = [
      'Uploading resume PDF...',
      'Extracting text from resume...',
      'Analyzing professional experience...',
      'Mapping technical and soft skills...',
      'Aligning qualifications with Job Description...',
      'Customizing AI interviewer persona...',
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (stepIdx < steps.length - 1) { stepIdx++; setLoadingStep(steps[stepIdx]); }
    }, 2000);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);
      formData.append('targetRole', targetRole);
      formData.append('userEmail', activeUser?.email || 'anonymous');
      formData.append('userName', activeUser?.name || 'Guest');

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze files');
      }

      const profile = await response.json();
      clearInterval(stepInterval);
      onAnalysisComplete(profile);
    } catch (err) {
      clearInterval(stepInterval);
      console.error(err);
      setError(err.message || 'An error occurred during analysis. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col page-transition">

      {/* ── HERO SECTION ─────────────────────────────── */}
      <section
        className="w-full text-center py-14 px-4 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #0F1A35 0%, #080B14 70%)' }}
      >
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

        {/* Pill badge */}
        <div
          className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5 tracking-wider"
          style={{ background: '#0F1A35', border: '1px solid #1E2840', color: '#4F8EF7' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          AI MOCK INTERVIEW
        </div>

        <h1 className="relative z-10 text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
          Prepare. Practice.{' '}
          <span className="gradient-text">Get Hired.</span>
        </h1>
        <p className="relative z-10 text-sm md:text-base max-w-sm mx-auto leading-relaxed" style={{ color: '#6B7A9F' }}>
          Upload your resume and job description to start a simulated AI mock interview tailored to your background.
        </p>

        {/* Out-of-credits warning */}
        {isOutOfCredits && (
          <div
            className="relative z-10 mt-7 flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-2xl max-w-xl mx-auto text-left"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Free Credit Limit Reached</h4>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#8A9BC0' }}>
                  You have consumed your 3 free interview sessions. Subscribe to a Starter or Pro plan.
                </p>
              </div>
            </div>
            <button
              onClick={onUpgradeClick}
              className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 cursor-pointer"
            >
              View Plans
            </button>
          </div>
        )}
      </section>

      {/* ── UPLOAD FORM ──────────────────────────────── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 flex flex-col gap-6">
        {loading ? (
          /* Loading state */
          <div
            className="max-w-md mx-auto w-full p-10 rounded-2xl flex flex-col items-center justify-center text-center"
            style={{ background: '#0D1120', border: '1px solid #1E2840' }}
          >
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-ping" />
              <div
                className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin"
                style={{ borderTopColor: '#4F8EF7' }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-accent">
                <Sparkles size={28} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Analyzing Profile</h3>
            <p className="text-sm" style={{ color: '#8A9BC0' }}>{loadingStep}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

            {/* ── RESUME UPLOAD CARD ── */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${isOutOfCredits ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ background: '#0D1120', border: '1px solid #1E2840', borderRadius: '14px' }}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: '#0F1A35', border: '1px solid #1E2840' }}
                >
                  <FileText size={18} style={{ color: '#4F8EF7' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Resume PDF</h2>
                  <p className="text-[11px]" style={{ color: '#4B5A80' }}>Max 5MB • PDF only</p>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => !isOutOfCredits && fileInputRef.current?.click()}
                className="flex-1 min-h-[180px] flex flex-col items-center justify-center p-6 rounded-[10px] cursor-pointer transition-all"
                style={{
                  border: `1.5px dashed ${dropHover || file ? '#4F8EF7' : '#1E2840'}`,
                  background: dropHover ? '#0F1A35' : (file ? 'rgba(79,142,247,0.05)' : '#080B14'),
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                  disabled={isOutOfCredits}
                />
                {file ? (
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'rgba(79,142,247,0.15)', color: '#4F8EF7' }}
                    >
                      <FileText size={22} />
                    </div>
                    <p className="text-white font-medium text-sm max-w-[180px] truncate mx-auto">{file.name}</p>
                    <p className="text-xs mt-1" style={{ color: '#4B5A80' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <span className="text-xs mt-3 inline-block" style={{ color: '#4F8EF7' }}>Change file</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: '#0F1A35', color: '#2A3A6A' }}
                    >
                      <Upload size={22} />
                    </div>
                    <p className="text-sm font-medium text-white">Drag & drop PDF here</p>
                    <p className="text-xs mt-1" style={{ color: '#4B5A80' }}>or click to browse local files</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── JOB DESCRIPTION CARD ── */}
            <div
              className={`rounded-2xl p-6 flex flex-col transition-all ${isOutOfCredits ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ background: '#0D1120', border: '1px solid #1E2840', borderRadius: '14px' }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: '#0F1A35', border: '1px solid #1E2840' }}
                >
                  <Sparkles size={18} style={{ color: '#4F8EF7' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Target Role & Description</h2>
                  <p className="text-[11px]" style={{ color: '#4B5A80' }}>Used to tailor your questions</p>
                </div>
              </div>

              {/* Role selector */}
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4B5A80' }}>
                  Select Target Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={isOutOfCredits}
                  className="w-full rounded-lg py-2.5 px-3 text-white text-xs outline-none transition-all cursor-pointer font-medium"
                  style={{
                    background: '#080B14',
                    border: '1px solid #1E2840',
                    borderRadius: '8px',
                    color: '#8A9BC0',
                  }}
                >
                  <option value="Full Stack"        className="bg-[#080B14]">Full Stack Developer</option>
                  <option value="Frontend Developer" className="bg-[#080B14]">Frontend Developer</option>
                  <option value="Backend Developer"  className="bg-[#080B14]">Backend Developer</option>
                  <option value="Data Analyst"       className="bg-[#080B14]">Data Analyst</option>
                  <option value="Data Scientist"     className="bg-[#080B14]">Data Scientist</option>
                  <option value="ML Engineer"        className="bg-[#080B14]">ML Engineer</option>
                  <option value="GenAI Engineer"     className="bg-[#080B14]">GenAI Engineer</option>
                </select>
              </div>

              {/* JD textarea */}
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4B5A80' }}>
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={isOutOfCredits}
                  placeholder="Paste job description details, qualifications, and core requirements here..."
                  className="flex-1 rounded-lg p-4 text-white text-xs resize-none outline-none transition-all"
                  style={{
                    background: '#080B14',
                    border: '1px solid #1E2840',
                    borderRadius: '8px',
                    color: '#fff',
                    minHeight: '140px',
                  }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid #4F8EF7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.1)'; }}
                  onBlur={e  => { e.currentTarget.style.border = '1px solid #1E2840'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            className="flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl"
            style={{ background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <button
            onClick={handleStartInterview}
            disabled={!isOutOfCredits && !canStart}
            className="w-full py-4 rounded-[14px] font-bold text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer"
            style={
              isOutOfCredits
                ? { background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#1a1000' }
                : canStart
                  ? { background: 'linear-gradient(135deg, #4F8EF7, #7B5FF7)', color: '#fff' }
                  : { background: '#1E2840', color: '#4B5A80', cursor: 'not-allowed' }
            }
          >
            <PlayCircle size={20} />
            {isOutOfCredits ? 'Upgrade to Start Mock Interview' : 'Start Mock Interview'}
          </button>
        )}
      </div>
    </div>
  );
}
