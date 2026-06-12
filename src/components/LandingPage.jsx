import React from 'react';
import { Sparkles, FileText, MessageSquare, Award, Check, ChevronRight } from 'lucide-react';

export default function LandingPage({ user, onStart }) {
  const features = [
    {
      icon: <FileText className="text-accent" size={22} />,
      title: "Skill-Based Questions",
      description: "Extracts matched and missing capabilities from your resume and matches them directly against job descriptions."
    },
    {
      icon: <Award className="text-accent" size={22} />,
      title: "Experience-Adaptive",
      description: "Adapts prompt depth dynamically from Freshers (concept-based) to Senior candidates (system architecture and trade-offs)."
    },
    {
      icon: <MessageSquare className="text-accent" size={22} />,
      title: "Instant Performance Reports",
      description: "Grades every single answer in real-time, giving you score metrics, strengths, improvement areas, and a downloadable PDF."
    }
  ];

  const plans = [
    {
      name: "Free Trial",
      price: "₹0",
      period: "forever",
      description: "Test drive the platform and receive a basic interview breakdown.",
      credits: "3 Mock Interviews",
      features: [
        "Interactive Chat Interview",
        "PDF Resume Analysis",
        "Performance score & strengths",
        "Downloadable A4 PDF Report"
      ],
      cta: "Try Free",
      popular: false
    },
    {
      name: "Starter Plan",
      price: "₹299",
      period: "month",
      description: "Excellent for active job seekers targeting multiple roles.",
      credits: "10 Mock Interviews",
      features: [
        "10 Interview Credits",
        "Adaptive Senior/Mid difficulty",
        "Targeted missing-skills mapping",
        "Real-time answer grading feedback",
        "Email support"
      ],
      cta: "Upgrade to Starter",
      popular: true
    },
    {
      name: "Pro Professional",
      price: "₹799",
      period: "month",
      description: "For professionals who want comprehensive preparation without bounds.",
      credits: "Unlimited Interviews",
      features: [
        "Unlimited mock interviews",
        "Unlimited resume parses",
        "Advanced architecture scenarios",
        "STAR behavioral feedback",
        "Priority support & features"
      ],
      cta: "Go Pro Unlimited",
      popular: false
    }
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 page-transition flex flex-col gap-16 md:gap-24">
      {/* HERO SECTION */}
      <section className="text-center pt-8 md:pt-16 max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent mb-6 text-sm font-medium animate-pulse">
          <Sparkles size={14} />
          <span>Ace Your Next Interview with AI</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
          Supercharge Your Prep. <br />
          <span className="text-accent bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-400">InterviewIQ</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
          Upload your resume and the job description. Our AI interviewer asks tailored, adaptive questions based on your experience, scores your replies, and compiles an audit report.
        </p>

        <button
          onClick={onStart}
          className="px-8 py-4 bg-accent hover:bg-accentHover text-white text-lg font-bold rounded-xl shadow-lg shadow-accent/20 flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
        >
          <span>{user ? "Go to Dashboard" : "Try Free →"}</span>
          <ChevronRight size={20} />
        </button>

        {/* Mock dashboard screenshot mockup */}
        <div className="w-full mt-14 rounded-2xl border border-darkBorder bg-card/10 p-2.5 shadow-2xl relative group overflow-hidden max-w-3xl">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-darkBorder bg-card/40 rounded-t-xl text-left">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
            <span className="text-[10px] text-gray-500 font-mono ml-4">https://interviewiq.saas</span>
          </div>
          <div className="aspect-[1.8/1] bg-card/65 flex flex-col p-6 text-left rounded-b-xl border border-t-0 border-darkBorder">
            <div className="w-24 h-4.5 bg-accent/20 rounded mb-4 animate-pulse"></div>
            <div className="w-full h-8 bg-gray-800/60 rounded mb-3"></div>
            <div className="w-3/4 h-5 bg-gray-800/40 rounded mb-8"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-card/80 border border-darkBorder/40 rounded-xl p-4">
                <div className="w-16 h-3 bg-gray-700 rounded mb-2"></div>
                <div className="w-full h-4 bg-accent/10 rounded"></div>
              </div>
              <div className="h-24 bg-card/80 border border-darkBorder/40 rounded-xl p-4">
                <div className="w-12 h-3 bg-gray-700 rounded mb-2"></div>
                <div className="w-10 h-6 bg-emerald-500/15 text-emerald-400 rounded flex items-center justify-center font-bold">85%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-darkBorder/50 pt-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-12">How it Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-lg font-bold mb-4 shadow-inner shadow-accent/5">
              1
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Upload Profile</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">Upload your resume PDF and paste the job description text.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-lg font-bold mb-4 shadow-inner shadow-accent/5">
              2
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Simulate Interview</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">Answer 10 adaptive questions generated by Gemini tailored to the role level.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-lg font-bold mb-4 shadow-inner shadow-accent/5">
              3
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Get Audit Report</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">View score breakdowns, detailed strength indicators, and download a PDF review.</p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-darkBorder/50 pt-16">
        {features.map((feat, i) => (
          <div key={i} className="rounded-2xl glass-panel border border-darkBorder p-6 hover:border-accent/30 transition-colors flex gap-4 items-start">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent flex-shrink-0">
              {feat.icon}
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2 text-base">{feat.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feat.description}</p>
            </div>
          </div>
        ))}
      </section>

      {/* PRICING SECTION */}
      <section className="border-t border-darkBorder/50 pt-16 pb-8 flex flex-col items-center">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white mb-3">Transparent SaaS Pricing</h2>
          <p className="text-gray-400 text-sm max-w-md">No hidden fees. Pick a credit tier that matches your current preparation scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch w-full max-w-5xl">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl glass-panel border flex flex-col p-6 justify-between transition-all hover:scale-[1.01] ${
                plan.popular
                  ? 'border-accent shadow-xl shadow-accent/5 relative bg-gradient-to-b from-accent/5 to-transparent'
                  : 'border-darkBorder bg-card/25'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent text-white font-extrabold text-[10px] tracking-widest uppercase shadow-md">
                  Most Popular
                </span>
              )}
              
              <div>
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-5 min-h-[32px]">{plan.description}</p>
                
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-gray-500 font-medium">/ {plan.period}</span>
                </div>
                
                <div className="inline-block px-2.5 py-0.5 rounded bg-accent/20 text-accent font-semibold text-[11px] mb-6">
                  {plan.credits}
                </div>

                <ul className="space-y-3 border-t border-darkBorder pt-6 mb-8">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-gray-300 leading-relaxed items-center">
                      <Check size={14} className="text-accent flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onStart}
                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                  plan.popular
                    ? 'bg-accent hover:bg-accentHover text-white'
                    : 'border border-darkBorder hover:border-gray-500 bg-card/45 text-gray-300'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
