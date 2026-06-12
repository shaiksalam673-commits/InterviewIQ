import React, { useState } from 'react';
import { X, Check, CreditCard, Sparkles, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

export default function UpgradeModal({ user, onClose, onUpgradeSuccess }) {
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  const isRazorpayEnabled = razorpayKey.trim() !== '';

  const [loadingPlan, setLoadingPlan] = useState(null); // 'starter' | 'pro'
  const [successDetails, setSuccessDetails] = useState(null); // invoice details if success
  const [mockPaymentOpen, setMockPaymentOpen] = useState(false);
  const [activePlanForMock, setActivePlanForMock] = useState(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '₹299',
      priceRaw: 299,
      credits: 10,
      isPro: false,
      description: 'Add 10 mock interview credits. Ideal for preparing for 1-2 upcoming positions.',
      features: [
        '10 Interview Credits',
        'Adaptive Technical Questions',
        'Comprehensive Skill Mapping',
        'Detailed PDF Score Reports'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Unlimited',
      price: '₹799',
      priceRaw: 799,
      credits: 9999, // unlimited representation
      isPro: true,
      description: 'Unlock unlimited mock interviews and resume parsing. Perfect for deep career preparation.',
      features: [
        'Unlimited Mock Interviews',
        'Unlimited Resume Parsing',
        'System Architecture Case Prompts',
        'STAR Behavioral Grading',
        'Priority Customer Support'
      ]
    }
  ];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (plan) => {
    setLoadingPlan(plan.id);

    if (!isRazorpayEnabled) {
      // Trigger Mock Razorpay Checkout Sandbox
      setTimeout(() => {
        setLoadingPlan(null);
        setActivePlanForMock(plan);
        setMockPaymentOpen(true);
      }, 1000);
      return;
    }

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you offline?');
      }

      const options = {
        key: razorpayKey,
        amount: plan.priceRaw * 100, // amount in paise
        currency: 'INR',
        name: 'InterviewIQ SaaS',
        description: `Upgrade to ${plan.name}`,
        image: 'https://cdn.pixabay.com/photo/2017/01/31/23/42/animal-2028258_1280.png', // placeholder
        handler: function (response) {
          // Trigger success updates
          handlePaymentSuccess(plan, response.razorpay_payment_id || 'pay_live_default_id');
        },
        prefill: {
          name: user?.name || 'Candidate',
          email: user?.email || 'user@example.com'
        },
        theme: {
          color: '#4F8EF7' // Accent Blue
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        alert(`Payment failed: ${resp.error.description}`);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Razorpay checkout error');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePaymentSuccess = (plan, paymentId) => {
    // Generate Invoice Breakdown details
    const invoice = {
      planName: plan.name,
      amount: plan.price,
      paymentId,
      creditsAdded: plan.isPro ? 'Unlimited (Pro Status)' : '10 Credits',
      date: new Date().toLocaleDateString()
    };
    
    // Save locally
    onUpgradeSuccess(plan.credits, plan.isPro);
    setSuccessDetails(invoice);
  };

  const handleApproveMockPayment = () => {
    setMockPaymentOpen(false);
    const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
    handlePaymentSuccess(activePlanForMock, mockPaymentId);
  };

  // SUCCESS SCREEN OVERLAY
  if (successDetails) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative text-center flex flex-col gap-5 page-transition">
          
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white">Upgrade Successful!</h3>
            <p className="text-gray-400 text-xs mt-1">Thank you for subscribing to InterviewIQ SaaS.</p>
          </div>

          {/* Receipt Info */}
          <div className="bg-black/25 border border-darkBorder rounded-xl p-4 text-left space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice Plan:</span>
              <span className="text-white font-bold">{successDetails.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="text-accent font-bold">{successDetails.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Credits Loaded:</span>
              <span className="text-emerald-400 font-bold">{successDetails.creditsAdded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment ID:</span>
              <span className="text-gray-300 truncate max-w-[150px]">{successDetails.paymentId}</span>
            </div>
            <div className="flex justify-between border-t border-darkBorder/40 pt-2.5 mt-2.5">
              <span className="text-gray-500">Billing Date:</span>
              <span className="text-gray-400">{successDetails.date}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // MOCK RAZORPAY SANDBOX WINDOW
  if (mockPaymentOpen && activePlanForMock) {
    return (
      <div className="fixed inset-0 bg-background/90 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-accent rounded-2xl p-6 shadow-2xl flex flex-col gap-6 relative">
          
          <div className="flex items-center gap-2 pb-4 border-b border-darkBorder">
            <div className="p-2 rounded-lg bg-accent/15 text-accent">
              <CreditCard size={18} />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-sm">Razorpay Payment Gateway</h4>
              <p className="text-[10px] text-gray-500 font-mono">mode: TEST_SANDBOX</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              InterviewIQ is running in local sandbox mode. Proposing payment authorization request:
            </p>
            <div className="bg-black/30 p-3 rounded-lg flex justify-between items-center text-xs">
              <span className="text-gray-400">Total Charged:</span>
              <span className="text-white font-bold font-mono">{activePlanForMock.price}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setMockPaymentOpen(false)}
              className="flex-1 py-2 rounded-xl border border-darkBorder hover:border-gray-500 text-gray-400 text-xs font-semibold hover:text-white transition-all cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={handleApproveMockPayment}
              className="flex-1 py-2 rounded-xl bg-accent hover:bg-accentHover text-white text-xs font-bold transition-all shadow-md shadow-accent/10 cursor-pointer"
            >
              Approve Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD UPGRADE MODAL GRID
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-card border border-darkBorder rounded-2xl p-6 shadow-2xl relative flex flex-col gap-6 page-transition my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-darkBorder bg-black/25 text-gray-400 hover:text-white transition-all hover:bg-black/50"
        >
          <X size={15} />
        </button>

        {/* Title */}
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent mb-3 text-xs font-medium">
            <Sparkles size={12} />
            <span>Increase Your Interview Limits</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Upgrade Your Credit Plan</h2>
          <p className="text-gray-400 text-xs mt-1">Get more mock sessions to test your alignment for multiple positions.</p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all bg-black/15 ${
                plan.id === 'starter'
                  ? 'border-darkBorder hover:border-accent/40'
                  : 'border-accent bg-gradient-to-b from-accent/5 to-transparent'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-bold text-base">{plan.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${plan.id === 'pro' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {plan.id === 'pro' ? 'Recommended' : 'Popular'}
                  </span>
                </div>
                
                <p className="text-gray-400 text-xs leading-relaxed mb-4 min-h-[36px]">{plan.description}</p>
                
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-[10px] text-gray-500 font-medium">/ month</span>
                </div>

                <ul className="space-y-2.5 border-t border-darkBorder/60 pt-4 mb-6">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex gap-2 text-[11px] text-gray-300 items-center">
                      <Check size={12} className="text-accent flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loadingPlan !== null}
                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.id === 'pro'
                    ? 'bg-accent hover:bg-accentHover text-white'
                    : 'border border-darkBorder hover:border-gray-500 bg-card/45 text-gray-300'
                }`}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Loading Checkout...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={13} />
                    <span>{plan.id === 'pro' ? 'Unlock Unlimited' : 'Purchase Credits'}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Notice Info */}
        {!isRazorpayEnabled && (
          <div className="bg-yellow-950/20 border border-yellow-500/20 text-yellow-300 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Demo Gateway Notice:</strong> Razorpay settings are currently running in **Mock Sandbox Mode** because `VITE_RAZORPAY_KEY_ID` is not defined in `.env`. Feel free to click purchase to verify the simulated invoice updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
