import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Mail, Lock, User, Sparkles, Loader2 } from 'lucide-react';

export default function AuthPage({ onSuccess }) {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
  const isClerkEnabled = clerkKey.trim() !== '';

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMockAuth = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Please provide your name.');
      return;
    }

    setLoading(true);
    
    // Simulate server-side network authentication delay
    setTimeout(() => {
      setLoading(false);
      const mockUser = {
        email: email.trim(),
        name: isSignUp ? name.trim() : email.split('@')[0],
      };
      
      // Save simulated session
      localStorage.setItem('interviewiq_mock_session', JSON.stringify(mockUser));
      onSuccess(mockUser);
    }, 1200);
  };

  if (isClerkEnabled) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12 page-transition">
        <div className="rounded-2xl border border-darkBorder bg-card/65 p-1 shadow-2xl">
          {isSignUp ? (
            <SignUp 
              signInUrl="#" 
              forceRedirectUrl="/"
              routing="hash"
            />
          ) : (
            <SignIn 
              signUpUrl="#" 
              forceRedirectUrl="/"
              routing="hash"
            />
          )}
          
          <div className="text-center py-4 border-t border-darkBorder/40 bg-black/10 rounded-b-2xl">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-accent hover:underline font-semibold"
            >
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MOCK AUTH SANDBOX
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 page-transition max-w-md w-full mx-auto">
      <div className="w-full rounded-2xl glass-panel border border-darkBorder p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-accent/10 rounded-full blur-2xl"></div>

        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent mb-3 text-[10px] font-bold tracking-wider uppercase">
            <Sparkles size={10} />
            <span>Auth Sandbox</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isSignUp ? 'Create your Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {isSignUp ? 'Get started with 3 free interview credits.' : 'Log in to continue your preparation.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleMockAuth} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Full Name</label>
              <div className="relative flex items-center">
                <User size={15} className="absolute left-3 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-card/45 border border-darkBorder focus:border-accent focus:ring-1 focus:ring-accent rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-all placeholder-gray-600"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-card/45 border border-darkBorder focus:border-accent focus:ring-1 focus:ring-accent rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-all placeholder-gray-600"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Password</label>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-card/45 border border-darkBorder focus:border-accent focus:ring-1 focus:ring-accent rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-all placeholder-gray-600"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 font-semibold mt-1 bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg flex items-center gap-1.5">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-accent hover:bg-accentHover disabled:bg-accent/50 text-white font-bold text-sm rounded-xl shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Sign Up' : 'Log In'}</span>
            )}
          </button>
        </form>

        {/* Footer toggle */}
        <div className="text-center pt-4 border-t border-darkBorder/40">
          <button
            onClick={() => {
              setError('');
              setIsSignUp(!isSignUp);
            }}
            className="text-xs text-accent hover:underline font-semibold"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
