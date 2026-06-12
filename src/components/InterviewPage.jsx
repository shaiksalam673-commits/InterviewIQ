import React, { useState, useEffect, useRef } from 'react';
import { User, Award, TrendingUp, CheckCircle2, XCircle, Send, Loader2 } from 'lucide-react';

export default function InterviewPage({ profile, history, setHistory, currentQuestion, setCurrentQuestion, questionNumber, setQuestionNumber, onInterviewEnd }) {
  const [answer, setAnswer] = useState('');
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [endingInterview, setEndingInterview] = useState(false);
  const [loadingFirst, setLoadingFirst] = useState(false);
  
  const chatEndRef = useRef(null);
  const hasInitialized = useRef(false);
  const isSubmitting = useRef(false);

  // Handle first question loading
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchFirstQuestion();
    }
  }, []);

  // Scroll to bottom of chat when history/waiting status updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, waitingForAI]);

  const fetchFirstQuestion = async () => {
    setLoadingFirst(true);
    setWaitingForAI(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          history: [],
          questionNumber: 1
        })
      });

      if (!response.ok) throw new Error('Failed to fetch initial question');

      const data = await response.json();
      setCurrentQuestion(data.question);
    } catch (err) {
      console.error(err);
      setCurrentQuestion("Could you start by introducing yourself and giving us a brief overview of your background and experience?");
    } finally {
      setLoadingFirst(false);
      setWaitingForAI(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e?.preventDefault();
    if (isSubmitting.current) return;
    if (!answer.trim() || waitingForAI) return;

    isSubmitting.current = true;
    const activeQ = currentQuestion;
    setCurrentQuestion('');

    const submittedAnswer = answer.trim();
    setAnswer('');
    setWaitingForAI(true);

    try {
      // 1. Submit answer for evaluation
      const evalResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQ,
          answer: submittedAnswer,
          profile
        })
      });

      if (!evalResponse.ok) throw new Error('Evaluation failed');
      const evalData = await evalResponse.json();

      // 2. Append this pair to history
      const updatedHistory = [
        ...history,
        {
          question: activeQ,
          answer: submittedAnswer,
          evaluation: evalData.evaluation
        }
      ];
      setHistory(updatedHistory);

      // 3. Move to next question or end
      const nextQNum = questionNumber + 1;
      if (nextQNum > 10) {
        onInterviewEnd(updatedHistory);
      } else {
        setQuestionNumber(nextQNum);
        
        // Fetch next question
        const qResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/next-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile,
            history: updatedHistory,
            questionNumber: nextQNum
          })
        });

        if (!qResponse.ok) throw new Error('Failed to generate next question');
        const qData = await qResponse.json();
        
        setCurrentQuestion(qData.question);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      const updatedHistory = [
        ...history,
        {
          question: activeQ,
          answer: submittedAnswer,
          evaluation: { score: 75, feedback: 'Answer received (offline evaluation).', strengths: ['Detailed answer'], improvements: [] }
        }
      ];
      setHistory(updatedHistory);
      
      const nextQNum = questionNumber + 1;
      if (nextQNum > 10) {
        onInterviewEnd(updatedHistory);
      } else {
        setQuestionNumber(nextQNum);
        setCurrentQuestion(`Great. Let's move on to question ${nextQNum}. Could you elaborate on your experience managing systems under production loads?`);
      }
    } finally {
      isSubmitting.current = false;
      setWaitingForAI(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const handleEndEarly = () => {
    if (history.length === 0) {
      alert("Please answer at least one question first");
      return;
    }
    if (window.confirm("Are you sure you want to end the interview? You will get a report based on the answers you have provided so far.")) {
      setEndingInterview(true);
      onInterviewEnd(history);
    }
  };

  const progressPercent = Math.min((questionNumber / 10) * 100, 100);

  return (
    <div className="flex-1 flex flex-col md:flex-row items-stretch w-full max-w-7xl mx-auto p-4 md:p-6 gap-6 page-transition h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* LEFT PANEL: Candidate Profile */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="rounded-2xl glass-panel border border-darkBorder p-5 flex flex-col flex-1 overflow-y-auto">
          {/* User Meta */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-darkBorder mb-5">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <User size={22} />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-white font-semibold truncate leading-tight">
                {profile.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/10">
                  {profile.experienceLevel}
                </span>
                <span className="text-xs text-gray-400">
                  {profile.experienceYears} {profile.experienceYears === 1 ? 'Year' : 'Years'} Exp
                </span>
              </div>
            </div>
          </div>

          {/* Job Match Rating */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} className="text-accent" />
                JD Match Rating
              </span>
              <span className="text-sm font-bold text-accent">{profile.matchPercentage}%</span>
            </div>
            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-darkBorder">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-500" 
                style={{ width: `${profile.matchPercentage}%` }}
              ></div>
            </div>
            <p className="text-gray-500 text-[11px] mt-1.5 leading-relaxed italic">
              {profile.experienceExplanation}
            </p>
          </div>

          {/* Matched Skills */}
          <div className="mb-5 flex-1 flex flex-col min-h-0">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Matched Skills
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 mb-4 hide-scrollbar">
              {profile.matchedSkills.length > 0 ? (
                profile.matchedSkills.map((skill, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/20 text-emerald-300 border border-emerald-500/20">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-gray-500 italic">None found</span>
              )}
            </div>

            {/* Missing Skills */}
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <XCircle size={12} className="text-red-400" />
              Missing Skills
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 hide-scrollbar">
              {profile.missingSkills.length > 0 ? (
                profile.missingSkills.map((skill, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-red-950/20 text-red-300 border border-red-500/20">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-gray-500 italic">None detected</span>
              )}
            </div>
          </div>

          {/* End Interview Button */}
          <button
            onClick={handleEndEarly}
            disabled={endingInterview}
            className="w-full mt-auto py-2.5 rounded-xl border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-300 font-medium text-sm transition-all hover:border-red-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {endingInterview ? 'Ending Interview...' : 'End Interview'}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Chat Area */}
      <div className="flex-1 flex flex-col rounded-2xl glass-panel border border-darkBorder overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-darkBorder flex items-center justify-between bg-card/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-white">AI Interviewer Persona</span>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            Question {Math.min(questionNumber, 10)} of 10
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/20 h-1">
          <div 
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Chat History Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Warmup Greeting */}
          {!loadingFirst && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                IQ
              </div>
              <div className="bg-card/65 border border-darkBorder text-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                {profile.warmupGreeting || "Hello! Let's begin the interview. I will be evaluating your match against the role."}
              </div>
            </div>
          )}

          {/* Conversation history */}
          {history.map((chat, idx) => (
            <React.Fragment key={idx}>
              {/* Question */}
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                  IQ
                </div>
                <div className="bg-card/65 border border-darkBorder text-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                  <div className="whitespace-pre-wrap font-sans">
                    {chat.question}
                  </div>
                </div>
              </div>

              {/* Candidate Answer */}
              <div className="flex gap-3 max-w-[85%] ml-auto justify-end">
                <div className="bg-accent/10 border border-accent/20 text-white px-4 py-3 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm">
                  <div className="whitespace-pre-wrap">{chat.answer}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">
                  ME
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Current Question */}
          {currentQuestion && !loadingFirst && questionNumber <= 10 && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                IQ
              </div>
              <div className="bg-card/65 border border-darkBorder text-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                <div className="whitespace-pre-wrap font-sans">
                  {currentQuestion}
                </div>
              </div>
            </div>
          )}

          {/* Typing Animation */}
          {waitingForAI && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                IQ
              </div>
              <div className="bg-card/65 border border-darkBorder px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 w-16 h-10 justify-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full dot-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full dot-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full dot-bounce"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        {questionNumber <= 10 ? (
          <form onSubmit={handleSubmitAnswer} className="p-4 border-t border-darkBorder bg-card/10 flex items-end gap-3">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={waitingForAI}
              maxLength={2000}
              placeholder={waitingForAI ? "Please wait for AI to finish..." : "Type your answer here... (Press Enter to submit, Shift+Enter for new line)"}
              className="flex-1 bg-card/40 border border-darkBorder focus:border-accent focus:ring-1 focus:ring-accent rounded-xl p-3 text-white placeholder-gray-500 text-sm resize-none h-20 outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!answer.trim() || waitingForAI}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                answer.trim() && !waitingForAI
                  ? 'bg-accent text-white hover:bg-accentHover shadow-md active:scale-95'
                  : 'bg-darkBorder text-gray-500 border border-gray-800 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className="p-5 border-t border-darkBorder bg-card/20 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-accent" size={24} />
            <span className="text-sm text-gray-300 font-semibold">Compiling your performance report...</span>
          </div>
        )}
      </div>
    </div>
  );
}
