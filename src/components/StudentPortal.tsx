import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LeadStatus } from "../types";
import { apiFetch } from "../lib/apiClient";

import pwHeroBanner from "../assets/images/20260717_175036_0000.png";
import pwFooterBanner from "../assets/images/20260717_175237_0000.png";
import { 
  ShieldCheck, 
  HelpCircle, 
  BookOpen, 
  ArrowRight, 
  CheckCircle, 
  PhoneCall, 
  Sparkles, 
  Loader2, 
  Users, 
  Lock, 
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Send,
  UserCheck,
  Menu,
  X,
  ChevronDown,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Clock,
  Heart,
  TrendingUp,
  Award,
  ArrowUpRight
} from "lucide-react";

interface StudentPortalProps {
  onGoToAdmin: () => void;
}

export default function StudentPortal({ onGoToAdmin }: StudentPortalProps) {
  // Navigation active state
  const [activeTab, setActiveTab] = useState("HOME");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Floating AI Advisor State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiStep, setAiStep] = useState(1);
  const [aiExam, setAiExam] = useState("");
  const [aiClass, setAiClass] = useState("");
  const [aiYear, setAiYear] = useState("2027");
  const [aiLanguage, setAiLanguage] = useState("");
  const [aiMode, setAiMode] = useState("");
  const [aiBudget, setAiBudget] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState("");

  // Floating Social Share Widget State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Form Request State
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    exam: "",
    course: "",
    language: "Hindi/English",
    targetYear: "2027",
    purchaseTimeline: "Immediate",
    existingPwUser: false,
    consent: false,
    remarks: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccessData, setFormSuccessData] = useState<any>(null);
  const [formError, setFormError] = useState("");

  // Track Request State
  const [trackingId, setTrackingId] = useState("");
  const [trackingPhone, setTrackingPhone] = useState("");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Dynamic injection of SEO FAQ Schema
  useEffect(() => {
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is this portal affiliated with Physics Wallah?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, this portal is operated by an Authorized Physics Wallah (PW) Campus Ambassador. We help coordinate campaign benefits and map official personalized coupons to student mobile numbers."
          }
        },
        {
          "@type": "Question",
          "name": "Why is OTP verification required?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For existing registered app accounts, campaign discount coupon mapping requires secure profile link verification. This is completed via official PW system links. Your account password is never collected."
          }
        },
        {
          "@type": "Question",
          "name": "What is the turn-around response timeline?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most verification checks, coupon allocations, and code deliveries are successfully processed within 10 to 45 minutes of submitting your secure request."
          }
        },
        {
          "@type": "Question",
          "name": "How do I claim and apply the generated coupon?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Once mapped, the custom code becomes visible in your tracking section and is sent via Email. Simply paste this code in the official checkout page on the PW App or website to receive your direct discount."
          }
        },
        {
          "@type": "Question",
          "name": "Is my personal student data secure?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, completely. Student details are stored in an encrypted database linked to private authorized Google Sheets. We never share, distribute, or broadcast your academic profiles."
          }
        }
      ]
    };

    const script = document.createElement("script");
    script.id = "faq-jsonld-schema";
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify(faqData);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById("faq-jsonld-schema");
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Validation & Form Submission Handlers
  const handleNextStep = () => {
    if (formStep === 1) {
      if (!formData.name.trim() || !/^[a-zA-Z\s]+$/.test(formData.name)) {
        setFormError("Please enter a valid alphabet-only student name.");
        return;
      }
      if (!/^\d{10}$/.test(formData.phone)) {
        setFormError("Please enter a valid 10-digit registered mobile number.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setFormError("Please enter a valid active email address.");
        return;
      }
    }
    if (formStep === 2) {
      if (!formData.exam || !formData.course.trim()) {
        setFormError("Please complete your Target Exam and Batch selection.");
        return;
      }
    }
    setFormError("");
    setFormStep(prev => prev + 1);
  };

  const handleFormSubmit = async () => {
    if (!formData.consent) {
      setFormError("You must authorize coupon mapping consent to submit.");
      return;
    }

    setFormError("");
    setFormLoading(true);

    try {
      const res = await apiFetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || data.message || "Submission failed.";
        throw new Error(errMsg);
      }

      setFormSuccessData(data);
      setFormStep(5); // Success step
    } catch (err: any) {
      setFormError(err.message || "Failed to communicate with authorization server.");
    } finally {
      setFormLoading(false);
    }
  };

  // Chatbot Gemini recommendation engine
  const handleGetAIRecommendation = async () => {
    setAiLoading(true);
    try {
      const res = await apiFetch("/api/gemini/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: aiExam,
          currentClass: aiClass,
          targetYear: aiYear,
          language: aiLanguage,
          mode: aiMode,
          budget: aiBudget
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error("Unable to retrieve model data.");
      }
      setAiRecommendation(data);
    } catch (e) {
      // Elegant structured fallback mapping based on parameters
      setAiRecommendation({
        recommendedBatch: `${aiExam} ${aiYear} Intensive`,
        reasoning: `We strongly recommend enrolling in the premier Physics Wallah ${aiExam} program for target year ${aiYear}. Designed for ${aiClass || "aspirants"}, this cohort delivers curated question sets, daily study sheets, and direct ambassador coordinator support to optimize your learning curve.`,
        discountTidbit: "This elite batch is highly eligible for manual campus ambassador coupon mapping (up to ₹5,000 savings)."
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI Recommendation directly to multi-step request form
  const applyRecommendationToForm = () => {
    setFormData(prev => ({
      ...prev,
      exam: aiExam === "IIT JEE (Main & Adv)" ? "JEE" : aiExam === "NEET Medical" ? "NEET" : "Class 9-10 Foundation",
      course: aiRecommendation?.recommendedBatch || ""
    }));
    setIsAiOpen(false);
    setFormStep(1); // Set request form back to start
    setAiFeedbackMessage("🎯 AI Selected course applied below! Review your contact details.");
    setTimeout(() => {
      document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    setTimeout(() => {
      setAiFeedbackMessage("");
    }, 6000);
  };

  // Track submission progress
  const handleTrackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim() || !trackingPhone.trim()) {
      setTrackingError("Request ID and mobile number are required.");
      return;
    }
    setTrackingLoading(true);
    setTrackingError("");
    setTrackingData(null);

    try {
      const res = await apiFetch("/api/leads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: trackingId.trim(),
          identifier: trackingPhone.trim()
        })
      });
      const data = await res.json();

      if (!res.ok) {
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || "No matching records. Double-check details.";
        throw new Error(errMsg);
      }

      setTrackingData(data);
    } catch (err: any) {
      setTrackingError(err.message || "Verification tracking error.");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Clipboard share handler
  const copyShareLink = () => {
    const shareText = "Hey! Get up to ₹5000 off on Physics Wallah (PW) batches via official Ambassador coupons! Submit your request and get instant mapping here: https://pw-coupon-wallah.vercel.app/";
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent("Hey! Get up to ₹5000 off on Physics Wallah (PW) batches via official Ambassador coupons! Check eligibility and request code: https://pw-coupon-wallah.vercel.app/");
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent("Get up to ₹5000 off on Physics Wallah batches via official Ambassador coupons!");
    const url = encodeURIComponent("https://pw-coupon-wallah.vercel.app/");
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-red-600 selection:text-white">
      
      {/* 1. TOP ANNOUNCEMENT TICKER BANNER */}
      <div id="announcement" className="bg-red-600 text-white text-[11px] font-extrabold py-2.5 px-4 text-center tracking-wider uppercase shadow-md flex items-center justify-center space-x-2">
        <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
        <span>Official Campus Ambassador Assistance Portal — Guaranteed Direct Coupon Mapping & verified discounts</span>
      </div>

      {/* 2. STICKY HEADER WITH GLASS EFFECT */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="bg-red-600 text-white w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-red-600/30">PW</div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-black text-white tracking-tight text-lg leading-none">Coupon Wallah</h1>
                <span className="text-[9px] bg-red-600/20 text-red-500 font-bold px-2 py-0.5 rounded-full border border-red-600/30">v2.0</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">Official Ambassador CRM</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { id: "home", label: "HOME" },
              { id: "benefits", label: "BENEFITS" },
              { id: "workflow", label: "HOW IT WORKS" },
              { id: "request", label: "REQUEST FORM" },
              { id: "track", label: "TRACK PROGRESS" },
              { id: "faq", label: "FAQ SUPPORT" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.label);
                  const el = document.getElementById(tab.id);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 ${
                  activeTab === tab.label 
                    ? "bg-red-600/15 text-red-500 border border-red-600/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setActiveTab("REQUEST FORM");
                document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-red-600/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              Request Coupon
            </button>
            <button
              onClick={onGoToAdmin}
              className="text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-black transition-all"
            >
              Ambassador CRM
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-950 border-t border-slate-900 py-4 px-6 space-y-2.5 shadow-2xl"
            >
              {[
                { id: "home", label: "HOME" },
                { id: "benefits", label: "BENEFITS" },
                { id: "workflow", label: "HOW IT WORKS" },
                { id: "request", label: "REQUEST FORM" },
                { id: "track", label: "TRACK PROGRESS" },
                { id: "faq", label: "FAQ SUPPORT" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.label);
                    setMobileMenuOpen(false);
                    const el = document.getElementById(tab.id);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.label 
                      ? "bg-red-600/10 text-red-500 border-l-4 border-red-600" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="pt-3 border-t border-slate-900">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full text-center bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-red-600/20"
                >
                  Request Coupon Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 3. PREMIUM HERO SECTION */}
      <section id="home" className="relative py-16 lg:py-24 overflow-hidden bg-slate-950">
        {/* Subtle glowing mesh lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#dc26260a,transparent_45%)] pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Text Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-red-600/10 text-red-500 px-4 py-2 rounded-full text-xs font-bold border border-red-600/20">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Official PW Campus Ambassador Network</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Unlock Direct Discounts <br className="hidden sm:inline" />
                On <span className="text-red-600 underline decoration-red-600/30 underline-offset-4">Physics Wallah</span> Batches
              </h2>
              
              <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Save up to <strong className="text-white">₹5,000</strong> on target cohorts immediately. We provide official coordinate assistance to generate personalized ambassador coupons mapped safely to your registered PW app account.
              </p>

              {/* Core Benefits Quick Deck */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg mx-auto lg:mx-0 text-left pt-2">
                {[
                  "No Account Passwords Ever Asked",
                  "Direct Addition into your App",
                  "Verified Ambassador Support Team",
                  "100% Secure Campaign Processing"
                ].map((text, i) => (
                  <div key={i} className="flex items-center space-x-2.5">
                    <div className="bg-red-600/20 text-red-500 p-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                <button
                  onClick={() => document.getElementById("request")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all hover:-translate-y-0.5"
                >
                  Request Mapped Coupon
                </button>
                <button
                  onClick={() => document.getElementById("track")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Track Request Status
                </button>
              </div>

              {/* Quick Trust Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-900 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">98%</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PORTAL SECURITY</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">15 Mins</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AVG DELIVERY TIME</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">100%</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">OFFICIAL SYSTEM</div>
                </div>
              </div>
            </div>

            {/* Poster Mockup Visual (Right Column) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden group">
                {/* Glowing decorative frame */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-transparent rounded-3xl opacity-15 blur group-hover:opacity-25 transition-opacity" />
                
                <div className="relative space-y-4">
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] bg-red-600/20 text-red-500 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      CAMPUS OFFER LIVE
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-red-500" />
                      <span>Updated 5m ago</span>
                    </span>
                  </div>

                  {/* Ambassador Graphic Card */}
                  <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                    <img 
                      src={pwHeroBanner} 
                      alt="Physics Wallah Ambassador Program Flyer" 
                      className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.01]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-xs text-slate-400 leading-normal">
                      Scan the poster or register your profile below to qualify for running seasonal ambassador campaigns. Mapped instantly to your mobile number.
                    </p>
                    <div className="flex justify-between items-center text-[10px] font-bold text-red-500">
                      <span>✓ JEE, NEET, Foundation Batches</span>
                      <span>✓ Up to ₹5000 Saved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. HIGH CONVERSION SOCIAL PROOF STRIP */}
      <section className="bg-slate-900 border-y border-slate-800 py-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-red-500 font-mono">12,400+</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Students Assisted</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-red-500 font-mono">₹48 Lakhs+</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Student Savings</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-red-500 font-mono">4.9 / 5.0</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Sat Satisfaction</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-red-500 font-mono">100% Free</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ambassador Help Service</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS SECTION ("Why Request via Ambassador?") */}
      <section id="benefits" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="inline-block text-xs font-extrabold text-red-500 uppercase tracking-widest bg-red-600/10 px-3 py-1.5 rounded-full">
              SECURE ADVANTAGES
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why Claim Coupons Via Authorized Ambassadors?
            </h3>
            <p className="text-slate-400 text-sm">
              Avoid buying batches at retail prices. The official ambassador portal enables custom campaign mapping designed exclusively to assist students.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Award className="w-6 h-6 text-red-500" />,
                title: "Maximum Discounts Checked",
                desc: "We scan the official coordinator dashboard and manually map the absolute highest eligible discount campaign active for your batch."
              },
              {
                icon: <Lock className="w-6 h-6 text-red-500" />,
                title: "Zero Account Password Risk",
                desc: "We strictly never collect your password or secret details. All coordination takes place via official PW security link prompts."
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-red-500" />,
                title: "Direct Account Linkage",
                desc: "The discount coupon is securely registered to your specific phone number. You apply it at the checkout page on your own app."
              },
              {
                icon: <MessageCircle className="w-6 h-6 text-red-500" />,
                title: "Real-Time Tracking Panel",
                desc: "Check progress live. Enter your assigned Request ID + phone to inspect reviewing, mapping status, and generated code delivery."
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-red-500" />,
                title: "1-on-1 WhatsApp Support",
                desc: "Need immediate help or OTP verification guidelines? Get personalized companion guidance with your designated Ambassador."
              },
              {
                icon: <Users className="w-6 h-6 text-red-500" />,
                title: "Academic Group Access",
                desc: "Join our active student communities on Telegram and WhatsApp for prompt assistance, updates, and syllabus study material."
              }
            ].map((b, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800/80 p-8 rounded-2xl hover:border-red-600/20 transition-all group">
                <div className="bg-slate-950 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-slate-800">
                  {b.icon}
                </div>
                <h4 className="text-base font-black text-white group-hover:text-red-500 transition-colors mb-3">{b.title}</h4>
                <p className="text-slate-400 text-xs sm:text-xs leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT WORKFLOW ("How It Works") */}
      <section id="workflow" className="py-20 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-block text-xs font-extrabold text-red-500 uppercase tracking-widest bg-red-600/10 px-3 py-1.5 rounded-full">
              4-STEP DIRECT FLOW
            </span>
            <h3 className="text-3xl font-black text-white tracking-tight">How We Map Coupons</h3>
            <p className="text-slate-400 text-sm">
              Our transparent registration process is simple, secure, and fast. Follow these simple checkpoints:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              {
                step: "01",
                title: "Find Your Best Batch",
                desc: "Query our conversational bottom-left AI Course Advisor or enter your target JEE/NEET/Foundation cohort."
              },
              {
                step: "02",
                title: "Submit Secure Form",
                desc: "Complete our multi-step secure form below. The system automatically registers a unique Request tracking ID."
              },
              {
                step: "03",
                title: "Secure Verification",
                desc: "If registered on PW, coordinate the verification link with your ambassador on WhatsApp for mapping authorization."
              },
              {
                step: "04",
                title: "Claim Code & Save",
                desc: "Retrieve your mapped custom coupon on the live tracker, apply it at check-out on the PW App, and claim direct savings!"
              }
            ].map((w, idx) => (
              <div key={idx} className="relative space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div className="text-red-500 font-mono font-black text-3xl tracking-tight">{w.step}</div>
                <h4 className="text-sm font-black text-white">{w.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HIGH CONVERTING MULTI-STEP REQUEST FUNNEL */}
      <section id="request" className="py-20 bg-slate-950 relative">
        <div className="absolute top-10 right-20 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          
          {/* Form Header */}
          <div className="text-center space-y-4 mb-10">
            <span className="inline-block text-xs font-extrabold text-red-500 uppercase tracking-widest bg-red-600/10 px-3 py-1.5 rounded-full">
              DIRECT PORTAL APPLICATION
            </span>
            <h3 className="text-3xl font-black text-white tracking-tight">Submit Coupon Request</h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              All submissions are recorded directly into our authorized Ambassador CRM database. Complete all steps carefully.
            </p>
            
            {/* Success Alert if AI recommendation was applied */}
            {aiFeedbackMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 p-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>{aiFeedbackMessage}</span>
              </motion.div>
            )}
          </div>

          {/* Secure Funnel Card Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Step Progress Header */}
            <div className="bg-slate-950 border-b border-slate-800 px-6 py-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SECURED SUBMISSION ENGINE</span>
                <p className="text-xs font-black text-white">
                  {formStep === 5 ? "REGISTRATION COMPLETE" : `PHASE ${formStep} OF 4`}
                </p>
              </div>
              <div className="flex space-x-1.5">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      formStep === stepNum 
                        ? "w-8 bg-red-600" 
                        : formStep > stepNum 
                          ? "w-3 bg-red-600/50" 
                          : "w-2 bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Main Form Fields */}
            <div className="p-6 sm:p-8">
              
              {formError && (
                <div className="bg-red-950/50 text-red-400 border border-red-900/50 p-4 rounded-xl text-xs font-bold mb-6 flex items-start space-x-2">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {formStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">Step 1: Student Demographics</h4>
                    <p className="text-slate-400 text-[11px]">Specify correct credentials to receive transactional updates and map coupons safely.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Full Student Name (Alphabet only)</label>
                    <input
                      type="text"
                      placeholder="e.g. Priyanshu Kumar"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:border-red-600 focus:bg-slate-950 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">PW App Registered Mobile (10-Digits for Mapping)</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:border-red-600 focus:bg-slate-950 outline-none transition-colors font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Active Email Address (To Receive Coupon HTML)</label>
                    <input
                      type="email"
                      placeholder="e.g. priyanshu.kumar@gmail.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:border-red-600 focus:bg-slate-950 outline-none transition-colors"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleNextStep}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Continue to Academic Goals</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">Step 2: Selection of Target Batch</h4>
                    <p className="text-slate-400 text-[11px]">Select your academic curriculum. If unsure, query the bottom-left AI Course Advisor first.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Target Exam Course</label>
                    <select
                      value={formData.exam}
                      onChange={e => setFormData({ ...formData, exam: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 text-slate-200 rounded-xl px-4 py-3.5 text-xs outline-none focus:border-red-600"
                    >
                      <option value="">Select Exam</option>
                      <option value="JEE">IIT JEE (Main & Advanced)</option>
                      <option value="NEET">NEET Medical / Biology</option>
                      <option value="Class 9-10 Foundation">Class 9th / 10th Board Foundation</option>
                      <option value="Boards / CUET">Class 12 Boards / CUET</option>
                      <option value="Others">Others / Competitive Exams</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Target PW Batch / Series Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Yakeen NEET 2027 Dropper"
                      value={formData.course}
                      onChange={e => setFormData({ ...formData, course: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:border-red-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Target Year</label>
                      <select
                        value={formData.targetYear}
                        onChange={e => setFormData({ ...formData, targetYear: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3.5 text-xs text-white outline-none"
                      >
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Preferred Language</label>
                      <select
                        value={formData.language}
                        onChange={e => setFormData({ ...formData, language: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3.5 text-xs text-white outline-none"
                      >
                        <option value="Hindi/English">Hinglish (Hindi+English)</option>
                        <option value="English">English Only</option>
                        <option value="Hindi">Hindi Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button 
                      onClick={() => setFormStep(1)} 
                      className="w-1/3 border border-slate-800 hover:bg-slate-950 text-xs font-bold rounded-xl py-3.5 text-slate-400"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="w-2/3 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Continue Preferences</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">Step 3: Verification Preferences</h4>
                    <p className="text-slate-400 text-[11px]">Help our team coordinate mapping links safely via official ambassador pathways.</p>
                  </div>

                  <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">PW Security Compliance Policy</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      For active app users, the Ambassador CRM executes dynamic campaign link generation. This triggers a secure official OTP coordinate process with our agent. We do not require app login passwords.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Have you registered on the PW App already?</label>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setFormData({ ...formData, existingPwUser: true })}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          formData.existingPwUser 
                            ? "bg-red-600/10 border-red-600 text-red-500 font-black" 
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        Yes (Needs mapping link)
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, existingPwUser: false })}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          !formData.existingPwUser 
                            ? "bg-red-600/10 border-red-600 text-red-500 font-black" 
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        No (New Student setup)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Expected Purchase Timeline</label>
                    <select
                      value={formData.purchaseTimeline}
                      onChange={e => setFormData({ ...formData, purchaseTimeline: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3.5 text-xs text-white outline-none"
                    >
                      <option value="Immediate">Immediate / Today</option>
                      <option value="Within 3 days">Within 3 days</option>
                      <option value="Within 1 week">Within 1 week</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Add Custom Notes or Remarks (Optional)</label>
                    <textarea
                      placeholder="e.g. Requesting coupon code help for batch discount eligibility..."
                      value={formData.remarks}
                      onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white h-20 outline-none resize-none focus:border-red-600 transition-colors"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button 
                      onClick={() => setFormStep(2)} 
                      className="w-1/3 border border-slate-800 hover:bg-slate-950 text-xs font-bold rounded-xl py-3.5 text-slate-400"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="w-2/3 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Review Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">Step 4: Summary Review & Authorization</h4>
                    <p className="text-slate-400 text-[11px]">Confirm accuracy before committing records to the secure CRM database.</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl text-xs space-y-3.5">
                    <div className="flex justify-between border-b border-slate-850 pb-2">
                      <span className="text-slate-400 font-bold">Student Name:</span>
                      <span className="font-extrabold text-white">{formData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-2">
                      <span className="text-slate-400 font-bold">Mobile Link:</span>
                      <span className="font-extrabold text-white font-mono">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-2">
                      <span className="text-slate-400 font-bold">Target Course:</span>
                      <span className="font-extrabold text-red-500">{formData.course} ({formData.exam})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-850 pb-2">
                      <span className="text-slate-400 font-bold">PW Account status:</span>
                      <span className="font-extrabold text-white">{formData.existingPwUser ? "Registered PW User" : "New Student Setup"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Purchase Timeline:</span>
                      <span className="font-extrabold text-slate-300">{formData.purchaseTimeline}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={formData.consent}
                      onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-1 accent-red-600 rounded bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="consent" className="text-[11px] text-slate-400 leading-relaxed cursor-pointer select-none">
                      <strong className="text-white">Mandatory student authorization:</strong> I certify that these details correspond directly to my registered PW application details. I authorize the designated campus ambassador to execute campaign checks and coordinates mapping.
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button 
                      onClick={() => setFormStep(3)} 
                      className="w-1/3 border border-slate-800 hover:bg-slate-950 text-xs font-bold rounded-xl py-3.5 text-slate-400"
                    >
                      Back
                    </button>
                    <button
                      disabled={formLoading || !formData.consent}
                      onClick={handleFormSubmit}
                      className="w-2/3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20"
                    >
                      {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Submit Secure Request</span>
                    </button>
                  </div>
                </div>
              )}

              {formStep === 5 && formSuccessData && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-800">
                    <CheckCircle className="w-10 h-10 animate-bounce" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-white">🎉 Request Submitted Securely!</h4>
                    <p className="text-slate-400 text-xs px-4">
                      Your discount registration has been committed to Google Sheets and our internal queue. Below is your official Request ID. Use this ID to track your status anytime.
                    </p>
                  </div>

                  <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-850 max-w-sm mx-auto shadow-inner">
                    <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5">Your Registered Request ID</div>
                    <div className="text-2xl font-mono font-black text-red-500 tracking-wider select-all">{formSuccessData.requestId}</div>
                  </div>

                  <p className="text-xs text-slate-400 px-2 leading-relaxed">
                    A status confirmation email is on its way to <strong className="text-white">{formData.email}</strong>.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <button
                      onClick={() => {
                        setTrackingId(formSuccessData.requestId);
                        setTrackingPhone(formData.phone);
                        setActiveTab("TRACK PROGRESS");
                        setTimeout(() => {
                          document.getElementById("track")?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="bg-slate-950 text-slate-100 hover:bg-slate-900 border border-slate-800 px-6 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-transform active:scale-95"
                    >
                      Track Live Status
                    </button>
                    <button
                      onClick={() => {
                        setFormStep(1);
                        setFormSuccessData(null);
                        setFormData({
                          name: "",
                          phone: "",
                          email: "",
                          exam: "",
                          course: "",
                          language: "Hindi/English",
                          targetYear: "2027",
                          purchaseTimeline: "Immediate",
                          existingPwUser: false,
                          consent: false,
                          remarks: ""
                        });
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all"
                    >
                      Request Another
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* 8. DUAL-INPUT SECURE TRACKING PORTAL */}
      <section id="track" className="py-20 bg-slate-900 border-y border-slate-850">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <span className="inline-block text-xs font-extrabold text-red-500 uppercase tracking-widest bg-red-600/10 px-3 py-1.5 rounded-full">
              SECURE DOUBLE-VERIFICATION
            </span>
            <h3 className="text-3xl font-black text-white tracking-tight">Track Your Request Live</h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Verify security. Input your Request ID and registered phone/email to fetch live milestone tracking, active campaign details, and generated code delivery.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            
            {/* Input fields */}
            <div className="md:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <form onSubmit={handleTrackRequest} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">Request ID</label>
                  <input
                    type="text"
                    placeholder="e.g. PW202607160001"
                    value={trackingId}
                    onChange={e => setTrackingId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-600 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">Registered Mobile / Email</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={trackingPhone}
                    onChange={e => setTrackingPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-600 font-mono"
                  />
                </div>

                {trackingError && (
                  <p className="text-xs font-semibold text-red-400 bg-red-950/20 p-2.5 rounded-lg border border-red-900/30">{trackingError}</p>
                )}

                <button
                  type="submit"
                  disabled={trackingLoading || !trackingId || !trackingPhone}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                >
                  {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Verify and Retrieve</span>
                </button>
              </form>
            </div>

            {/* Timeline & Results */}
            <div className="md:col-span-7">
              {!trackingData ? (
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500 bg-slate-950">
                  <Lock className="w-10 h-10 mx-auto mb-4 text-slate-700" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Awaiting Dual Verification</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Input secure coordinates to view live ambassador logs, timeline actions, and mapping coupons.</p>
                </div>
              ) : (
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-6">
                  
                  {/* Summary Card */}
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <h4 className="font-extrabold text-white text-base leading-none mb-1.5">{trackingData.lead.Name}</h4>
                      <p className="text-xs text-slate-400">{trackingData.lead.Course} ({trackingData.lead.Exam})</p>
                    </div>
                    <span className="text-[10px] bg-red-600/10 text-red-500 border border-red-600/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                      {trackingData.lead.LeadStatus}
                    </span>
                  </div>

                  {/* Vertical Progress Timeline */}
                  <div className="space-y-6">
                    {trackingData.timeline.map((stage: any, idx: number) => {
                      let iconColor = "text-slate-600 bg-slate-900";
                      let borderStyle = "border-slate-800";
                      
                      if (stage.status === "completed") {
                        iconColor = "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40";
                        borderStyle = "border-emerald-800/20";
                      } else if (stage.status === "warning") {
                        iconColor = "text-amber-400 bg-amber-950/40 border border-amber-800/40 animate-pulse";
                        borderStyle = "border-amber-800/20";
                      } else if (stage.status === "failed") {
                        iconColor = "text-red-400 bg-red-950/40 border border-red-850/40";
                        borderStyle = "border-red-950/20";
                      }

                      return (
                        <div key={idx} className="flex space-x-4 relative">
                          {idx < trackingData.timeline.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-900" />
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                            <CheckCircle className="w-4.5 h-4.5" />
                          </div>
                          <div className="space-y-1 pt-0.5">
                            <h5 className="text-xs font-black text-white">{stage.stage}</h5>
                            <p className="text-[11px] text-slate-400 leading-normal">{stage.remarks}</p>
                            {stage.time && (
                              <p className="text-[9px] text-slate-500 font-mono">
                                {new Date(stage.time).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* WAITING_STUDENT Action Card */}
                  {trackingData.lead.LeadStatus === LeadStatus.WAITING_STUDENT && (
                    <div className="bg-red-600/10 border border-red-600/20 p-5 rounded-2xl space-y-3">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h6 className="text-xs font-bold text-red-500">OTP Coordination Linkage Required</h6>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            To map campaign coupons securely, your registered account requires security linking. Click below to chat directly with your ambassador and authorize.
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/919711828344?text=Hello%20PW%20Ambassador,%20Request%20ID:%20${trackingData.lead.LeadID}.%20I%20need%20OTP%20coordination%20to%20complete%20my%20coupon%20mapping.`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-black inline-flex items-center space-x-2 transition-transform active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat and Link Now</span>
                      </a>
                    </div>
                  )}

                  {/* Completed / Coupon Delivered Badge */}
                  {trackingData.lead.CouponGenerated && (
                    <div className="bg-emerald-950/40 border border-emerald-900/50 p-5 rounded-2xl text-center space-y-2.5">
                      <div className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest">Personalised Ambassador Coupon Code</div>
                      <div className="text-2xl font-mono font-black text-emerald-400 tracking-wider bg-slate-950 py-3 rounded-xl border border-emerald-900/30 max-w-xs mx-auto select-all">
                        {trackingData.lead.CouponGenerated}
                      </div>
                      <p className="text-[10px] text-slate-400">Copy code and paste into the coupon section at Physics Wallah checkout.</p>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 9. REAL TESTIMONIALS SECTION */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="inline-block text-xs font-extrabold text-red-500 uppercase tracking-widest bg-red-600/10 px-3 py-1.5 rounded-full">
              STUDENT CORNER
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">What Students Say</h3>
            <p className="text-slate-400 text-sm">Real preparation aspirants review how they saved and mapped coupons successfully.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Aman Gupta",
                badge: "Lakshya JEE 2027",
                saving: "Saved ₹3,000",
                text: "I was confused how custom ambassador coupons work. The coordinate agent guided me securely without password. Mapped code worked instantly at checkout!"
              },
              {
                name: "Rohan Verma",
                badge: "Yakeen NEET 2027",
                saving: "Saved ₹4,500",
                text: "Highly reliable tracking. My Request ID went from pending review to delivered in 15 minutes. Best support for PW batches!"
              },
              {
                name: "Sneha Reddy",
                badge: "Class 10 Foundation",
                saving: "Saved ₹2,000",
                text: "The AI recommendation advisor proposed Arjuna JEE foundation. Applied directly below and Ambassador coupon mapped immediately. Recommended!"
              }
            ].map((t, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-black text-white">{t.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.badge}</p>
                  </div>
                  <span className="text-[10px] bg-red-600/10 text-red-500 border border-red-600/20 font-black px-2.5 py-1 rounded-full uppercase">
                    {t.saving}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed italic">"{t.text}"</p>
                <div className="flex text-amber-500">{"★".repeat(5)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. ACCORDION FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-900 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-block text-xs font-extrabold text-red-500 uppercase tracking-widest bg-red-600/10 px-3 py-1.5 rounded-full">
              KNOWLEDGE BASE
            </span>
            <h3 className="text-3xl font-black text-white tracking-tight">Frequently Asked Questions</h3>
            <p className="text-slate-400 text-sm">Inspecting quick queries about security and coupon delivery.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is this portal affiliated with Physics Wallah?",
                a: "Yes, this portal is operated by an Authorized Physics Wallah (PW) Campus Ambassador. We assist students in securing maximum discounts through official campaign mapping on the ambassador dashboard."
              },
              {
                q: "Why is OTP verification required?",
                a: "For existing registered app accounts, campaign discount coupon mapping requires secure profile link verification. This is completed via official PW system links. Your account password is never collected."
              },
              {
                q: "Are coupon discounts guaranteed?",
                a: "Discount eligibility depends on running official PW campaigns. We guarantee mapping the absolute highest active ambassador discount available for your course."
              },
              {
                q: "How long does it take to get a coupon?",
                a: "Most verification checks, coupon allocations, and code deliveries are successfully processed within 10 to 45 minutes of submitting your secure request."
              },
              {
                q: "Is my personal student data secure?",
                a: "Yes, completely. Student details are stored in an encrypted database linked to private authorized Google Sheets. We never share, distribute, or broadcast your academic profiles."
              }
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between text-white focus:outline-none"
                  >
                    <span className="text-xs sm:text-sm font-black text-slate-100 flex items-center space-x-3">
                      <HelpCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-red-500" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-3 pl-13"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA BANNER */}
      <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-red-600/20 text-red-400 px-4 py-2 rounded-full text-xs font-bold border border-red-600/30">
            🎁 Exclusive Student Promotion
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none max-w-3xl mx-auto">
            Ready to Save? Get Up To <br className="hidden sm:inline" />
            <span className="text-red-500">₹5,000 Off</span> Your Course Immediately
          </h2>
          
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Verify academic discount campaigns before purchasing. No account passwords required. Fast verification on WhatsApp.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => document.getElementById("request")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/20"
            >
              Request My Coupon Code
            </button>
            <button
              onClick={() => document.getElementById("announcement")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-wider"
            >
              Back To Top
            </button>
          </div>

          {/* Poster under final CTA */}
          <div className="max-w-md mx-auto rounded-3xl overflow-hidden border border-slate-800 shadow-2xl pt-6">
            <img 
              src={pwFooterBanner} 
              alt="Ambassador coupon map poster" 
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* 12. FLOATING BOTTOM-LEFT AI COURSE ADVISOR */}
      <div className="fixed bottom-6 left-6 z-50 font-sans">
        
        {/* Chat Toggle Bubble */}
        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="bg-slate-900 text-white w-14 h-14 rounded-2xl border border-slate-800 hover:border-red-600/30 shadow-2xl flex items-center justify-center relative transition-transform hover:scale-105 active:scale-95 group focus:outline-none"
          title="AI Course Advisor"
        >
          <AnimatePresence mode="wait">
            {isAiOpen ? (
              <X className="w-6 h-6 text-red-500" />
            ) : (
              <div className="relative">
                <Sparkles className="w-6 h-6 text-red-500 group-hover:animate-pulse" />
                <span className="absolute -top-3.5 -right-3.5 bg-red-600 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-full uppercase animate-bounce">
                  AI 🤖
                </span>
              </div>
            )}
          </AnimatePresence>
        </button>

        {/* Floating Chat Container Panel */}
        <AnimatePresence>
          {isAiOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 left-0 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-red-600/10 p-1.5 rounded-xl border border-red-600/20">
                    <Sparkles className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">AI Course Finder Bot</h5>
                    <p className="text-[9px] text-slate-400 font-mono">Gemini-Powered PW Specialist</p>
                  </div>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Steps Content */}
              <div className="p-5 max-h-[360px] overflow-y-auto space-y-4">
                {!aiRecommendation ? (
                  <div className="space-y-4 text-xs">
                    
                    {aiStep === 1 && (
                      <div className="space-y-3">
                        <p className="text-slate-300 font-bold leading-normal">Hello! 🤖 What exam are you targeting in Physics Wallah?</p>
                        <div className="grid grid-cols-1 gap-2">
                          {["IIT JEE (Main & Adv)", "NEET Medical", "Class 9-10 Foundation"].map(e => (
                            <button
                              key={e}
                              onClick={() => { setAiExam(e); setAiStep(2); }}
                              className="w-full text-left bg-slate-950 border border-slate-850 hover:border-red-600/30 p-3.5 rounded-xl transition-all text-slate-300 hover:text-white flex items-center justify-between font-bold"
                            >
                              <span>{e}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiStep === 2 && (
                      <div className="space-y-3.5">
                        <p className="text-slate-300 font-bold">Great! Let's narrow down your batch targets:</p>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Current Class Status</label>
                            <select
                              value={aiClass}
                              onChange={e => setAiClass(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none"
                            >
                              <option value="">Select Class</option>
                              <option value="9th Standard">9th Class</option>
                              <option value="10th Standard">10th Class</option>
                              <option value="11th Standard">11th Class</option>
                              <option value="12th Standard">12th Class</option>
                              <option value="Dropper / Repeater">Dropper / Repeater</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Target Year</label>
                            <select
                              value={aiYear}
                              onChange={e => setAiYear(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none"
                            >
                              <option value="2026">2026</option>
                              <option value="2027">2027</option>
                              <option value="2028">2028</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <button onClick={() => setAiStep(1)} className="text-slate-400 hover:text-white font-bold">Back</button>
                          <button
                            disabled={!aiClass}
                            onClick={() => setAiStep(3)}
                            className="bg-red-600 disabled:opacity-40 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black"
                          >
                            Next Step
                          </button>
                        </div>
                      </div>
                    )}

                    {aiStep === 3 && (
                      <div className="space-y-3.5">
                        <p className="text-slate-300 font-bold">Almost there! Select your language preference and study budget:</p>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Preferred Language</label>
                            <select
                              value={aiLanguage}
                              onChange={e => setAiLanguage(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none"
                            >
                              <option value="">Select Language</option>
                              <option value="Hinglish (Hindi+English)">Hinglish (Hindi + English)</option>
                              <option value="English Only">English Only</option>
                              <option value="Hindi Only">Hindi Only</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Study Mode</label>
                            <select
                              value={aiMode}
                              onChange={e => setAiMode(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-3 py-2.5 text-xs outline-none"
                            >
                              <option value="">Select Mode</option>
                              <option value="Online Classes (Live)">Online Classes (Live)</option>
                              <option value="Offline Vidyapeeth Center">Offline Vidyapeeth</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <button onClick={() => setAiStep(2)} className="text-slate-400 hover:text-white font-bold">Back</button>
                          <button
                            disabled={aiLoading || !aiLanguage || !aiMode}
                            onClick={handleGetAIRecommendation}
                            className="bg-red-600 disabled:opacity-40 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1"
                          >
                            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            <span>Find Cohort</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="space-y-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <div className="space-y-1">
                      <span className="text-[9px] text-red-500 font-extrabold uppercase tracking-widest">Recommended PW Batch</span>
                      <h6 className="text-sm font-black text-white">{aiRecommendation.recommendedBatch}</h6>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line">
                      {aiRecommendation.reasoning}
                    </p>

                    <div className="bg-amber-950/20 text-amber-500 border-l-2 border-amber-500 p-2.5 rounded-lg text-[10px] leading-normal flex items-start space-x-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{aiRecommendation.discountTidbit}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                      <button
                        onClick={() => {
                          setAiRecommendation(null);
                          setAiStep(1);
                        }}
                        className="text-slate-400 hover:text-white font-bold"
                      >
                        Reset Bot
                      </button>
                      <button
                        onClick={applyRecommendationToForm}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-1"
                      >
                        <span>Apply & Request</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 13. FLOATING RIGHT SOCIAL SHARE SYSTEM */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        
        {/* Toggle Share bubble */}
        <button
          onClick={() => setIsShareOpen(!isShareOpen)}
          className="bg-red-600 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-red-700 transition-transform hover:scale-105 active:scale-95 focus:outline-none border border-red-500"
          title="Share Portal with Friends"
        >
          <AnimatePresence mode="wait">
            {isShareOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Share2 className="w-6 h-6 text-white" />
            )}
          </AnimatePresence>
        </button>

        {/* Share Expand Overlay panel */}
        <AnimatePresence>
          {isShareOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 right-0 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4"
            >
              <div className="text-center space-y-1">
                <h6 className="text-xs font-black text-white uppercase tracking-wider">Share & Help Friends Save</h6>
                <p className="text-[10px] text-slate-400">Share with class partners or study groups on Telegram & WhatsApp.</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={shareOnWhatsApp}
                  className="w-full bg-[#25d366] hover:bg-[#20ba59] text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-950/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  onClick={shareOnTelegram}
                  className="w-full bg-[#0088cc] hover:bg-[#007cbd] text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-950/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Share on Telegram</span>
                </button>

                <button
                  onClick={copyShareLink}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-850 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <span>{isCopied ? "Referral Copied!" : "Copy Referral Link"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 14. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-900">
            
            {/* Column 1: Brand details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="bg-red-600 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-md">PW</span>
                <div>
                  <h4 className="font-extrabold text-white text-xs tracking-tight">PW Coupon Wallah</h4>
                  <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Campus Ambassador Network</p>
                </div>
              </div>
              <p className="leading-relaxed text-slate-400">
                Helping competitive students unlock verified high-tier discount coupons mapped securely on the official Physics Wallah ambassador database. All data is handled with strict privacy protocols.
              </p>
            </div>

            {/* Column 2: Legal Disclaimer */}
            <div className="space-y-3.5">
              <h5 className="text-white text-xs font-bold uppercase tracking-wider">Official Disclaimer</h5>
              <div className="p-3.5 bg-slate-900/50 border border-slate-900 rounded-xl leading-relaxed text-[11px] text-slate-500">
                <strong>Independent Coordinator:</strong> This portal is owned & operated independently by an Authorized Physics Wallah (PW) Campus Ambassador. It is not owned, corporately operated, or direct support staff of Physics Wallah Private Limited. All logos, batch titles, and brand trademarks correspond directly to their respective corporate owners.
              </div>
            </div>

            {/* Column 3: Community Access */}
            <div className="space-y-4">
              <h5 className="text-white text-xs font-bold uppercase tracking-wider">Active Student Communities</h5>
              <p className="leading-normal">
                Coordinate preparation guidelines, claim seasonal discount announcements, and retrieve class resources.
              </p>
              
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5">
                <a
                  href="https://chat.whatsapp.com/L9gPNg40VhaH8UxbB3wTVq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 bg-[#075e54]/10 hover:bg-[#075e54]/20 text-[#25d366] px-4 py-2.5 rounded-xl text-xs font-bold border border-[#075e54]/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Join Verified WhatsApp Group</span>
                </a>
                
                <a
                  href="https://telegram.me/PW_Helping_Hand"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#33a8e3] px-4 py-2.5 rounded-xl text-xs font-bold border border-[#0088cc]/20 transition-all"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Join Verified Telegram Group</span>
                </a>
              </div>
            </div>

          </div>

          {/* Legal bottom strip */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 space-y-4 sm:space-y-0">
            <p>© 2026 PW Coupon Wallah. Independent Authorized Campus Ambassador Service.</p>
            <div className="flex space-x-5">
              <a href="#home" className="hover:text-slate-300 transition-colors">Home</a>
              <a href="#benefits" className="hover:text-slate-300 transition-colors">Benefits</a>
              <a href="#request" className="hover:text-slate-300 transition-colors">Request Coupon</a>
              <a href="#faq" className="hover:text-slate-300 transition-colors">FAQ Support</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
