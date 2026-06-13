import React, { useState, useEffect, useRef } from 'react';
import { User, Award, TrendingUp, CheckCircle2, XCircle, Send, Loader2, Volume2, VolumeX, Pause, Play, Camera, ShieldAlert, Sparkles, Check, PlayCircle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InterviewPage({ profile, history, setHistory, currentQuestion, setCurrentQuestion, questionNumber, setQuestionNumber, onInterviewEnd, activeUser }) {
  // Stages: 'checklist' | 'thinking' | 'active' | 'ending'
  const [stage, setStage] = useState('checklist');
  
  // Timer States
  const [checklistTimer, setChecklistTimer] = useState(3);
  const [isChecklistCounting, setIsChecklistCounting] = useState(false);
  const [thinkingTimer, setThinkingTimer] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(120); // Default based on level

  // Answer state
  const [answer, setAnswer] = useState('');
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [nextQuestionPreloaded, setNextQuestionPreloaded] = useState('');

  // Pause Controls
  const [isPaused, setIsPaused] = useState(false);
  const [pausesRemaining, setPausesRemaining] = useState(2);

  // Audio Toggle
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Feedback Toast Overlay
  const [feedbackToast, setFeedbackToast] = useState({ show: false, score: 0, text: '' });

  // Post-Interview End Steps Progress
  const [endStep, setEndStep] = useState(0); // 0: complete, 1: answers, 2: scores, 3: insights

  const [loadingFirst, setLoadingFirst] = useState(false);

  // Refs for timers and flags to prevent memory leaks
  const timerIntervalRef = useRef(null);
  const thinkingIntervalRef = useRef(null);
  const checklistIntervalRef = useRef(null);
  const isPausedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const timeExpiredRef = useRef(false);
  const audioCtxRef = useRef(null);

  // Synchronize isPaused ref
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchFirstQuestion();
    }
  }, []);

  const fetchFirstQuestion = async () => {
    setLoadingFirst(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          history: [],
          questionNumber: 1,
          userEmail: activeUser?.email || 'anonymous',
          userName: activeUser?.name || 'Guest'
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
    }
  };

  // Determine timer limit per question based on role level
  const getTimeLimit = (level) => {
    if (level === 'Fresher') return 180; // 3 min
    if (level === 'Junior') return 150;  // 2.5 min
    if (level === 'Mid') return 120;     // 2 min
    if (level === 'Senior') return 90;   // 1.5 min
    return 120;
  };

  // Web Audio API Synthesizer clicks & chimes
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playKeyboardSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = getAudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95 + Math.random() * 60, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (err) {
      console.warn('Audio Context blocked or unsupported', err);
    }
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = getAudioContext();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.15);
      osc2.start(audioCtx.currentTime + 0.12);
      osc2.stop(audioCtx.currentTime + 0.35);
    } catch (err) {
      console.warn('Audio Context chime failed', err);
    }
  };

  // Helper to categorize badge names
  const getCategoryName = (qNum) => {
    if (qNum <= 2) return 'Warm-up';
    if (qNum <= 7) return 'Technical';
    if (qNum <= 9) return 'Behavioral';
    return 'Situational';
  };

  const getCategoryBadgeColor = (qNum) => {
    if (qNum <= 2) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (qNum <= 7) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (qNum <= 9) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
  };

  // 1. Checklist Auto-start Trigger
  const handleBeginInterview = () => {
    setIsChecklistCounting(true);
    setChecklistTimer(3);
    
    checklistIntervalRef.current = setInterval(() => {
      setChecklistTimer((prev) => {
        if (prev <= 1) {
          clearInterval(checklistIntervalRef.current);
          setStage('thinking');
          startGetReadyCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 2. 5s Get Ready countdown overlay
  const startGetReadyCountdown = () => {
    setThinkingTimer(5);
    // Trigger audio chime for new question alert
    setTimeout(() => playNotificationSound(), 100);

    thinkingIntervalRef.current = setInterval(() => {
      setThinkingTimer((prev) => {
        if (prev <= 1) {
          clearInterval(thinkingIntervalRef.current);
          setStage('active');
          setSecondsLeft(getTimeLimit(profile.experienceLevel));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSkipThinking = () => {
    clearInterval(thinkingIntervalRef.current);
    setStage('active');
    setSecondsLeft(getTimeLimit(profile.experienceLevel));
  };

  // 3. Question timer interval loop
  useEffect(() => {
    if (stage === 'active' && !isPaused && !waitingForAI) {
      timerIntervalRef.current = setInterval(() => {
        timeExpiredRef.current = false;
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            timeExpiredRef.current = true;
            return 0;
          }
          return prev - 1;
        });

        if (timeExpiredRef.current) {
          clearInterval(timerIntervalRef.current);
          handleTimeLimitExpiration();
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [stage, isPaused, questionNumber, waitingForAI]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (checklistIntervalRef.current) clearInterval(checklistIntervalRef.current);
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // 4. Auto submit when timer runs out
  const handleTimeLimitExpiration = async () => {
    const backupAnswer = answer.trim();
    setAnswer('');
    
    // Toast warning
    setFeedbackToast({
      show: true,
      score: 30,
      text: backupAnswer ? "✓ Time's up! Answer submitted automatically." : "⚠️ Time's up! No answer provided."
    });

    const finalAnswer = backupAnswer || "No answer provided";
    setWaitingForAI(true);

    try {
      let evalData;
      // If empty response, override locally to score 30
      if (!backupAnswer) {
        evalData = {
          evaluation: {
            score: 30,
            feedback: "No response given. The time limit expired before an answer was provided.",
            strengths: [],
            improvements: ["Plan your time to submit answers before the countdown expires."]
          }
        };
        // Background API call to keep logs accurate
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/submit-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQuestion,
            answer: finalAnswer,
            profile,
            userEmail: activeUser?.email || 'anonymous',
            userName: activeUser?.name || 'Guest'
          })
        }).catch(err => console.error(err));
      } else {
        const evalResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/submit-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQuestion,
            answer: finalAnswer,
            profile,
            userEmail: activeUser?.email || 'anonymous',
            userName: activeUser?.name || 'Guest'
          })
        });
        if (!evalResponse.ok) throw new Error('Evaluation failed');
        evalData = await evalResponse.json();
      }

      // Record state history
      const updatedHistory = [
        ...history,
        {
          question: currentQuestion,
          answer: finalAnswer,
          evaluation: evalData.evaluation
        }
      ];
      setHistory(updatedHistory);

      // Pre-fetch next question if interview is not complete
      const nextQNum = questionNumber + 1;
      if (nextQNum <= 10) {
        preloadNextQuestion(updatedHistory, nextQNum);
      }

      // Wait 3 seconds for toast, then transition
      setTimeout(() => {
        setFeedbackToast({ show: false, score: 0, text: '' });
        setWaitingForAI(false);
        if (nextQNum > 10) {
          triggerEndAnimation(updatedHistory);
        } else {
          setQuestionNumber(nextQNum);
          setStage('thinking');
          startGetReadyCountdown();
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      // Fallback evaluation
      const updatedHistory = [
        ...history,
        {
          question: currentQuestion,
          answer: finalAnswer,
          evaluation: { score: 50, feedback: 'Offline evaluation due to connection error.', strengths: [], improvements: [] }
        }
      ];
      setHistory(updatedHistory);
      setTimeout(() => {
        setFeedbackToast({ show: false, score: 0, text: '' });
        setWaitingForAI(false);
        const nextQNum = questionNumber + 1;
        if (nextQNum > 10) {
          triggerEndAnimation(updatedHistory);
        } else {
          setQuestionNumber(nextQNum);
          setStage('thinking');
          startGetReadyCountdown();
        }
      }, 3000);
    }
  };

  // Pre-load next question while user is reviewing the toast feedback
  const preloadNextQuestion = async (updatedHistory, nextQNum) => {
    try {
      const qResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          history: updatedHistory,
          questionNumber: nextQNum,
          userEmail: activeUser?.email || 'anonymous',
          userName: activeUser?.name || 'Guest'
        })
      });
      if (qResponse.ok) {
        const qData = await qResponse.json();
        setNextQuestionPreloaded(qData.question);
      }
    } catch (err) {
      console.error('Pre-loading failed', err);
    }
  };

  // Update currentQuestion text once we enter get-ready phase
  useEffect(() => {
    if (stage === 'thinking') {
      if (nextQuestionPreloaded) {
        setCurrentQuestion(nextQuestionPreloaded);
        setNextQuestionPreloaded('');
      } else if (questionNumber > 1) {
        // Fallback fetch if not preloaded
        const fetchFallbackQuestion = async () => {
          setLoadingFirst(true);
          try {
            const qResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/next-question`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                profile,
                history,
                questionNumber,
                userEmail: activeUser?.email || 'anonymous',
                userName: activeUser?.name || 'Guest'
              })
            });
            if (qResponse.ok) {
              const qData = await qResponse.json();
              setCurrentQuestion(qData.question);
            } else {
              throw new Error('Fallback fetch failed');
            }
          } catch (err) {
            console.error(err);
            setCurrentQuestion(`Great. Let's move on to question ${questionNumber}. Could you elaborate on your experience managing systems under production loads?`);
          } finally {
            setLoadingFirst(false);
          }
        };
        fetchFallbackQuestion();
      }
    }
  }, [stage, nextQuestionPreloaded, questionNumber, profile, history, activeUser, setCurrentQuestion]);

  // 5. Normal answer submission handler
  const handleSubmitAnswer = async (e) => {
    e?.preventDefault();
    if (isSubmittingRef.current) return;
    if (!answer.trim() || waitingForAI || isPaused) return;

    isSubmittingRef.current = true;
    const submittedAnswer = answer.trim();
    setAnswer('');
    setWaitingForAI(true);

    try {
      // 1. Submit answer for evaluation
      const evalResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          answer: submittedAnswer,
          profile,
          userEmail: activeUser?.email || 'anonymous',
          userName: activeUser?.name || 'Guest'
        })
      });

      if (!evalResponse.ok) throw new Error('Evaluation failed');
      const evalData = await evalResponse.json();

      // 2. Append this pair to history
      const updatedHistory = [
        ...history,
        {
          question: currentQuestion,
          answer: submittedAnswer,
          evaluation: evalData.evaluation
        }
      ];
      setHistory(updatedHistory);

      // Trigger live score slide-in toast
      setFeedbackToast({
        show: true,
        score: evalData.evaluation.score,
        text: `✓ Evaluation: ${evalData.evaluation.feedback}`
      });

      // 3. Preload next question in parallel
      const nextQNum = questionNumber + 1;
      if (nextQNum <= 10) {
        preloadNextQuestion(updatedHistory, nextQNum);
      }

      // Hold for 3s, then load get-ready or compile results
      setTimeout(() => {
        setFeedbackToast({ show: false, score: 0, text: '' });
        setWaitingForAI(false);
        isSubmittingRef.current = false;
        
        if (nextQNum > 10) {
          triggerEndAnimation(updatedHistory);
        } else {
          setQuestionNumber(nextQNum);
          setStage('thinking');
          startGetReadyCountdown();
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      const updatedHistory = [
        ...history,
        {
          question: currentQuestion,
          answer: submittedAnswer,
          evaluation: { score: 70, feedback: 'Offline response stored successfully.', strengths: [], improvements: [] }
        }
      ];
      setHistory(updatedHistory);
      setFeedbackToast({
        show: true,
        score: 70,
        text: '✓ Connection error: Answer logged locally.'
      });

      setTimeout(() => {
        setFeedbackToast({ show: false, score: 0, text: '' });
        setWaitingForAI(false);
        isSubmittingRef.current = false;
        const nextQNum = questionNumber + 1;
        if (nextQNum > 10) {
          triggerEndAnimation(updatedHistory);
        } else {
          setQuestionNumber(nextQNum);
          setStage('thinking');
          startGetReadyCountdown();
        }
      }, 3000);
    }
  };

  // 6. Pause Control Handles
  const handleTogglePause = () => {
    if (stage !== 'active' || waitingForAI) return;

    if (isPaused) {
      setIsPaused(false);
    } else {
      if (pausesRemaining <= 0) {
        alert("Maximum limits reached: No pauses remaining.");
        return;
      }
      setIsPaused(true);
      setPausesRemaining((prev) => prev - 1);
    }
  };

  // 7. End-Screen Transition Animation
  const triggerEndAnimation = (finalHistory) => {
    setStage('ending');
    setEndStep(1);

    // Confetti burst
    try {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.5 }
      });
    } catch (e) {
      console.warn('Confetti fail', e);
    }

    // Progression of status steps
    setTimeout(() => setEndStep(2), 1000);
    setTimeout(() => setEndStep(3), 2000);
    setTimeout(() => {
      onInterviewEnd(finalHistory);
    }, 3200);
  };

  // Helper for keyboard triggers
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  // Early terminate handle
  const handleEndEarly = () => {
    if (waitingForAI) {
      alert("Please wait for evaluation to complete");
      return;
    }
    if (history.length === 0) {
      alert("Please answer at least one question first.");
      return;
    }
    if (window.confirm("Are you sure you want to end the interview early? A final report will be calculated based on the responses submitted so far.")) {
      triggerEndAnimation(history);
    }
  };

  // Circular progress calculations
  const maxTime = getTimeLimit(profile.experienceLevel);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, secondsLeft) / maxTime) * circumference;

  // Real-time answer length quality bars
  const getQualityText = (words) => {
    if (words === 0) return { label: 'Awaiting Response 📝', color: 'text-gray-500' };
    if (words < 20) return { label: 'Too brief ⚠️', color: 'text-red-400' };
    if (words <= 80) return { label: 'Getting there 📝', color: 'text-yellow-400' };
    if (words <= 150) return { label: 'Good length ✅', color: 'text-emerald-400' };
    if (words <= 200) return { label: 'Good length ✅', color: 'text-emerald-400' };
    return { label: 'Consider being concise 📏', color: 'text-orange-400' };
  };

  const getWordCount = (str) => {
    return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
  };

  const currentWords = getWordCount(answer);
  const quality = getQualityText(currentWords);

  // Score Badge Color Helper
  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/35';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/35';
    return 'bg-red-500/20 text-red-400 border-red-500/35';
  };

  // ============================================
  //            1. STAGE: CHECKLIST
  // ============================================
  if (stage === 'checklist') {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 page-transition flex flex-col justify-center items-center">
        {isChecklistCounting ? (
          <div className="text-center flex flex-col items-center justify-center p-8 rounded-2xl glass-panel border border-darkBorder w-full max-w-md shadow-2xl relative overflow-hidden animate-pulse-slow">
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-accent/10 rounded-full blur-2xl"></div>
            <h2 className="text-xl font-extrabold text-gray-400 uppercase tracking-widest mb-6">Initializing Interview Room</h2>
            <div className="text-7xl font-black text-accent font-mono animate-bounce">{checklistTimer}</div>
            <p className="text-xs text-gray-500 mt-6 leading-relaxed">Adjust your seat, minimize distractions, and prepare to begin.</p>
          </div>
        ) : (
          <div className="w-full rounded-2xl glass-panel border border-darkBorder p-6 md:p-8 shadow-2xl flex flex-col gap-6 relative">
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-accent/10 rounded-full blur-2xl"></div>
            
            {/* Title */}
            <div className="border-b border-darkBorder pb-4 flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent mb-2.5 text-xs font-semibold">
                  <Sparkles size={12} />
                  Setup Ready
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">Pre-Interview Preparation</h1>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl border border-darkBorder transition-all flex items-center justify-center cursor-pointer ${
                  soundEnabled ? 'bg-accent/10 text-accent border-accent/20' : 'bg-card/25 text-gray-500'
                }`}
                title={soundEnabled ? "Sound ON" : "Sound OFF"}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            {/* Preparation Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Checklist panel */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Initialization Checks</h3>
                <div className="space-y-3 bg-black/20 border border-darkBorder/30 p-5 rounded-xl">
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 flex items-center justify-center flex-shrink-0 animate-scale-in">
                      <Check size={12} />
                    </div>
                    <span>Resume successfully parsed</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 flex items-center justify-center flex-shrink-0 animate-scale-in">
                      <Check size={12} />
                    </div>
                    <span>Job Description mapped</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 flex items-center justify-center flex-shrink-0 animate-scale-in">
                      <Check size={12} />
                    </div>
                    <span>Persona preset initialized: <strong>Alex Chen</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 flex items-center justify-center flex-shrink-0 animate-scale-in">
                      <Check size={12} />
                    </div>
                    <span>Experience tier: <strong>{profile.experienceLevel}</strong></span>
                  </div>
                </div>
              </div>

              {/* Skills and constraints panel */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Focus Assessment Skills</h3>
                <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {profile.matchedSkills.map((skill, index) => (
                    <span key={index} className="text-xs font-medium px-3 py-1 rounded-lg bg-card/65 text-gray-300 border border-darkBorder">
                      {skill}
                    </span>
                  ))}
                  {profile.matchedSkills.length === 0 && (
                    <span className="text-xs text-gray-500 italic">No direct resume skill matches detected.</span>
                  )}
                </div>
                <div className="mt-auto pt-4 border-t border-darkBorder/40 text-xs text-gray-500 flex items-center gap-2">
                  <Clock size={14} className="text-accent" />
                  <span>Test format: <strong>10 questions</strong>. Estimated duration: <strong>20 minutes</strong>.</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-6 border-t border-darkBorder flex justify-end">
              <button
                onClick={handleBeginInterview}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent hover:bg-accentHover text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <PlayCircle size={18} />
                <span>Begin Mock Interview</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  //            2. STAGE: THINKING (COUNTDOWN)
  // ============================================
  if (stage === 'thinking') {
    return (
      <div className="flex-1 w-full max-w-lg mx-auto p-4 flex flex-col justify-center items-center page-transition">
        <div className="w-full text-center rounded-2xl glass-panel border border-darkBorder p-8 md:p-10 shadow-2xl relative flex flex-col items-center">
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-accent/10 rounded-full blur-2xl"></div>
          
          <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 bg-accent/10 text-accent border border-accent/25 animate-pulse">
            {getCategoryName(questionNumber)} Question
          </span>
          <h2 className="text-xl font-bold text-white mb-8">Get ready to formulate your response...</h2>
          
          {/* Big pulsing counter */}
          <div className="w-24 h-24 rounded-full border-4 border-accent/20 flex items-center justify-center relative mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <span className="text-4xl font-black text-white font-mono">{thinkingTimer}</span>
          </div>

          <button
            onClick={handleSkipThinking}
            className="px-6 py-2.5 rounded-xl border border-darkBorder hover:border-gray-500 bg-card/25 text-gray-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Skip Timer</span>
            <Send size={12} />
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  //            4. STAGE: ENDING (REPORT WORK)
  // ============================================
  if (stage === 'ending') {
    return (
      <div className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col justify-center items-center page-transition">
        <div className="w-full rounded-2xl glass-panel border border-darkBorder p-8 shadow-2xl flex flex-col items-center text-center gap-6 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-accent/15 rounded-full blur-2xl animate-pulse"></div>
          
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent animate-bounce">
            <Sparkles size={28} />
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-white">Interview Complete!</h2>
            <p className="text-xs text-gray-400 mt-1">Excellent effort. Compiling your performance metrics...</p>
          </div>

          {/* Dynamic status list */}
          <div className="w-full bg-black/25 border border-darkBorder/40 rounded-xl p-5 text-left space-y-3.5 mt-2">
            {/* Step 1 */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={endStep >= 1 ? 'text-white' : 'text-gray-600'}>Aggregating answers</span>
              {endStep > 1 ? (
                <CheckCircle2 size={15} className="text-emerald-400 animate-scale-in" />
              ) : endStep === 1 ? (
                <Loader2 size={15} className="animate-spin text-accent" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-darkBorder"></div>
              )}
            </div>

            {/* Step 2 */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={endStep >= 2 ? 'text-white' : 'text-gray-600'}>Calculating competency scores</span>
              {endStep > 2 ? (
                <CheckCircle2 size={15} className="text-emerald-400 animate-scale-in" />
              ) : endStep === 2 ? (
                <Loader2 size={15} className="animate-spin text-accent" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-darkBorder"></div>
              )}
            </div>

            {/* Step 3 */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={endStep >= 3 ? 'text-white' : 'text-gray-600'}>Generating feedback report</span>
              {endStep > 3 ? (
                <CheckCircle2 size={15} className="text-emerald-400 animate-scale-in" />
              ) : endStep === 3 ? (
                <Loader2 size={15} className="animate-spin text-accent" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-darkBorder"></div>
              )}
            </div>
          </div>

          {/* Bottom progress filler bar */}
          <div className="w-full bg-darkBorder/45 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-accent h-full rounded-full transition-all duration-1000"
              style={{ width: `${(endStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  //            3. STAGE: ACTIVE (INTERVIEW ROOM)
  // ============================================
  // Previous question for display above
  const previousQuestionText = history[history.length - 1]?.question || '';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 page-transition flex flex-col gap-6 relative min-h-[550px]">
      
      {/* Live Feedback Toast Slide-in */}
      <div className={`fixed top-20 right-6 z-50 transition-all duration-500 transform ${
        feedbackToast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      }`}>
        <div className="rounded-2xl glass-panel border border-darkBorder p-4 shadow-2xl max-w-sm flex items-start gap-4">
          <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex-shrink-0 ${getScoreBadgeColor(feedbackToast.score)}`}>
            {feedbackToast.score}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Answer Logged</h4>
            <p className="text-[11px] text-gray-400 leading-normal mt-1">{feedbackToast.text}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-stretch gap-6">
        
        {/* LEFT PANEL (40%): AI Interviewer */}
        <div className="w-full md:w-[38%] flex-shrink-0 flex flex-col">
          <div className="rounded-2xl glass-panel border border-darkBorder p-6 flex flex-col items-center text-center justify-between h-full relative overflow-hidden">
            
            {/* Header branding */}
            <div className="w-full border-b border-darkBorder/60 pb-4 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Mock Session</span>
                <span className="text-xs font-bold text-accent">TechCorp Interview</span>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl border border-darkBorder transition-all flex items-center justify-center cursor-pointer ${
                  soundEnabled ? 'bg-accent/10 text-accent border-accent/20' : 'bg-card/25 text-gray-500'
                }`}
                title={soundEnabled ? "Sound ON" : "Sound OFF"}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>

            {/* Pulsing Avatar Area */}
            <div className="my-8 flex flex-col items-center">
              <div className="relative w-36 h-36 mb-5">
                {/* Green Pulsing Ring (speaking) vs Gray (listening) */}
                {waitingForAI || stage === 'thinking' || feedbackToast.show ? (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 shadow-lg shadow-emerald-500/25"></div>
                  </>
                ) : (
                  <div className="absolute inset-0 rounded-full border-4 border-gray-600"></div>
                )}
                
                {/* Center Circle */}
                <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center text-white text-3xl font-black shadow-inner">
                  IQ
                </div>
              </div>

              <h2 className="text-white font-extrabold text-lg">Alex Chen</h2>
              <span className="text-xs text-gray-400 mt-1">Senior Recruiter</span>
            </div>

            {/* Speaking vs Listening indicator status */}
            <div className="w-full bg-black/20 border border-darkBorder/40 rounded-xl p-3.5 flex items-center justify-center gap-2.5">
              {waitingForAI || stage === 'thinking' || feedbackToast.show ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">AI Interviewer is speaking</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Interviewer is listening</span>
                </>
              )}
            </div>

            {/* Footer Exit Actions */}
            <div className="w-full border-t border-darkBorder/60 pt-4 mt-6">
              <button
                onClick={handleEndEarly}
                className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-950/15 hover:bg-red-950/35 text-red-300 text-xs font-bold transition-all hover:border-red-500/40 cursor-pointer"
              >
                End Interview Early
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (60%): Candidate Section */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Top Info Card with circular countdown timer */}
          <div className="rounded-2xl glass-panel border border-darkBorder p-5 flex items-center justify-between bg-card/20">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Candidate Session</span>
              <h3 className="text-white font-extrabold text-lg mt-0.5">{activeUser?.name || 'Guest'}</h3>
              <span className="text-xs text-gray-400 block mt-0.5">Target: {profile.targetRole} ({profile.experienceLevel} Level)</span>
            </div>

            {/* SVG Circular Countdown Ring */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-darkBorder/60 fill-none"
                  strokeWidth="3.5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className={`fill-none transition-all duration-1000 ${
                    secondsLeft <= 10 
                      ? 'stroke-red-500 animate-pulse' 
                      : secondsLeft <= 30 
                        ? 'stroke-yellow-500' 
                        : 'stroke-emerald-500'
                  }`}
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono font-bold text-xs text-white leading-none">
                {secondsLeft}s
                <span className="text-[7px] text-gray-500 uppercase tracking-widest mt-0.5">Left</span>
              </div>
            </div>
          </div>

          {/* Active Question Display Card */}
          <div className="rounded-2xl glass-panel border border-darkBorder p-6 flex flex-col gap-4 relative overflow-hidden">
            {/* Background Blur Overlay for Pause State */}
            {isPaused && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-xl z-20 flex flex-col items-center justify-center gap-4 text-center p-6">
                <ShieldAlert size={40} className="text-accent animate-bounce" />
                <h3 className="text-xl font-black text-white">Interview Paused</h3>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">Timer and question are locked. Press resume to continue your session.</p>
                <div className="text-[11px] font-bold text-accent font-mono">PAUSES REMAINING: {pausesRemaining}</div>
                <button
                  onClick={handleTogglePause}
                  className="px-6 py-2.5 bg-accent hover:bg-accentHover text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Resume Session</span>
                </button>
              </div>
            )}

            {/* Header Details */}
            <div className={`flex items-center justify-between border-b border-darkBorder/40 pb-3 ${isPaused ? 'filter blur-md' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white font-mono bg-card/60 border border-darkBorder/60 px-2.5 py-1 rounded-lg">
                  Question {questionNumber} of 10
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest border uppercase ${getCategoryBadgeColor(questionNumber)}`}>
                  {getCategoryName(questionNumber)}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Time limit: {maxTime}s</span>
            </div>

            {/* Context: Previous question */}
            {previousQuestionText && (
              <p className={`text-[11px] text-gray-500 italic truncate ${isPaused ? 'filter blur-md' : ''}`}>
                Previous: {previousQuestionText}
              </p>
            )}

            {/* Active Question text */}
            <div className={`p-4 bg-black/20 border border-darkBorder/20 rounded-xl min-h-[90px] flex items-center justify-center animate-fade-in ${isPaused ? 'filter blur-md' : ''}`}>
              {loadingFirst ? (
                <div className="flex items-center gap-2.5 text-gray-400">
                  <Loader2 className="animate-spin text-accent" size={18} />
                  <span className="text-xs font-semibold">Generating customized question...</span>
                </div>
              ) : (
                <p className="text-white text-base md:text-lg font-bold leading-relaxed text-center font-sans">
                  {currentQuestion}
                </p>
              )}
            </div>
          </div>

          {/* Webcam Simulator Placeholder Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera feed placeholder */}
            <div className="relative aspect-video rounded-xl bg-black/60 border border-darkBorder flex flex-col items-center justify-center text-gray-500 overflow-hidden">
              <Camera size={36} className="text-gray-600 mb-2 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Camera Preview</span>
              <span className="text-[10px] text-gray-600 mt-1">Mock Feed Active</span>
              
              {/* Flashing RED REC dot */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-red-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider font-mono">REC</span>
              </div>
            </div>

            {/* Status overview and time metrics */}
            <div className="rounded-xl border border-darkBorder/80 bg-card/25 p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Metrics Summary</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-darkBorder/20 pb-1.5">
                    <span className="text-gray-400">Elapsed this question</span>
                    <span className="font-semibold text-white font-mono">{maxTime - secondsLeft}s</span>
                  </div>
                  <div className="flex justify-between border-b border-darkBorder/20 pb-1.5">
                    <span className="text-gray-400">Questions answered</span>
                    <span className="font-semibold text-white font-mono">{history.length} / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pauses remaining</span>
                    <span className={`font-bold font-mono ${pausesRemaining > 0 ? 'text-accent' : 'text-red-400'}`}>
                      {pausesRemaining}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Pause Actions */}
              <button
                onClick={handleTogglePause}
                disabled={waitingForAI}
                className="w-full mt-4 py-2 rounded-xl border border-darkBorder hover:border-gray-500 bg-card/40 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Pause size={12} />
                <span>Pause Interview ({pausesRemaining} left)</span>
              </button>
            </div>
          </div>

          {/* Typing answer block */}
          <form onSubmit={handleSubmitAnswer} className="rounded-2xl glass-panel border border-darkBorder p-5 flex flex-col gap-4 bg-card/10">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                <span>Your Response</span>
                <span className={`font-bold font-mono text-[10px] ${quality.color}`}>{quality.label}</span>
              </label>
              <textarea
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  playKeyboardSound();
                }}
                onKeyDown={handleKeyDown}
                disabled={waitingForAI || isPaused}
                maxLength={2000}
                placeholder={
                  isPaused 
                    ? "Session is paused..." 
                    : waitingForAI 
                      ? "Waiting for AI evaluator..." 
                      : "Type your structured response here... (Press Enter to submit, Shift+Enter for new line)"
                }
                className="w-full bg-card/45 border border-darkBorder focus:border-accent focus:ring-1 focus:ring-accent rounded-xl p-4 text-white placeholder-gray-600 text-sm h-32 outline-none transition-all resize-none disabled:opacity-50"
              />
            </div>

            {/* Answer Hints Footer */}
            <div className="flex items-center justify-between border-t border-darkBorder/40 pt-5">
              <div className="text-xs text-gray-500 font-mono">
                Words: <strong className="text-gray-300">{currentWords}</strong> <span className="text-[10px] text-gray-600">(Target: 80 - 150)</span>
              </div>
              <button
                type="submit"
                disabled={!answer.trim() || waitingForAI || isPaused}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                  answer.trim() && !waitingForAI && !isPaused
                    ? 'bg-accent text-white hover:bg-accentHover hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-darkBorder text-gray-500 border border-gray-800 cursor-not-allowed'
                }`}
              >
                {waitingForAI ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <Send size={13} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
