import React from 'react';
import { jsPDF } from 'jspdf';
import { Award, ChevronRight, CheckCircle2, AlertTriangle, RotateCcw, Download, Sparkles, BookOpen } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function ReportPage({ profile, report, onReset }) {
  if (!report || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="text-white text-lg font-bold">No report data found</div>
        <p className="text-gray-400 text-sm">Please return to the dashboard to start a new interview.</p>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-accent hover:bg-accentHover text-white font-semibold text-sm transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getRatingColor = (score) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20';
    if (score >= 70) return 'text-accent border-accent/20 bg-accent/10';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/20 bg-yellow-950/20';
    return 'text-red-400 border-red-500/20 bg-red-950/20';
  };

  const getRatingCircleColor = (score) => {
    if (score >= 90) return 'stroke-emerald-400';
    if (score >= 70) return 'stroke-accent';
    if (score >= 50) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color definitions
    const primaryDark = '#0F1117';
    const textGray = '#4B5563';
    const borderGray = '#E5E7EB';

    // Top Header Banner (Dark Navy background)
    doc.setFillColor(15, 17, 23);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Header Logo & Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('InterviewIQ', 15, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('AI-POWERED PERFORMANCE EVALUATION REPORT', 15, 30);
    
    // Candidate Details
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(profile.name, 195, 18, { align: 'right' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(156, 163, 175);
    doc.text(`Level: ${profile.experienceLevel} (${profile.experienceYears} yrs exp)`, 195, 25, { align: 'right' });
    doc.text(`Match Score: ${profile.matchPercentage}%`, 195, 31, { align: 'right' });

    let y = 58;

    // Overall Score Card
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(15, y, 180, 26, 3, 3, 'F');
    
    doc.setTextColor(17, 24, 39);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('OVERALL SCORE', 25, y + 10);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Rating: ${report.performanceRating || 'Proficient'}`, 25, y + 18);
    
    doc.setTextColor(79, 142, 247); // Electric blue
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(32);
    doc.text(`${report.overallScore}`, 180, y + 17, { align: 'right' });
    doc.setFontSize(12);
    doc.text('/100', 190, y + 17, { align: 'right' });

    y += 40;

    // Check page overflow
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Skill-wise Breakdown
    doc.setTextColor(17, 24, 39);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Skill-wise Breakdown', 15, y);
    doc.setDrawColor(229, 231, 235);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    
    Object.entries(report.skillBreakdown || {}).forEach(([skill, score]) => {
      // Skill label
      doc.setTextColor(55, 65, 81);
      doc.setFont('Helvetica', 'bold');
      doc.text(skill, 15, y);
      
      // Progress track background
      doc.setFillColor(243, 244, 246);
      doc.rect(70, y - 3, 100, 3, 'F');
      
      // Progress track filled (electric blue)
      doc.setFillColor(79, 142, 247);
      doc.rect(70, y - 3, Math.min(score, 100), 3, 'F');
      
      // Score text
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${score}%`, 180, y);
      
      y += 9;
    });

    y += 8;

    // Check page overflow
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Strengths Block
    doc.setTextColor(16, 185, 129); // Emerald
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Key Strengths', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 9;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    
    (report.strengths || []).forEach((strength) => {
      const wrapped = doc.splitTextToSize(`• ${strength}`, 180);
      doc.text(wrapped, 15, y);
      y += wrapped.length * 5.5;
    });

    y += 6;

    // Check page overflow
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Improvements Block
    doc.setTextColor(239, 68, 68); // Red
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Areas to Improve', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 9;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    
    (report.improvements || []).forEach((improvement) => {
      const wrapped = doc.splitTextToSize(`• ${improvement}`, 180);
      doc.text(wrapped, 15, y);
      y += wrapped.length * 5.5;
    });

    y += 8;

    // Check page overflow
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Conclusion Box
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(15, y, 180, 24, 2, 2, 'F');
    
    doc.setTextColor(107, 114, 128);
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(9);
    const conclusionWrapped = doc.splitTextToSize(report.conclusion || '', 170);
    doc.text(conclusionWrapped, 20, y + 7);

    // Save
    const fileName = `InterviewIQ_${profile.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
    doc.save(fileName);
  };

  const ratingClass = getRatingColor(report.overallScore);
  const strokeClass = getRatingCircleColor(report.overallScore);

  // SVG parameters for progress circle
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.overallScore / 100) * circumference;

  const chartData = Object.entries(report.skillBreakdown || {}).map(([skill, val]) => ({
    subject: skill,
    score: val,
    fullMark: 100
  }));

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 page-transition flex flex-col gap-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-darkBorder">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent mb-3 text-xs font-medium">
            <Sparkles size={12} />
            <span>Interview Evaluated Successfully</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Performance Report</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review your core competencies, key strengths, and targeted improvement areas to refine your answers.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl border border-darkBorder hover:border-gray-500 bg-card/40 text-gray-300 font-semibold text-sm flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Try Again</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accentHover text-white font-semibold text-sm flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-accent/20 cursor-pointer"
          >
            <Download size={16} />
            <span>Download Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Score Dial Box */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-400 font-semibold text-xs tracking-wider uppercase mb-5 flex items-center gap-1.5 self-start">
            <Award size={14} className="text-accent" />
            Overall Rating
          </h3>

          {/* SVG Score Circle */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-darkBorder"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={`transition-all duration-1000 ${strokeClass}`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-mono leading-none">
                {report.overallScore}
              </span>
              <span className="text-[11px] text-gray-500 font-medium tracking-wider uppercase mt-1">
                Out of 100
              </span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full border text-sm font-bold capitalize ${ratingClass}`}>
            {report.performanceRating || 'Proficient'}
          </div>
        </div>

        {/* Radar/Spider Chart Box */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-6 flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="text-gray-400 font-semibold text-xs tracking-wider uppercase mb-5 flex items-center gap-1.5 self-start w-full">
            <Sparkles size={14} className="text-accent" />
            Competency Radar
          </h3>
          <div className="w-full h-48 flex items-center justify-center">
            {chartData.length >= 3 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                  <PolarGrid stroke="#2E3344" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 9, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4B5563', fontSize: 7 }} />
                  <Radar name="Candidate" dataKey="score" stroke="#4F8EF7" fill="#4F8EF7" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col gap-2.5 w-full text-left self-start px-2 overflow-y-auto max-h-[180px] hide-scrollbar">
                {chartData.map((data, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-darkBorder/40 last:border-b-0">
                    <span className="text-gray-400 font-semibold">{data.subject}</span>
                    <span className="text-accent font-bold font-mono">{data.score}%</span>
                  </div>
                ))}
                {chartData.length === 0 && (
                  <span className="text-xs text-gray-500 italic">No skill breakdown details</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Skill-wise Breakdown Box */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-gray-400 font-semibold text-xs tracking-wider uppercase mb-5 flex items-center gap-1.5">
              <BookOpen size={14} className="text-accent" />
              Skill-wise Competency
            </h3>
            <div className="space-y-4">
              {Object.entries(report.skillBreakdown || {}).map(([skill, val], i) => (
                <div key={i}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="text-gray-300 font-semibold">{skill}</span>
                    <span className="text-accent font-bold font-mono">{val}%</span>
                  </div>
                  <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-darkBorder">
                    <div
                      className="bg-gradient-to-r from-accent/70 to-accent h-full rounded-full transition-all duration-1000"
                      style={{ width: `${val}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-darkBorder flex items-center gap-3">
            <span className="text-xs text-gray-400 font-semibold uppercase">Experience Target:</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/10">
              {profile.experienceLevel} Level
            </span>
          </div>
        </div>
      </div>

      {/* Strengths & Improvements Detail List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-6 hover:border-emerald-500/20 transition-all">
          <h3 className="text-emerald-400 font-semibold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Key Strengths
          </h3>
          <ul className="space-y-3.5">
            {(report.strengths || []).map((strength, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed items-start">
                <ChevronRight size={14} className="text-emerald-500 flex-shrink-0 mt-1" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="rounded-2xl glass-panel border border-darkBorder p-6 hover:border-red-500/20 transition-all">
          <h3 className="text-red-400 font-semibold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
            <AlertTriangle size={16} />
            Areas to Improve
          </h3>
          <ul className="space-y-3.5">
            {(report.improvements || []).map((imp, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed items-start">
                <ChevronRight size={14} className="text-red-500 flex-shrink-0 mt-1" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Summary Conclusion Box */}
      <div className="rounded-2xl border border-darkBorder bg-card/35 p-6 text-center">
        <h4 className="text-gray-400 font-bold text-xs tracking-wider uppercase mb-2">Evaluator Conclusion</h4>
        <p className="text-gray-300 text-sm leading-relaxed max-w-3xl mx-auto italic">
          "{report.conclusion || 'Thank you for taking the time to complete this mock interview. Practice makes perfect!'}"
        </p>
      </div>
    </div>
  );
}
