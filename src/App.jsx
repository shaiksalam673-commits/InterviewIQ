import React, { useState, useEffect } from 'react';
import { ClerkProvider, useUser, UserButton } from '@clerk/clerk-react';
import { Sparkles, Terminal, LogOut, ShieldAlert, Award, Star, Loader2 } from 'lucide-react';
import UploadPage from './components/UploadPage';
import InterviewPage from './components/InterviewPage';
import ReportPage from './components/ReportPage';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import UpgradeModal from './components/UpgradeModal';
import HistoryPage from './components/HistoryPage';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const isClerkEnabled = clerkPublishableKey.trim() !== '';

function AppInner({ clerkUser, isSignedIn, isClerk }) {
  const [page, setPage] = useState('landing'); // 'landing' | 'auth' | 'upload' | 'interview' | 'report' | 'history'
  const [mockUser, setMockUser] = useState(null);
  const [credits, setCredits] = useState(3);
  const [isPro, setIsPro] = useState(false);
  
  // Dialog overlays
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Global interview state variables
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [report, setReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [config, setConfig] = useState({ isGeminiConfigured: false });

  // Determine active user object
  const activeUser = isClerk ? (isSignedIn ? {
    name: clerkUser.fullName || clerkUser.username || 'Candidate',
    email: clerkUser.primaryEmailAddress?.emailAddress || ''
  } : null) : mockUser;

  // Initialize Auth session & Credits on Mount
  useEffect(() => {
    // 1. Get user session
    if (!isClerk) {
      const storedSession = localStorage.getItem('interviewiq_mock_session');
      if (storedSession) {
        setMockUser(JSON.parse(storedSession));
        setPage('upload');
      }
    } else if (isSignedIn && clerkUser) {
      setPage('upload');
    }

    // 3. Initialise pro status
    const storedPro = localStorage.getItem('interviewiq_is_pro');
    if (storedPro !== null) {
      setIsPro(storedPro === 'true');
    } else {
      localStorage.setItem('interviewiq_is_pro', 'false');
      setIsPro(false);
    }
  }, [isSignedIn, clerkUser, isClerk]);

  // Fetch API Configuration Status from Server
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/config`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to load server config', err);
      }
    };
    fetchConfig();
  }, []);

  // Clear state and return to landing when user signs out (Clerk mode)
  useEffect(() => {
    if (isClerk && !isSignedIn) {
      setPage('landing');
      setProfile(null);
      setReport(null);
      setHistory([]);
      setCurrentQuestion('');
      setQuestionNumber(1);
    }
  }, [isSignedIn, isClerk]);

  // Guard check: Redirect to upload page if profile is missing on interview or report pages
  useEffect(() => {
    if ((page === 'interview' || page === 'report') && !profile) {
      setPage('upload');
    }
  }, [page, profile]);

  // Sync credits state whenever the active user changes
  useEffect(() => {
    if (!activeUser) {
      setCredits(0);
      return;
    }

    const userKey = activeUser.email || activeUser.id || 'user';
    const storageKey = `interviewiq_credits_${userKey}`;
    
    // Check if the user has signed up before
    const registeredUsers = JSON.parse(localStorage.getItem('interviewiq_registered_users') || '[]');
    const isReturningUser = registeredUsers.includes(userKey);
    
    const storedCredits = localStorage.getItem(storageKey);
    
    if (storedCredits !== null) {
      setCredits(parseInt(storedCredits, 10));
    } else if (!isReturningUser) {
      // New signup: Grant 3 free credits and add to registered list
      localStorage.setItem(storageKey, '3');
      setCredits(3);
      localStorage.setItem('interviewiq_registered_users', JSON.stringify([...registeredUsers, userKey]));
    } else {
      // Returning user but no credits record found: default to 0
      localStorage.setItem(storageKey, '0');
      setCredits(0);
    }
  }, [activeUser]);


  const handleAnalysisComplete = (parsedProfile) => {
    // Enforce Credit Restriction
    if (credits <= 0 && !isPro) {
      setUpgradeModalOpen(true);
      return;
    }

    setProfile(parsedProfile);
    setHistory([]);
    setCurrentQuestion('');
    setQuestionNumber(1);
    setReport(null);
    setPage('interview');
  };

  const handleUpgradeSuccess = (addedCredits, proStatus) => {
    if (proStatus) {
      setIsPro(true);
      localStorage.setItem('interviewiq_is_pro', 'true');
    } else {
      const newCredits = credits + addedCredits;
      setCredits(newCredits);
      if (activeUser) {
        const userKey = activeUser.email || activeUser.id || 'user';
        localStorage.setItem(`interviewiq_credits_${userKey}`, newCredits.toString());
      }
    }
  };

  const handleLogout = () => {
    if (isClerk) {
      // Handled by Clerk UserButton natively, but for safety:
      setPage('landing');
    } else {
      localStorage.removeItem('interviewiq_mock_session');
      setMockUser(null);
      setPage('landing');
    }
  };

  const handleInterviewEnd = async (finalHistory) => {
    setQuestionNumber(11);
    setIsGeneratingReport(true);
    let finalReportData = null;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          history: finalHistory,
        }),
      });

      if (!response.ok) throw new Error('Failed to compile report');
      finalReportData = await response.json();
    } catch (err) {
      console.error(err);
      const scores = finalHistory.map(h => h.evaluation?.score || 70);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
      finalReportData = {
        overallScore: avg,
        performanceRating: avg >= 90 ? 'Excellent' : avg >= 70 ? 'Proficient' : 'Developing',
        skillBreakdown: profile?.matchedSkills?.reduce((acc, skill) => {
          acc[skill] = Math.min(avg + (Math.random() > 0.5 ? 5 : -10), 98);
          return acc;
        }, {}) || { 'Software Engineering': avg },
        strengths: ['Clear keyboard answer structure.'],
        improvements: ['Elaborate further on architectural trade-offs.'],
        conclusion: 'Offline sandbox compilation complete. Review recommendations.'
      };
    } finally {
      setIsGeneratingReport(false);
    }

    if (finalReportData) {
      setReport(finalReportData);
      
      // Decrement credits
      if (!isPro && activeUser) {
        const userKey = activeUser.email || activeUser.id || 'user';
        setCredits(prev => {
          const newCredits = Math.max(0, prev - 1);
          localStorage.setItem(`interviewiq_credits_${userKey}`, newCredits.toString());
          return newCredits;
        });
      }

      // Save session to history in localStorage
      const historyItem = {
        id: 'session_' + Date.now(),
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        jobRole: profile?.targetRole || 'Full Stack',
        score: finalReportData.overallScore,
        skills: Object.keys(finalReportData.skillBreakdown || {}),
        profile,
        report: finalReportData,
        history: finalHistory
      };
      try {
        const currentHist = JSON.parse(localStorage.getItem('interviewiq_history') || '[]');
        localStorage.setItem('interviewiq_history', JSON.stringify([historyItem, ...currentHist]));
      } catch (saveErr) {
        console.error('Failed to save session history', saveErr);
      }
      
      setPage('report');
    }
  };

  const handleReset = () => {
    setProfile(null);
    setHistory([]);
    setCurrentQuestion('');
    setQuestionNumber(1);
    setReport(null);
    setPage(activeUser ? 'upload' : 'landing');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* SaaS Navigation Header */}
      <header className="border-b border-darkBorder bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleReset}>
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-black shadow-md shadow-accent/20">
                IQ
              </div>
              <div>
                <span className="text-white font-extrabold text-lg tracking-tight">InterviewIQ</span>
                <span className="text-[10px] text-gray-500 font-mono ml-2 border border-darkBorder px-1.5 py-0.5 rounded bg-black/20">SaaS</span>
              </div>
            </div>
            
            {activeUser && (
              <nav className="hidden sm:flex items-center gap-1 border-l border-darkBorder pl-5">
                <button
                  onClick={() => setPage('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    page === 'upload' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  Start New
                </button>
                <button
                  onClick={() => setPage('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    page === 'history' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  History
                </button>
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {activeUser ? (
              <>
                {/* Credit balance display */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Remaining Balance</span>
                    <span className="text-xs font-bold text-accent font-mono">
                      {isPro ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Star size={10} fill="currentColor" /> Pro Unlimited
                        </span>
                      ) : (
                        `${credits} Free ${credits === 1 ? 'Session' : 'Sessions'}`
                      )}
                    </span>
                  </div>
                  
                  {/* Purchase/Upgrade Button */}
                  {!isPro && (
                    <button
                      onClick={() => setUpgradeModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white transition-all text-xs font-semibold"
                    >
                      Upgrade
                    </button>
                  )}
                </div>

                {/* Logout details */}
                <div className="flex items-center gap-3 border-l border-darkBorder pl-4">
                  {isClerk ? (
                    <UserButton afterSignOutUrl="/" />
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-gray-400 font-medium max-w-[100px] truncate">
                        {activeUser.name}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-lg border border-darkBorder bg-card/25 text-gray-500 hover:text-red-400 hover:border-red-500/20 transition-all"
                        title="Log Out Mock Session"
                      >
                        <LogOut size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1 mr-2">
                  <Terminal size={12} />
                  SaaS Mode
                </span>
                {page === 'landing' && (
                  <button
                    onClick={() => setPage('auth')}
                    className="px-4 py-1.5 rounded-xl bg-accent hover:bg-accentHover text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Login
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main SaaS Screen Routing */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {page === 'landing' && (
          <LandingPage 
            user={activeUser}
            onStart={() => {
              if (activeUser) {
                setPage('upload');
              } else {
                setPage('auth');
              }
            }}
          />
        )}

        {page === 'auth' && (
          <AuthPage onSuccess={(user) => {
            setMockUser(user);
            setPage('upload');
          }} />
        )}

        {page === 'upload' && activeUser && (
          <UploadPage 
            onAnalysisComplete={handleAnalysisComplete} 
            credits={credits}
            isPro={isPro}
            onUpgradeClick={() => setUpgradeModalOpen(true)}
          />
        )}
        
        {page === 'interview' && activeUser && (
          <InterviewPage
            profile={profile}
            history={history}
            setHistory={setHistory}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
            questionNumber={questionNumber}
            setQuestionNumber={setQuestionNumber}
            onInterviewEnd={handleInterviewEnd}
          />
        )}
        
        {page === 'report' && activeUser && (
          <ReportPage
            profile={profile}
            report={report}
            onReset={handleReset}
          />
        )}

        {page === 'history' && activeUser && (
          <HistoryPage 
            onSelectSession={(session) => {
              setProfile(session.profile);
              setReport(session.report);
              setHistory(session.history || []);
              setPage('report');
            }}
            onStartNew={() => setPage('upload')}
          />
        )}
      </main>

      {/* Pricing Upgrade Modal Sheet */}
      {upgradeModalOpen && (
        <UpgradeModal
          user={activeUser}
          onClose={() => setUpgradeModalOpen(false)}
          onUpgradeSuccess={handleUpgradeSuccess}
        />
      )}

      {/* SaaS Footer */}
      <footer className="border-t border-darkBorder bg-card/20 py-4 text-center mt-auto">
        <p className="text-xs text-gray-500 font-medium">
          InterviewIQ SaaS • {config.isGeminiConfigured ? "Live AI Mode" : "Sandbox Demo Mode"}
        </p>
      </footer>

      {/* Report Generation Loading Overlay */}
      {isGeneratingReport && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-accent" size={48} />
          <h3 className="text-xl font-bold text-white">Compiling Performance Report</h3>
          <p className="text-sm text-gray-400">AI is evaluating your interview answers. Please wait a moment.</p>
        </div>
      )}
    </div>
  );
}

// Wrapper to isolate hooks when Clerk publishes are active
function ClerkAppWrapper() {
  const { user, isSignedIn, isLoaded } = useUser();
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-accent">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }
  return <AppInner clerkUser={user} isSignedIn={isSignedIn} isClerk={true} />;
}

export default function App() {
  if (isClerkEnabled) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <ClerkAppWrapper />
      </ClerkProvider>
    );
  } else {
    return <AppInner isClerk={false} />;
  }
}
