import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';

export default function UploadPage({ onAnalysisComplete, credits, isPro, onUpgradeClick, activeUser }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const isOutOfCredits = credits <= 0 && !isPro;

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setError('');
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
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
    if (isOutOfCredits) {
      onUpgradeClick();
      return;
    }

    if (!file || !jobDescription.trim()) {
      setError('Please provide both your Resume PDF and the Job Description.');
      return;
    }

    setLoading(true);
    setError('');

    // Dynamic loading messages to improve UX
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
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setLoadingStep(steps[stepIdx]);
      }
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
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 page-transition max-w-5xl mx-auto w-full">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent mb-4 text-sm font-medium">
          <Sparkles size={14} />
          <span>Next-Generation Mock Interviews</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-accent">
          InterviewIQ
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Prepare smarter. Upload your resume and job description to initiate a simulated AI mock interview tailored precisely to your background and target role.
        </p>

        {/* Credit Exhausted Warning Card */}
        {isOutOfCredits && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-yellow-950/20 border border-yellow-500/25 px-5 py-4 rounded-2xl max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Free Credit Limit Reached</h4>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  You have consumed your 3 free interview sessions. Subscribe to a Starter or Pro plan to unlock additional mock tests.
                </p>
              </div>
            </div>
            <button
              onClick={onUpgradeClick}
              className="px-4 py-2 bg-accent hover:bg-accentHover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            >
              View Credit Plans
            </button>
          </div>
        )}
      </div>

      {loading ? (
        /* LOADING / ANALYSIS STATE */
        <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-darkBorder flex flex-col items-center justify-center text-center shadow-xl animate-pulse-slow">
          <div className="relative w-20 h-20 mb-6">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border-4 border-accent/20 animate-ping"></div>
            {/* Spinning indicator */}
            <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center text-accent">
              <Sparkles size={32} />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Analyzing Profile</h3>
          <p className="text-gray-400 text-sm max-w-xs">{loadingStep}</p>
        </div>
      ) : (
        /* UPLOAD FORM */
        <div className="w-full flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Resume Upload Card */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`rounded-2xl glass-panel border p-6 flex flex-col justify-between hover:border-accent/40 transition-colors group ${
                isOutOfCredits ? 'opacity-60 pointer-events-none border-darkBorder' : 'border-darkBorder'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                    <FileText size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-white">1. Resume</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Drag and drop your resume in PDF format. AI will analyze this to determine experience level, credentials, and skills.
                </p>
              </div>

              <div 
                onClick={() => !isOutOfCredits && fileInputRef.current?.click()}
                className={`flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${
                  file 
                    ? 'border-accent/40 bg-accent/5' 
                    : 'border-darkBorder bg-card/45 hover:bg-card/75 hover:border-gray-500'
                }`}
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
                    <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto mb-3">
                      <FileText size={24} />
                    </div>
                    <p className="text-white font-medium text-sm max-w-[200px] truncate mx-auto">
                      {file.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF
                    </p>
                    <span className="text-xs text-accent mt-4 inline-block hover:underline">
                      Change file
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-3 group-hover:text-accent transition-colors">
                      <Upload size={22} />
                    </div>
                    <p className="text-gray-300 font-medium text-sm">
                      Drag & drop PDF here
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      or click to browse local files (max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description Card */}
            <div className={`rounded-2xl glass-panel border p-6 flex flex-col hover:border-accent/40 transition-colors ${
              isOutOfCredits ? 'opacity-60 pointer-events-none border-darkBorder' : 'border-darkBorder'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">2. Target Role & Description</h2>
              </div>
              
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Select Target Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={isOutOfCredits}
                  className="w-full bg-card/45 border border-darkBorder focus:border-accent focus:ring-1 focus:ring-accent rounded-xl py-2.5 px-3 text-white text-xs outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="Full Stack" className="bg-background text-white">Full Stack Developer</option>
                  <option value="Frontend Developer" className="bg-background text-white">Frontend Developer</option>
                  <option value="Backend Developer" className="bg-background text-white">Backend Developer</option>
                  <option value="Data Analyst" className="bg-background text-white">Data Analyst</option>
                  <option value="Data Scientist" className="bg-background text-white">Data Scientist</option>
                  <option value="ML Engineer" className="bg-background text-white">ML Engineer</option>
                  <option value="GenAI Engineer" className="bg-background text-white">GenAI Engineer</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={isOutOfCredits}
                  placeholder="Paste job description details, qualifications, and core requirements here..."
                  className="w-full bg-card/45 border border-darkBorder focus:border-accent focus:ring-1 focus:ring-accent rounded-xl p-4 text-white placeholder-gray-600 text-xs resize-none h-40 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="mt-6 flex items-start gap-2.5 bg-red-950/35 border border-red-500/35 text-red-300 text-sm px-4 py-3 rounded-xl max-w-xl w-full">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      {!loading && (
        <button
          onClick={handleStartInterview}
          disabled={!isOutOfCredits && (!file || !jobDescription.trim())}
          className={`mt-8 px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all text-base cursor-pointer ${
            isOutOfCredits
              ? 'bg-yellow-600 hover:bg-yellow-500 text-white hover:scale-[1.02] active:scale-[0.98]'
              : file && jobDescription.trim()
                ? 'bg-accent text-white hover:bg-accentHover hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-darkBorder text-gray-500 cursor-not-allowed border border-gray-800'
          }`}
        >
          <Sparkles size={18} />
          <span>{isOutOfCredits ? 'Upgrade to Start Mock Interview' : 'Start Mock Interview'}</span>
        </button>
      )}
    </div>
  );
}
