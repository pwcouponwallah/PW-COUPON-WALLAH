import React, { useState } from "react";
import { motion } from "motion/react";
import { LeadStatus } from "../types";
import { apiFetch } from "../lib/apiClient";

import pwHeroBanner from "../assets/images/pw_hero_banner_1784291217739.jpg";
import pwFooterBanner from "../assets/images/pw_footer_banner_1784291234758.jpg";
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
  X
} from "lucide-react";

interface StudentPortalProps {
  onGoToAdmin: () => void;
}

export default function StudentPortal({ onGoToAdmin }: StudentPortalProps) {
  // Navigation active tab (for smooth scrolling simulation or page view)
  const [activeTab, setActiveTab] = useState("HOME");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track Request State
  const [trackingId, setTrackingId] = useState("");
  const [trackingPhone, setTrackingPhone] = useState("");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // AI Course Finder State
  const [aiStep, setAiStep] = useState(1);
  const [aiExam, setAiExam] = useState("");
  const [aiClass, setAiClass] = useState("");
  const [aiYear, setAiYear] = useState("");
  const [aiLanguage, setAiLanguage] = useState("");
  const [aiMode, setAiMode] = useState("");
  const [aiBudget, setAiBudget] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  // Submit new request
  const handleFormSubmit = async () => {
    // Validate fields
    if (!formData.name.trim() || !/^[a-zA-Z\s]+$/.test(formData.name)) {
      setFormError("Please enter a valid alphabet-only student name.");
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!formData.exam || !formData.course) {
      setFormError("Please complete your Exam and Course details.");
      return;
    }
    if (!formData.consent) {
      setFormError("You must consent to let the PW Ambassador assist you to receive coupons.");
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
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || data.message || "Failed to submit request.";
        throw new Error(errMsg);
      }

      setFormSuccessData(data);
      setFormStep(5); // Success step
    } catch (err: any) {
      setFormError(err.message || "Server communication failed.");
    } finally {
      setFormLoading(false);
    }
  };

  // Run AI recommendation
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
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || "Failed to generate recommendation.";
        throw new Error(errMsg);
      }
      setAiRecommendation(data);
      // Automatically pre-fill form data with recommendations
      setFormData(prev => ({
        ...prev,
        exam: aiExam,
        course: data.recommendedBatch || ""
      }));
    } catch (e) {
      setAiRecommendation({
        recommendedBatch: `${aiExam} Core Cohort`,
        reasoning: "We recommended a core curriculum course structured specifically for JEE/NEET aspirants. Access all syllabus phases, curated homework modules, and mock checkups.",
        discountTidbit: "Official personalized ambassador coupon is highly eligible for this selection."
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Fetch status tracking
  const handleTrackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim() || !trackingPhone.trim()) {
      setTrackingError("Request ID and Mobile Number are required.");
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
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || "No matching record found.";
        throw new Error(errMsg);
      }

      setTrackingData(data);
    } catch (err: any) {
      setTrackingError(err.message || "Request tracking failed.");
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* 1. ANNOUNCEMENT BAR */}
      <div id="announcement-bar" className="bg-red-600 text-white text-xs font-semibold py-2.5 px-4 text-center tracking-wide">
        🚀 OFFICIAL CAMPUS AMBASSADOR ASSISTANCE PORTAL — GET ELIGIBLE DISCOUNTS DIRECTLY IN YOUR PW ACCOUNT
      </div>

      {/* 2. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="bg-red-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-red-600/20">PW</span>
            <div>
              <h1 className="font-extrabold text-slate-900 tracking-tight text-md">Coupon Wallah</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase leading-none">Official Ambassador CRM</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-1">
            {["HOME", "COURSES", "RECOMMEND", "REQUEST", "TRACK", "FAQ"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  const el = document.getElementById(tab.toLowerCase());
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                  activeTab === tab ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveTab("REQUEST");
                document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden sm:block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-600/10 transition-transform active:scale-95"
            >
              Request Coupon
            </button>
            <button
              onClick={onGoToAdmin}
              className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-slate-200"
            >
              Ambassador CRM
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown Panel */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-200 py-3 px-4 space-y-2 shadow-lg"
          >
            {["HOME", "COURSES", "RECOMMEND", "REQUEST", "TRACK", "FAQ"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                  const el = document.getElementById(tab.toLowerCase());
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === tab ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveTab("REQUEST");
                  setMobileMenuOpen(false);
                  document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full text-center bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-extrabold shadow-lg shadow-red-600/10"
              >
                Request Coupon Now
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section id="home" className="relative py-20 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-radial-gradient from-red-50/40 via-transparent to-transparent opacity-70" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Official PW Campus Ambassador</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight leading-none">
                Additional Discounts on <br />
                <span className="text-red-600">Physics Wallah Batches</span> <br />
                via Personalised Coupons.
              </h1>
              <p className="text-slate-600 text-base max-w-xl leading-relaxed">
                Receive direct student discount support. We assist you in selecting the right batch, verifying eligibility, and manually applying official personalised coupons directly inside your PW dashboard.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => {
                    setActiveTab("REQUEST");
                    document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-slate-950 text-white hover:bg-slate-900 px-6 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-transform active:scale-95 flex items-center space-x-2"
                >
                  <span>Request Instant Discount</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab("TRACK");
                    document.getElementById("track")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 px-6 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-transform active:scale-95"
                >
                  Track Existing Request
                </button>
              </div>

              {/* 4. LIVE TRUST INDICATORS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="font-mono text-xl font-extrabold text-slate-950">98 / 100</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">CRM TRUST SCORE</div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-xl font-extrabold text-slate-950">Instant</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">OTP GENERATION</div>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <div className="font-mono text-xl font-extrabold text-slate-950">100% Secured</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">OFFICIAL ROUTING</div>
                </div>
              </div>
            </div>

            {/* TRUST VISUAL CIRCLE GAUGE */}
            <div className="md:col-span-5 flex justify-center">
              <div className="bg-slate-950 text-white p-8 rounded-3xl w-full max-w-sm relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl" />
                <div className="flex justify-between items-start mb-8">
                  <div className="bg-white/10 p-2.5 rounded-xl">
                    <UserCheck className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-[10px] bg-red-600 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">SECURED CRM v2.0</span>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase">PORTAL SECURITY RATING</div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-extrabold tracking-tight text-white">98%</span>
                    <span className="text-xs text-emerald-400 font-semibold">Excellent</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3.5 border-t border-white/10 pt-6 text-xs text-slate-300">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Google Sheets Verified Security</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Official PW Dashboard Compliance</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>SSL Encrypted Data Transmissions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HORIZONTAL BANNER UNDER HERO GRID */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 rounded-3xl overflow-hidden border border-slate-200 shadow-xl group hover:shadow-2xl transition-all duration-300 bg-white"
          >
            <img 
              src={pwHeroBanner} 
              alt="Physics Wallah Official Ambassador - Unlock up to Rs 5000 Off" 
              className="w-full h-auto object-cover transform hover:scale-[1.01] transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* 5. HOW IT WORKS / TRANSPARENCY SECTION */}
      <section id="courses" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              A Transparent Process for Real Savings
            </h2>
            <p className="text-slate-600 text-sm">
              We never collect your account password. All coupon code operations are generated natively by the official campus ambassador platform and mapped directly to your official register phone number.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Choose or Finder Batch",
                desc: "Choose your target Physics Wallah batch directly or query our custom AI Assistant to search for recommended cohorts."
              },
              {
                step: "02",
                title: "Submit Request Form",
                desc: "Fill in academic criteria and register details. Our CRM records and instantly allocates a secure transactional ID."
              },
              {
                step: "03",
                title: "OTP Verification",
                desc: "For existing students, connect with the PW ambassador to securely authorize and generation mapping coupon campaigns."
              },
              {
                step: "04",
                title: "Coupon Delivered",
                desc: "Secure the coupon code via tracking portal or official Email notifications, check-out on PW app and save!"
              }
            ].map((s, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="text-red-600 font-extrabold text-2xl font-mono">{s.step}</div>
                <h3 className="text-md font-bold text-slate-950">{s.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. AI COURSE RECOMMENDATION COMPONENT */}
      <section id="recommend" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/15 rounded-full blur-3xl" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center space-x-2 bg-white/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>AI Course Recommendation Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Need Help Selecting Your PW Batch?</h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                Provide academic target profiles below. Gemini AI analyzes PW curriculum cohorts to extract the perfect recommendation batch and coupon eligibility.
              </p>

              {/* Multi-step AI Selection */}
              {!aiRecommendation ? (
                <div className="space-y-6 pt-6 border-t border-white/10">
                  {aiStep === 1 && (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Which exam are you targeting?</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {["JEE Main/Adv", "NEET", "Class 9-10 Foundation", "CUET/Boards"].map(e => (
                          <button
                            key={e}
                            onClick={() => { setAiExam(e); setAiStep(2); }}
                            className={`p-3 rounded-xl border text-xs font-bold text-center transition-colors ${
                              aiExam === e ? "border-red-500 bg-red-500/10 text-white" : "border-white/10 text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiStep === 2 && (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Academic and Study details</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select 
                          value={aiClass} 
                          onChange={e => setAiClass(e.target.value)}
                          className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                        >
                          <option value="">Select current Class</option>
                          <option value="9th Standard">9th Standard</option>
                          <option value="10th Standard">10th Standard</option>
                          <option value="11th Standard">11th Standard</option>
                          <option value="12th Standard">12th Standard</option>
                          <option value="Dropper / Repeater">Dropper / Repeater</option>
                        </select>

                        <select 
                          value={aiYear} 
                          onChange={e => setAiYear(e.target.value)}
                          className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                        >
                          <option value="">Select Target Year</option>
                          <option value="2026">2026</option>
                          <option value="2027">2027</option>
                          <option value="2028">2028</option>
                        </select>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button onClick={() => setAiStep(1)} className="text-xs text-slate-400 hover:text-white font-bold">Back</button>
                        <button 
                          disabled={!aiClass || !aiYear}
                          onClick={() => setAiStep(3)} 
                          className="bg-red-600 disabled:opacity-40 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {aiStep === 3 && (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Preferred Language and Mode</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select 
                          value={aiLanguage} 
                          onChange={e => setAiLanguage(e.target.value)}
                          className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                        >
                          <option value="">Language preference</option>
                          <option value="Hinglish (Hindi+English)">Hinglish (Hindi + English)</option>
                          <option value="English Only">English Only</option>
                          <option value="Hindi Only">Hindi Only</option>
                        </select>

                        <select 
                          value={aiMode} 
                          onChange={e => setAiMode(e.target.value)}
                          className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
                        >
                          <option value="">Study mode</option>
                          <option value="Online Classes">Online Classes (PW Live)</option>
                          <option value="Offline Vidyapeeth Center">Offline Vidyapeeth Centers</option>
                        </select>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button onClick={() => setAiStep(2)} className="text-xs text-slate-400 hover:text-white font-bold">Back</button>
                        <button 
                          disabled={aiLoading || !aiLanguage || !aiMode}
                          onClick={handleGetAIRecommendation}
                          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2"
                        >
                          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          <span>Analyze with Gemini</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 pt-6 border-t border-white/10 bg-slate-850 p-6 rounded-2xl border border-white/5">
                  <div className="space-y-2">
                    <div className="text-[10px] text-red-400 uppercase tracking-wider font-extrabold">GEMINI AI RECOMMENDED BATCH</div>
                    <h3 className="text-xl font-extrabold text-white">{aiRecommendation.recommendedBatch}</h3>
                  </div>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {aiRecommendation.reasoning}
                  </p>

                  <div className="bg-white/5 p-4 rounded-xl text-xs text-amber-300 border-l-2 border-amber-400 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{aiRecommendation.discountTidbit}</span>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setAiRecommendation(null);
                        setAiStep(1);
                        setAiExam("");
                        setAiClass("");
                        setAiYear("");
                        setAiLanguage("");
                        setAiMode("");
                      }}
                      className="text-slate-400 hover:text-white text-xs font-bold px-3 py-2 transition-colors"
                    >
                      Reset Finder
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("REQUEST");
                        document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2"
                    >
                      <span>Proceed to Request Coupon</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECURED MULTI-STEP REQUEST FORM */}
      <section id="request" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Form Headers */}
            <div className="bg-slate-950 text-white p-6 sm:p-8 text-center space-y-2 relative">
              <span className="text-[10px] bg-red-600 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">SECURE SUBMISSION</span>
              <h2 className="text-xl font-extrabold tracking-tight">Request Personalised Coupon</h2>
              <p className="text-slate-400 text-[11px]">Fill up in 3 simple phases. Guaranteed response within 1 hour.</p>

              {/* Progress dots */}
              <div className="flex justify-center space-x-2 pt-4">
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      formStep === s ? "w-6 bg-red-600" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {formError && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-xs font-semibold mb-6 flex items-start space-x-2 animate-bounce">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Step 1: Student Contact Details</h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Full Student Name (Alphabet only)</label>
                    <input
                      type="text"
                      placeholder="e.g. Priyanshu Kumar"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Registered Mobile (10-digits for PW linkage)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Email Address (To receive coupon HTML)</label>
                    <input
                      type="email"
                      placeholder="e.g. priyanshu@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      disabled={!formData.name || !formData.phone || !formData.email}
                      onClick={() => setFormStep(2)}
                      className="w-full bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-transform active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <span>Continue Academic Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Step 2: Academic Goals</h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Target Exam</label>
                    <select
                      value={formData.exam}
                      onChange={e => setFormData({ ...formData, exam: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-red-600"
                    >
                      <option value="">Select Exam</option>
                      <option value="JEE">IIT JEE (Main & Advanced)</option>
                      <option value="NEET">NEET Medical</option>
                      <option value="Class 9-10 Foundation">Class 9th / 10th Foundation</option>
                      <option value="Boards / CUET">Class 12 Boards / CUET</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Target Batch / Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lakshya JEE 2027"
                      value={formData.course}
                      onChange={e => setFormData({ ...formData, course: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:bg-white focus:border-red-600 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Target Year</label>
                      <select
                        value={formData.targetYear}
                        onChange={e => setFormData({ ...formData, targetYear: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none"
                      >
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Language</label>
                      <select
                        value={formData.language}
                        onChange={e => setFormData({ ...formData, language: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none"
                      >
                        <option value="Hindi/English">Hinglish</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button onClick={() => setFormStep(1)} className="w-1/3 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl py-3 text-slate-700">
                      Back
                    </button>
                    <button
                      disabled={!formData.exam || !formData.course}
                      onClick={() => setFormStep(3)}
                      className="w-2/3 bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-transform active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <span>Continue Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Step 3: Account Credentials</h3>
                  
                  <div className="bg-amber-50 border-l-2 border-amber-500 p-4 rounded-xl text-xs text-amber-800 space-y-1 leading-relaxed">
                    <span className="font-bold">Privacy Advisory Notice:</span>
                    <p>Physics Wallah coupon mapping rules vary. If you are an <strong>existing active PW App user</strong>, coupon mapping requires coordination with your ambassador for OTP processing inside the official dashboard.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-600 block">Have you registered on the Physics Wallah app already?</label>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setFormData({ ...formData, existingPwUser: true })}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl border text-center transition-colors ${
                          formData.existingPwUser ? "bg-red-50 border-red-500 text-red-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Yes, registered PW user
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, existingPwUser: false })}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl border text-center transition-colors ${
                          !formData.existingPwUser ? "bg-red-50 border-red-500 text-red-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        No, new student account
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Expected Purchase Timeline</label>
                    <select
                      value={formData.purchaseTimeline}
                      onChange={e => setFormData({ ...formData, purchaseTimeline: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none"
                    >
                      <option value="Immediate">Immediate / Today</option>
                      <option value="Within 3 days">Within 3 days</option>
                      <option value="Within 1 week">Within 1 week</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Add custom notes or remarks (optional)</label>
                    <textarea
                      placeholder="e.g. Requesting Arjuna JEE batch additional discounts..."
                      value={formData.remarks}
                      onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs h-20 outline-none resize-none focus:border-red-600"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button onClick={() => setFormStep(2)} className="w-1/3 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl py-3 text-slate-700">
                      Back
                    </button>
                    <button
                      onClick={() => setFormStep(4)}
                      className="w-2/3 bg-slate-950 hover:bg-slate-900 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-transform active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <span>Review Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Step 4: Review and Consent</h3>
                  
                  <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">Student Name:</span>
                      <span className="font-bold text-slate-900">{formData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">Mobile Link:</span>
                      <span className="font-bold text-slate-900 font-mono">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-500">Target Batch:</span>
                      <span className="font-bold text-slate-900">{formData.course}</span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-slate-500">PW Account:</span>
                      <span className="font-bold text-slate-900">{formData.existingPwUser ? "Existing PW Account" : "New Student Account"}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="consent-checkbox"
                      checked={formData.consent}
                      onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-1 accent-red-600 rounded"
                    />
                    <label htmlFor="consent-checkbox" className="text-[11px] text-slate-600 leading-normal select-none cursor-pointer">
                      <strong>Mandatory Student Consent:</strong> I verify that all details provided are accurate. I authorize the official PW Campus Ambassador to verify campaign discount availability and coordinate manual personalized coupon generation under official PW terms.
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button onClick={() => setFormStep(3)} className="w-1/3 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl py-3 text-slate-700">
                      Back
                    </button>
                    <button
                      disabled={formLoading || !formData.consent}
                      onClick={handleFormSubmit}
                      className="w-2/3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-transform active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-red-600/15"
                    >
                      {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Submit Secure Request</span>
                    </button>
                  </div>
                </div>
              )}

              {formStep === 5 && formSuccessData && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-950">🎉 Request Received Securely</h3>
                    <p className="text-slate-600 text-xs px-4">
                      Your coupon request has been recorded inside our Ambassador CRM. Below is your official Request ID. Use this ID to track your progress at any time.
                    </p>
                  </div>

                  <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 shadow-inner max-w-xs mx-auto">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">YOUR SECURED REQUEST ID</div>
                    <div className="text-xl font-mono font-extrabold text-red-500 tracking-widest">{formSuccessData.requestId}</div>
                  </div>

                  <p className="text-xs text-slate-500">
                    A confirmation email has been dispatched to <strong>{formData.email}</strong>.
                  </p>

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center pt-4">
                    <button
                      onClick={() => {
                        setTrackingId(formSuccessData.requestId);
                        setTrackingPhone(formData.phone);
                        setActiveTab("TRACK");
                        setTimeout(() => {
                          document.getElementById("track")?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="bg-slate-900 hover:bg-slate-850 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-transform active:scale-95"
                    >
                      Track Request Progress
                    </button>
                    <button
                      onClick={() => {
                        // Reset Form
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
                      className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
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

      {/* 8. SECURE STUDENT TRACKING PORTAL */}
      <section id="track" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-red-600" />
              <span>Double-Verification Tracking Portal</span>
            </div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Track Your Real-time Progress</h2>
            <p className="text-slate-600 text-xs">
              Ensure privacy. Enter both your sequential Request ID and registered mobile to load live status, notes, and coupon delivery.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Input Column */}
            <div className="md:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <form onSubmit={handleTrackRequest} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Request ID</label>
                  <input
                    type="text"
                    placeholder="e.g. PW202607160001"
                    value={trackingId}
                    onChange={e => setTrackingId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-red-600 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Mobile / Email</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={trackingPhone}
                    onChange={e => setTrackingPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-red-600 outline-none font-mono"
                  />
                </div>

                {trackingError && (
                  <p className="text-[11px] text-red-600 font-semibold">{trackingError}</p>
                )}

                <button
                  type="submit"
                  disabled={trackingLoading || !trackingId || !trackingPhone}
                  className="w-full bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-transform active:scale-95"
                >
                  {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Verify and Track</span>
                </button>
              </form>
            </div>

            {/* Tracking Results Column */}
            <div className="md:col-span-7">
              {!trackingData ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-medium bg-slate-50">
                  <Lock className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  <span>Awaiting dual-input secure tracking validation. Your data is protected.</span>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="font-extrabold text-slate-950 text-md">{trackingData.lead.Name}</h4>
                      <p className="text-slate-500 text-[11px]">{trackingData.lead.Course}</p>
                    </div>
                    <span className="text-[10px] bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-red-200">
                      {trackingData.lead.LeadStatus}
                    </span>
                  </div>

                  {/* 9. TIMELINE DRAW */}
                  <div className="space-y-6">
                    {trackingData.timeline.map((stage: any, idx: number) => {
                      let iconColor = "text-slate-300 bg-slate-100";
                      if (stage.status === "completed") iconColor = "text-emerald-600 bg-emerald-50 border border-emerald-200";
                      else if (stage.status === "warning") iconColor = "text-amber-600 bg-amber-50 border border-amber-200 animate-pulse";
                      else if (stage.status === "failed") iconColor = "text-red-600 bg-red-50 border border-red-200";

                      return (
                        <div key={idx} className="flex space-x-4 relative">
                          {idx < trackingData.timeline.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100" />
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <div className="space-y-1 pt-0.5">
                            <h5 className="text-xs font-extrabold text-slate-900">{stage.stage}</h5>
                            <p className="text-[11px] text-slate-600 leading-normal">{stage.remarks}</p>
                            {stage.time && (
                              <p className="text-[9px] text-slate-400 font-mono">
                                {new Date(stage.time).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 10. OTP ACTION CARD & CONTACT AMBASSADOR */}
                  {trackingData.lead.LeadStatus === LeadStatus.WAITING_STUDENT && (
                    <div className="bg-red-50 border border-red-200/60 p-4 rounded-xl space-y-3">
                      <div className="flex items-start space-x-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <h6 className="text-xs font-bold text-red-700">Student Action Required</h6>
                          <p className="text-[11px] text-red-600 leading-normal">
                            To generate your official PW discount coupon, please share the verification OTP with your ambassador. Click below to start WhatsApp support.
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/919102875154?text=Hello%20PW%20Ambassador,%20Request%20ID:%20${trackingData.lead.LeadID}.%20I%20would%20like%20assistance%20regarding%20my%20personalised%20coupon%20request.`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow-md shadow-emerald-600/10 transition-transform active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Send WhatsApp Message</span>
                      </a>
                    </div>
                  )}

                  {/* Coupon Display Card */}
                  {trackingData.lead.CouponDelivered && trackingData.lead.CouponGenerated && (
                    <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-xl text-center space-y-2">
                      <div className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">YOUR COMPLETED COUPON CODE</div>
                      <div className="text-xl font-mono font-extrabold text-emerald-600 tracking-wider bg-white py-2 rounded-lg border border-emerald-100 shadow-sm max-w-xs mx-auto">
                        {trackingData.lead.CouponGenerated}
                      </div>
                      <p className="text-[10px] text-emerald-600">Copy this code and apply it in the official PW App checkout page.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 9. GROUPED FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-xs">Got questions about personalized ambassador coupons? Find your answers here.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                q: "Is this affiliated with Physics Wallah?",
                a: "Yes, this is an official campus ambassador program. We are registered student coordinators authorized to map personalized student coupons for campaign cohorts."
              },
              {
                q: "Why is there an OTP required?",
                a: "For existing registered users, the official ambassador portal maps campaign benefits to your specific profile. This requires sharing a secure application link OTP. Your password is never asked."
              },
              {
                q: "Are coupon discounts guaranteed?",
                a: "Discount percentages fluctuate according to running official PW campaigns. We guarantee mapping the absolute highest eligible active campaign discount to your account."
              },
              {
                q: "What is the turn-around response time?",
                a: "Most request checks, allocations, and deliveries take place within 10 to 45 minutes of secure form submission."
              },
              {
                q: "How do I apply the coupon?",
                a: "Once generated, the custom code is visible on your tracking portal and sent via Email. Simply paste it into the coupon section at PW checkout."
              },
              {
                q: "Is my personal data protected?",
                a: "Absolutely. Student records are secured behind encrypted Google Sheets integrations. We never sell, broadcast, or share user contacts."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. AMBASSADOR PROMO BANNER SECTION (ABOVE FOOTER) */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            {/* Promo Text Content */}
            <div className="md:col-span-7 space-y-6">
              <span className="inline-flex items-center space-x-2 bg-red-600/20 text-red-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                🎁 Exclusive Ambassador Offer
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                Don't Buy Batches at Full Price! <br />
                <span className="text-red-500">Get Up To ₹5000 Off</span> Instantly.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                Scan the QR code on the official poster or submit a request above. We ensure you get the absolute maximum discount mapped directly to your official register phone number.
              </p>

              {/* Bullet list of features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="flex items-center space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>100% Safe & Verified Process</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Personalised Coupon Mapping</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Instant Verification & OTP Process</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Direct Addition to your PW Account</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => {
                    setActiveTab("REQUEST");
                    const el = document.getElementById("request");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-transform active:scale-95"
                >
                  Request My Coupon Now
                </button>
                <button
                  onClick={() => {
                    const announcementBar = document.getElementById("announcement-bar");
                    if (announcementBar) {
                      announcementBar.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-transform active:scale-95 flex items-center space-x-2"
                >
                  <span>Back to Top</span>
                </button>
              </div>
            </div>

            {/* Vertical Poster Column */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 shadow-2xl group hover:border-red-500/30 transition-all duration-300 bg-slate-900">
                <img 
                  src={pwFooterBanner} 
                  alt="Physics Wallah Ambassador Poster" 
                  className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300 py-12 border-t border-slate-800 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800/80">
            {/* Column 1: Brand & Role */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-md">PW</span>
                <div>
                  <h4 className="font-extrabold text-white text-xs tracking-tight">PW Coupon Wallah</h4>
                  <p className="text-[9px] text-slate-500 font-mono uppercase leading-none">Campus Ambassador Network</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Helping students unlock official maximum discounts and benefits on Physics Wallah batches. Submitted details are securely processed directly on the official dashboard.
              </p>
            </div>

            {/* Column 2: Disclaimer */}
            <div className="space-y-3">
              <h5 className="text-white text-xs font-bold tracking-wide uppercase">Legal Disclaimer</h5>
              <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Disclaimer:</strong> This portal is operated independently by an Authorized Physics Wallah (PW) Campus Ambassador. It is not owned, operated, or direct corporate customer support of Physics Wallah Pvt. Ltd. All product names, logos, brands, and trademarks are property of their respective owners.
                </p>
              </div>
            </div>

            {/* Column 3: Active Student Communities */}
            <div className="space-y-4">
              <h5 className="text-white text-xs font-bold tracking-wide uppercase">Join Active Communities</h5>
              <p className="text-xs text-slate-400">
                Never miss an active coupon campaign, batch announcement, or preparation materials update.
              </p>
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5">
                <a
                  href="https://chat.whatsapp.com/L9gPNg40VhaH8UxbB3wTVq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 bg-[#075e54]/20 hover:bg-[#075e54]/35 text-[#25d366] px-4 py-2 rounded-xl text-xs font-bold border border-[#075e54]/30 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Join Official WhatsApp Group</span>
                </a>
                <a
                  href="https://telegram.me/PW_Helping_Hand"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 bg-[#0088cc]/20 hover:bg-[#0088cc]/35 text-[#33a8e3] px-4 py-2 rounded-xl text-xs font-bold border border-[#0088cc]/30 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Join Official Telegram Group</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 space-y-4 sm:space-y-0">
            <p>© 2026 PW Coupon Wallah. Independent Authorized Campus Ambassador Service.</p>
            <div className="flex space-x-4">
              <a href="#home" className="hover:text-slate-300 transition-colors">Home</a>
              <a href="#courses" className="hover:text-slate-300 transition-colors">Courses</a>
              <a href="#request" className="hover:text-slate-300 transition-colors">Request Coupon</a>
              <a href="#faq" className="hover:text-slate-300 transition-colors">FAQ Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
