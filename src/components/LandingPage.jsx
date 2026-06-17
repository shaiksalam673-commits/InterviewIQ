import React from 'react';
import { Sparkles, FileText, MessageSquare, Award, Check, ChevronRight, PlayCircle, Zap, Shield } from 'lucide-react';

export default function LandingPage({ user, onStart }) {
  const features = [
    {
      icon: <FileText size={20} />,
      title: "Skill-Based Questions",
      description: "Extracts matched and missing capabilities from your resume and matches them directly against job descriptions."
    },
    {
      icon: <Award size={20} />,
      title: "Experience-Adaptive AI",
      description: "Adapts prompt depth dynamically from Freshers (concept-based) to Senior candidates (system architecture and trade-offs)."
    },
    {
      icon: <MessageSquare size={20} />,
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
    <div className="flex-1 w-full page-transition flex flex-col">

      {/* ── HERO SECTION ─────────────────────────────── */}
      <section
        className="relative w-full flex flex-col items-center text-center pt-20 pb-24 px-4 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, #0F1A35 0%, #080B14 60%)' }}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

        {/* Glow blobs */}
        <div
          className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(79,142,247,0.06)', filter: 'blur(80px)', transform: 'translate(-30%, -30%)' }}
        />
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(123,95,247,0.06)', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }}
        />

        {/* Badge */}
        <div
          className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 tracking-wider"
          style={{ background: '#0F1A35', border: '1px solid #1E2840', color: '#4F8EF7' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          AI MOCK INTERVIEW
        </div>

        {/* Headline */}
        <h1
          className="relative z-10 font-black leading-[1.08] mb-6 tracking-tight"
          style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: '#fff', maxWidth: '700px' }}
        >
          Prepare. Practice.{' '}
          <br />
          <span className="gradient-text">Get Hired.</span>
        </h1>

        {/* Subtext */}
        <p
          className="relative z-10 text-base md:text-lg max-w-md mb-10 leading-relaxed"
          style={{ color: '#6B7A9F' }}
        >
          Upload your resume and the job description. Our AI interviewer asks tailored, adaptive questions and compiles a full audit report.
        </p>

        {/* CTA */}
        <button
          onClick={onStart}
          className="relative z-10 btn-gradient flex items-center gap-2.5 px-8 py-4 rounded-[14px] text-base font-bold shadow-xl glow-accent"
        >
          <PlayCircle size={20} />
          {user ? 'Go to Dashboard' : 'Try Free — No Card Needed'}
        </button>

        {/* Mock browser preview */}
        <div
          className="relative z-10 w-full max-w-3xl mt-16 rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid #1E2840' }}
        >
          {/* Browser bar */}
          <div
            className="flex items-center gap-1.5 px-4 py-2.5 border-b"
            style={{ background: '#0D1120', borderColor: '#1E2840' }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(251,191,36,0.5)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(74,222,128,0.5)' }} />
            <span className="text-[10px] font-mono ml-4" style={{ color: '#4B5A80' }}>https://interviewiq.saas/interview</span>
          </div>
          {/* Preview body */}
          <div
            className="aspect-[2/1] p-6 text-left flex flex-col gap-4"
            style={{ background: '#0D1120' }}
          >
            <div className="flex gap-3">
              <div className="w-24 h-4 rounded animate-pulse" style={{ background: '#1E2840' }} />
              <div className="w-16 h-4 rounded" style={{ background: 'rgba(79,142,247,0.2)' }} />
            </div>
            <div className="w-full h-10 rounded-xl" style={{ background: '#080B14', border: '1px solid #1E2840' }} />
            <div className="grid grid-cols-2 gap-3">
              {[85, 72].map((v, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: '#080B14', border: '1px solid #1E2840' }}>
                  <div className="w-12 h-2 rounded mb-3" style={{ background: '#1E2840' }} />
                  <div
                    className="w-12 h-7 rounded flex items-center justify-center text-xs font-bold font-mono"
                    style={{ background: 'rgba(79,142,247,0.1)', color: '#4F8EF7' }}
                  >
                    {v}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-14">How it Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { n: '1', title: 'Upload Profile',     desc: 'Upload your resume PDF and paste the job description text.' },
            { n: '2', title: 'Simulate Interview', desc: 'Answer 10 adaptive questions generated by AI tailored to the role level.' },
            { n: '3', title: 'Get Audit Report',   desc: 'View score breakdowns, strength indicators, and download a PDF review.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-accent text-lg font-bold mb-5"
                style={{ background: '#0F1A35', border: '1px solid #1E2840' }}
              >
                {n}
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#6B7A9F' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section
        className="w-full py-16 border-t"
        style={{ borderColor: 'rgba(30,40,64,0.5)' }}
      >
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 flex gap-4 items-start transition-all duration-200 cursor-default"
              style={{
                background: '#0D1120',
                border: '1px solid #1E2840',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2A3A6A'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1E2840'}
            >
              <div
                className="p-2.5 rounded-xl flex-shrink-0"
                style={{ background: '#0F1A35', border: '1px solid #1E2840', color: '#4F8EF7' }}
              >
                {feat.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1.5 text-sm">{feat.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7A9F' }}>{feat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────── */}
      <section
        className="w-full py-20 border-t"
        style={{ borderColor: 'rgba(30,40,64,0.5)' }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white mb-3">Transparent Pricing</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#6B7A9F' }}>
              No hidden fees. Pick a credit tier that matches your current preparation scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, i) => (
              <div
                key={i}
                className="rounded-2xl flex flex-col p-6 justify-between relative transition-all duration-200"
                style={plan.popular ? {
                  border: '2px solid #4F8EF7',
                  background: 'linear-gradient(180deg, #0F1A35 0%, #0D1120 100%)',
                } : {
                  border: '1px solid #1E2840',
                  background: '#0D1120',
                }}
              >
                {plan.popular && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase text-white shadow-md"
                    style={{ background: '#4F8EF7' }}
                  >
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-white font-bold text-base mb-1">{plan.name}</h3>
                  <p className="text-xs leading-relaxed mb-5 min-h-[32px]" style={{ color: '#6B7A9F' }}>{plan.description}</p>

                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-xs font-medium" style={{ color: '#4B5A80' }}>/ {plan.period}</span>
                  </div>

                  <div
                    className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold mb-6"
                    style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}
                  >
                    {plan.credits}
                  </div>

                  <ul className="space-y-2.5 border-t pt-6 mb-8" style={{ borderColor: '#1E2840' }}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex gap-2 text-xs leading-relaxed items-center" style={{ color: '#8A9BC0' }}>
                        <Check size={13} className="flex-shrink-0" style={{ color: '#4F8EF7' }} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={onStart}
                  className="w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
                  style={plan.popular ? {
                    background: 'linear-gradient(135deg, #4F8EF7, #7B5FF7)',
                    color: '#fff',
                  } : {
                    border: '1px solid #1E2840',
                    background: 'transparent',
                    color: '#8A9BC0',
                  }}
                  onMouseEnter={e => { if (!plan.popular) { e.currentTarget.style.borderColor = '#2A3A6A'; e.currentTarget.style.color = '#fff'; } }}
                  onMouseLeave={e => { if (!plan.popular) { e.currentTarget.style.borderColor = '#1E2840'; e.currentTarget.style.color = '#8A9BC0'; } }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
