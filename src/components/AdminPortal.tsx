import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Mail, 
  Settings, 
  ShieldAlert, 
  Search, 
  Filter, 
  ChevronRight, 
  RefreshCw, 
  Calendar,
  AlertTriangle,
  LogOut,
  Copy,
  Plus,
  Play,
  FileText,
  ListFilter,
  Check,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Loader2,
  Menu,
  X
} from "lucide-react";
import { Lead, LeadStatus, Priority } from "../types";
import { apiFetch } from "../lib/apiClient";

// Official Google Workspace Auth & Sign In Mock
import { googleSignIn, initAuth, logout } from "../lib/auth"; // We will create this simple script in /src/lib/auth.ts!

interface AdminPortalProps {
  onGoToStudent: () => void;
}

export default function AdminPortal({ onGoToStudent }: AdminPortalProps) {
  // Authentication state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // DB Config State
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [adminMobileMenuOpen, setAdminMobileMenuOpen] = useState(false);

  // Active view: "DASHBOARD" | "LEADS" | "KANBAN" | "OTP" | "LOGS" | "SETTINGS"
  const [activeTab, setActiveTab] = useState("DASHBOARD");

  // Leads State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Leads Filter State
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterExam, setFilterExam] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Logs State
  const [logs, setLogs] = useState<any>({ auditLogs: [], emailLogs: [], errorLogs: [] });

  // Lead Details Panel editing state
  const [editStatus, setEditStatus] = useState<LeadStatus | "">("");
  const [editPriority, setEditPriority] = useState<Priority | "">("");
  const [editCouponCode, setEditCouponCode] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editOtpReceived, setEditOtpReceived] = useState(false);
  const [editOtpRequired, setEditOtpRequired] = useState(false);
  const [editCouponDelivered, setEditCouponDelivered] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Analytics summary state
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Force sheet sync state
  const [syncLoading, setSyncLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Initialize auth state
  useEffect(() => {
    initAuth(
      async (user: any, token: string) => {
        if (user && user.email?.toLowerCase() !== "pwcouponwallah@gmail.com") {
          await logout();
          setIsAdmin(false);
          setAdminUser(null);
          setGoogleToken(null);
          setLoginError("Access Denied: Only pwcouponwallah@gmail.com is authorized to access this portal.");
          return;
        }
        setIsAdmin(true);
        setAdminUser(user);
        setGoogleToken(token);
        // Pre-fill local token in config
        apiFetch("/api/health")
          .then(r => r.json())
          .then(data => {
            setDbStatus(data);
          });
      },
      () => {
        setIsAdmin(false);
        setAdminUser(null);
        setGoogleToken(null);
      }
    );
  }, []);

  // Fetch leads and metrics whenever token or tab changes
  useEffect(() => {
    if (isAdmin) {
      fetchLeads();
      fetchAnalytics();
      fetchLogs();
      fetchHealth();
    }
  }, [isAdmin, activeTab, googleToken]);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const result = await googleSignIn();
      if (result) {
        if (result.user.email?.toLowerCase() !== "pwcouponwallah@gmail.com") {
          await logout();
          setIsAdmin(false);
          setAdminUser(null);
          setGoogleToken(null);
          throw new Error("Access Denied: Only pwcouponwallah@gmail.com is authorized to access this portal.");
        }
        setIsAdmin(true);
        setAdminUser(result.user);
        setGoogleToken(result.accessToken);
        showToast("Logged in successfully with Google Secure API");
      }
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in with Google Auth.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsAdmin(false);
    setAdminUser(null);
    setGoogleToken(null);
  };

  // Toast indicator
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const url = new URL("/api/leads/list", window.location.origin);
      if (filterStatus !== "ALL") url.searchParams.append("status", filterStatus);
      if (filterExam !== "ALL") url.searchParams.append("exam", filterExam);
      if (filterPriority !== "ALL") url.searchParams.append("priority", filterPriority);
      if (searchTerm) url.searchParams.append("search", searchTerm);
      if (googleToken) url.searchParams.append("token", googleToken);

      const res = await apiFetch(url.toString());
      
      if (res.status === 403) {
        await handleLogout();
        setLoginError("Session expired or Unauthorized access. Please sign in again with the authorized Google account.");
        return;
      }
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch leads");
      }
      setLeads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch leads", err);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const url = new URL("/api/analytics", window.location.origin);
      if (googleToken) url.searchParams.append("token", googleToken);
      const res = await apiFetch(url.toString());
      
      if (res.status === 403) {
        await handleLogout();
        setLoginError("Session expired or Unauthorized access. Please sign in again with the authorized Google account.");
        return;
      }
      
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const url = new URL("/api/logs", window.location.origin);
      if (googleToken) url.searchParams.append("token", googleToken);
      const res = await apiFetch(url.toString());
      
      if (res.status === 403) {
        await handleLogout();
        setLoginError("Session expired or Unauthorized access. Please sign in again with the authorized Google account.");
        return;
      }
      
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await apiFetch("/api/health");
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error("Failed to fetch health check", err);
    }
  };

  // Setup Spreadsheet Database automatically
  const handleAutoSheetsSetup = async () => {
    if (!googleToken) return;
    setSetupLoading(true);
    try {
      const res = await apiFetch("/api/sheets/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleToken })
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || "Setup failed";
        throw new Error(errMsg);
      }
      
      showToast("Google Sheets provisioned successfully with headers!");
      fetchHealth();
      fetchLeads();
    } catch (err: any) {
      alert(err.message || "Failed to create Google Sheet database.");
    } finally {
      setSetupLoading(false);
    }
  };

  // Connect manual sheet ID
  const handleConnectSheetId = async () => {
    if (!spreadsheetIdInput) return;
    setSetupLoading(true);
    try {
      const res = await apiFetch("/api/sheets/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId: spreadsheetIdInput, token: googleToken })
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || "Failed to save ID";
        throw new Error(errMsg);
      }
      
      showToast("Spreadsheet connected manually!");
      fetchHealth();
      fetchLeads();
      setSpreadsheetIdInput("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSetupLoading(false);
    }
  };

  // Force Sheets Synchronization
  const handleForceSync = async () => {
    if (!googleToken) {
      showToast("Sign-in with Google required to execute sheet sync!");
      return;
    }
    setSyncLoading(true);
    try {
      const res = await apiFetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleToken })
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || "Sync failed";
        throw new Error(errMsg);
      }
      
      showToast("Spreadsheet sync successful!");
      fetchHealth();
      fetchLeads();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  // Edit lead detail drawer loading
  const handleOpenLeadDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setEditStatus(lead.LeadStatus);
    setEditPriority(lead.Priority);
    setEditCouponCode(lead.CouponGenerated || "");
    setEditRemarks(lead.Remarks || "");
    setEditOtpRequired(lead.OTPRequired);
    setEditOtpReceived(lead.OTPReceived);
    setEditCouponDelivered(lead.CouponDelivered);
  };

  // Submit single lead CRM update
  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    setUpdateLoading(true);
    try {
      const res = await apiFetch("/api/leads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.LeadID,
          status: editStatus,
          priority: editPriority,
          couponCode: editCouponCode,
          remarks: editRemarks,
          otpRequired: editOtpRequired,
          otpReceived: editOtpReceived,
          couponDelivered: editCouponDelivered,
          token: googleToken
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = (data.error && typeof data.error === "object" ? data.error.message : data.error) || "Failed to update lead";
        throw new Error(errMsg);
      }

      showToast(`Lead ${selectedLead.LeadID} updated successfully!`);
      fetchLeads();
      fetchAnalytics();
      setSelectedLead(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdateLoading(true);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-50 text-blue-700 border border-blue-200";
      case "UNDER_REVIEW": return "bg-purple-50 text-purple-700 border border-purple-200";
      case "WAITING_STUDENT": return "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse";
      case "COUPON_GENERATED": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "COUPON_DELIVERED": return "bg-emerald-600 text-white";
      case "COMPLETED": return "bg-slate-150 text-slate-700 border border-slate-300";
      case "CANCELLED": return "bg-red-50 text-red-700 border border-red-200";
      default: return "bg-slate-50 text-slate-600";
    }
  };

  // PIE CHART DECORATION
  const COLORS = ["#3b82f6", "#dc2626", "#eab308", "#a855f7"];

  if (!isAdmin) {
    // Elegant Security Verification Login Panel
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 antialiased">
        <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-sm w-full space-y-6 text-center">
          <div className="space-y-2">
            <span className="bg-red-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-red-600/30">PW</span>
            <h2 className="text-xl font-extrabold tracking-tight text-white">Ambassador CRM Login</h2>
            <p className="text-slate-400 text-xs leading-normal">
              Private administrator dashboard. Double-authentication verified. Access restricts to authorized ambassador Google accounts only.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-xl text-[11px] leading-relaxed flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Sign in with Google Secure</span>
            </button>
            
            <button
              onClick={onGoToStudent}
              className="w-full text-slate-400 hover:text-white text-xs font-bold tracking-wider uppercase py-2 transition-colors"
            >
              Back to Student Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 antialiased font-sans relative overflow-x-hidden">
      
      {/* SIDEBAR BACKDROP FOR MOBILE */}
      {adminMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden" 
          onClick={() => setAdminMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out ${
        adminMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-md">PW</span>
            <div>
              <h1 className="font-extrabold text-white text-xs tracking-tight">CRM Control</h1>
              <p className="text-[9px] text-slate-500 font-mono leading-none">Ambassador Admin v2.0</p>
            </div>
          </div>
          <button
            onClick={() => setAdminMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-800 rounded-lg text-slate-400 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "DASHBOARD", label: "Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "LEADS", label: "Lead Management", icon: <Users className="w-4 h-4" /> },
            { id: "KANBAN", label: "Kanban Board", icon: <CheckCircle2 className="w-4 h-4" /> },
            { id: "OTP", label: "OTP Queue", icon: <AlertCircle className="w-4 h-4" /> },
            { id: "LOGS", label: "System Logs", icon: <FileText className="w-4 h-4" /> },
            { id: "SETTINGS", label: "CRM Settings", icon: <Settings className="w-4 h-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setAdminMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
                activeTab === item.id ? "bg-red-600 text-white shadow-lg shadow-red-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ADMIN USER FOOTER */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 px-2">
            <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 font-extrabold flex items-center justify-center text-xs">
              {adminUser?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate leading-tight">{adminUser?.displayName || "Ambassador"}</p>
              <p className="text-[9px] text-slate-500 truncate leading-none">{adminUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl text-[10px] uppercase tracking-wider font-extrabold border border-slate-800 hover:bg-red-600/10 hover:text-red-500 hover:border-red-600/10 text-slate-400 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col h-screen">
        
        {/* HEADER BAR */}
        <header className="bg-white border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <button
              onClick={() => setAdminMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none shrink-0"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm sm:text-md font-extrabold text-slate-900 tracking-tight capitalize truncate max-w-[120px] sm:max-w-none">
              {activeTab.toLowerCase()}
            </h2>
            
            {/* Database status pill */}
            <div 
              className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] shrink-0"
              title={dbStatus?.sheetsConnected ? "Sheets Connected" : "Local Database Active"}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${dbStatus?.sheetsConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="font-semibold text-slate-600 uppercase tracking-wider hidden xs:inline">
                {dbStatus?.sheetsConnected ? "Connected" : "Local Active"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <button
              onClick={handleForceSync}
              disabled={syncLoading}
              className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors border border-slate-200 flex items-center space-x-1"
              title="Force synchronize local Leads to Connected Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider px-1 hidden sm:inline">Sync</span>
            </button>
            <button
              onClick={onGoToStudent}
              className="text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
            >
              <span className="sm:hidden">Student</span>
              <span className="hidden sm:inline">Student Portal</span>
            </button>
          </div>
        </header>

        {/* TOAST MESSAGE */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center space-x-2 border border-slate-800">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="p-4 sm:p-8">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "DASHBOARD" && (
            <div className="space-y-8">
              
              {/* SETUP CALLOUT IF SHEETS NOT CONNECTED */}
              {!dbStatus?.sheetsConnected && (
                <div className="bg-amber-50 border border-amber-200/60 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Google Sheets Database Not Setup</span>
                    </h3>
                    <p className="text-slate-600 text-xs">
                      Provision a private secure Spreadsheet to back up student request workflows. Idempotent setup.
                    </p>
                  </div>
                  <button
                    onClick={handleAutoSheetsSetup}
                    disabled={setupLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95 shrink-0"
                  >
                    {setupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    <span>Initialize Sheets API</span>
                  </button>
                </div>
              )}

              {/* KPI CARD GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { label: "Total Requests", value: analytics?.total ?? "...", icon: <Users className="w-5 h-5 text-blue-500" /> },
                  { label: "Pending Review", value: analytics?.pending ?? "...", icon: <Clock className="w-5 h-5 text-purple-500" /> },
                  { label: "OTP Waiting", value: analytics?.otpQueue ?? "...", icon: <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" /> },
                  { label: "Coupons Completed", value: analytics?.completed ?? "...", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center min-w-0">
                    <div className="space-y-1 min-w-0">
                      <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider truncate">{kpi.label}</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono truncate">{kpi.value}</p>
                    </div>
                    <div className="bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100 shrink-0 ml-2">{kpi.icon}</div>
                  </div>
                ))}
              </div>

              {/* CHARTS CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                
                {/* Recharts Bar: Exam cohort requests */}
                <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Exam Category Demands</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Live Aggregated Metrics</span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.examStats || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ChartTooltip />
                        <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Turnaround Rate Gauge */}
                <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Turnaround Insights</h3>
                    <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">CRM</span>
                  </div>

                  <div className="space-y-4 text-center py-6">
                    <div className="text-4xl font-black text-slate-950 font-mono">{analytics?.conversionRate ?? "0"}%</div>
                    <p className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">COMPLETION CONVERSION RATE</p>
                    <p className="text-slate-600 text-xs max-w-xs mx-auto px-2 leading-relaxed">
                      Median CRM coupon response turnaround stands at <strong>{analytics?.turnaroundHours ?? "1"} hours</strong>.
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 font-mono uppercase">
                    Ambassador Campaign Trackers
                  </div>
                </div>
              </div>

              {/* RECENT REQUESTS TABLE PREVIEW */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Incoming Student Requests</h3>
                  <button onClick={() => setActiveTab("LEADS")} className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center space-x-1">
                    <span>Manage all</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-x-auto min-w-full">
                  <table className="min-w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-mono border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 whitespace-nowrap">Lead ID</th>
                        <th className="px-6 py-3 whitespace-nowrap">Student Name</th>
                        <th className="px-6 py-3 whitespace-nowrap">Target Exam</th>
                        <th className="px-6 py-3 whitespace-nowrap">Status</th>
                        <th className="px-6 py-3 whitespace-nowrap">Registered Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.slice(0, 5).map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">{l.LeadID}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">{l.Name}</td>
                          <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">{l.Exam}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(l.LeadStatus)}`}>
                              {l.LeadStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{new Date(l.CreatedAt).toLocaleDateString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS LIST VIEW */}
          {activeTab === "LEADS" && (
            <div className="space-y-6">
              
              {/* FILTERS TOOLBAR */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center w-full">
                  
                  {/* Search bar */}
                  <div className="relative w-full sm:min-w-[240px] sm:flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search Student, Phone, ID..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && fetchLeads()}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:bg-white focus:border-red-600 outline-none w-full"
                    />
                  </div>

                  {/* Status selection */}
                  <select
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setTimeout(fetchLeads, 100); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none w-full sm:w-auto"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NEW">New Requests</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="WAITING_STUDENT">OTP Waiting</option>
                    <option value="COUPON_DELIVERED">Delivered</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  {/* Exam selection */}
                  <select
                    value={filterExam}
                    onChange={e => { setFilterExam(e.target.value); setTimeout(fetchLeads, 100); }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none w-full sm:w-auto"
                  >
                    <option value="ALL">All Exams</option>
                    <option value="JEE">IIT JEE</option>
                    <option value="NEET">NEET Medical</option>
                    <option value="Class 9-10 Foundation">Foundation</option>
                  </select>

                  <button
                    onClick={fetchLeads}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 w-full sm:w-auto"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* MAIN LEADS DATA TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-w-full">
                  <table className="min-w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-mono border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Request ID</th>
                        <th className="px-6 py-4 whitespace-nowrap">Student Info</th>
                        <th className="px-6 py-4 whitespace-nowrap">Target Exam / Batch</th>
                        <th className="px-6 py-4 whitespace-nowrap">Credentials</th>
                        <th className="px-6 py-4 whitespace-nowrap">Current Status</th>
                        <th className="px-6 py-4 whitespace-nowrap">Last Updated</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leadsLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 font-medium space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600" />
                            <span>Fetching secure database logs...</span>
                          </td>
                        </tr>
                      ) : leads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                            No student requests found matching filter parameters.
                          </td>
                        </tr>
                      ) : (
                        leads.map((l, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">{l.LeadID}</td>
                            <td className="px-6 py-4 space-y-1 whitespace-nowrap">
                              <p className="font-extrabold text-slate-950">{l.Name}</p>
                              <p className="text-slate-400 font-mono text-[10px]">{l.Phone} | {l.Email}</p>
                            </td>
                            <td className="px-6 py-4 space-y-1 whitespace-nowrap">
                              <p className="font-bold text-slate-900">{l.Course}</p>
                              <p className="text-slate-400 text-[10px] font-mono">{l.Exam} | {l.Language}</p>
                            </td>
                            <td className="px-6 py-4 space-y-1 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${l.ExistingPWUser ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                                {l.ExistingPWUser ? "Existing PW Account" : "New PW Account"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${getStatusBadgeClass(l.LeadStatus)}`}>
                                {l.LeadStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono whitespace-nowrap">
                              {new Date(l.UpdatedAt).toLocaleDateString("en-IN")}
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleOpenLeadDrawer(l)}
                                className="text-red-600 hover:text-red-700 text-xs font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200"
                              >
                                Review Request
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KANBAN BOARD VIEW */}
          {activeTab === "KANBAN" && (
            <div className="space-y-6">
              <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory md:grid md:grid-cols-4 lg:gap-6">
                {[
                  { title: "New Requests", status: LeadStatus.NEW },
                  { title: "Under Review", status: LeadStatus.UNDER_REVIEW },
                  { title: "OTP Queue Pending", status: LeadStatus.WAITING_STUDENT },
                  { title: "Coupon Completed", status: LeadStatus.COUPON_DELIVERED }
                ].map((column, cIdx) => {
                  const columnLeads = leads.filter(l => l.LeadStatus === column.status);
                  return (
                    <div key={cIdx} className="bg-slate-100/60 p-4 rounded-2xl border border-slate-200/60 space-y-4 w-[280px] sm:w-[320px] shrink-0 snap-start md:w-auto">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{column.title}</h4>
                        <span className="font-mono text-xs font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                          {columnLeads.length}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {columnLeads.map((l, lIdx) => (
                          <div
                            key={lIdx}
                            onClick={() => handleOpenLeadDrawer(l)}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-red-500 cursor-pointer transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-mono text-[9px] font-bold text-slate-400">{l.LeadID}</span>
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                l.Priority === Priority.HIGH || l.Priority === Priority.URGENT ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"
                              }`}>
                                {l.Priority}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{l.Name}</h5>
                              <p className="text-[10px] text-slate-500 truncate">{l.Course}</p>
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              Sub: {new Date(l.CreatedAt).toLocaleDateString("en-IN")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: OTP EXCLUSIVE QUEUE */}
          {activeTab === "OTP" && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200/60 p-6 rounded-2xl flex items-start space-x-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Student OTP Pending Queue</h3>
                  <p className="text-slate-600 text-xs">
                    These requests require student account authentication to finalize coupon mapping. Coordinate with the student via WhatsApp, apply the mapped campaign inside the official PW dashboard, and deliver the coupon.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {leads.filter(l => l.LeadStatus === LeadStatus.WAITING_STUDENT).map((l, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-400">{l.LeadID}</span>
                        <h4 className="text-md font-bold text-slate-900">{l.Name}</h4>
                      </div>
                      <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                        Awaiting Student OTP
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</p>
                        <p className="font-mono font-bold text-slate-950">{l.Phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Target Batch</p>
                        <p className="font-bold text-slate-950 truncate">{l.Course}</p>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <a
                        href={`https://wa.me/91${l.Phone}?text=Hello%20${l.Name},%20your%20PW%20Coupon%20request%20${l.LeadID}%20is%20pending.%20Please%20provide%20the%20mapping%20OTP%20to%20apply%20your%20discount.`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat WhatsApp</span>
                      </a>
                      <button
                        onClick={() => handleOpenLeadDrawer(l)}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1"
                      >
                        <span>Update Status</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM LOGS VIEWER */}
          {activeTab === "LOGS" && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Audit Logs */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Admin Audit Trails</h3>
                  <div className="space-y-3.5 max-h-[400px] overflow-y-auto">
                    {logs.auditLogs.map((log: any, idx: number) => (
                      <div key={idx} className="text-xs space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{new Date(log.Timestamp).toLocaleString("en-IN")}</span>
                          <span>{log.User}</span>
                        </div>
                        <p className="font-bold text-slate-900">{log.Action}</p>
                        <p className="text-[11px] text-slate-500">Request: <strong className="font-mono text-red-600">{log.RequestID}</strong></p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Logs */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Gmail Dispatch Records</h3>
                  <div className="space-y-3.5 max-h-[400px] overflow-y-auto">
                    {logs.emailLogs.map((log: any, idx: number) => (
                      <div key={idx} className="text-xs space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{new Date(log.SentTime).toLocaleString("en-IN")}</span>
                          <span className={log.Status === "SUCCESS" ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                            {log.Status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 truncate">{log.Subject}</p>
                        <p className="text-[11px] text-slate-500">Recipient: <span className="font-mono">{log.Recipient}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM SETTINGS MODULE */}
          {activeTab === "SETTINGS" && (
            <div className="max-w-xl space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Spreadsheet Connection Configuration</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Linked Spreadsheet ID</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Enter Google Sheets Spreadsheet ID manually"
                        value={dbStatus?.spreadsheetId || spreadsheetIdInput}
                        onChange={e => setSpreadsheetIdInput(e.target.value)}
                        disabled={!!dbStatus?.spreadsheetId}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white outline-none flex-1 font-mono"
                      />
                      {!dbStatus?.spreadsheetId && (
                        <button
                          onClick={handleConnectSheetId}
                          disabled={setupLoading || !spreadsheetIdInput}
                          className="bg-slate-900 hover:bg-slate-850 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>

                  {!dbStatus?.spreadsheetId ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-slate-500 leading-normal">
                        Alternatively, let the CRM provision the Spreadsheet and Sheets headers completely automatically on your behalf:
                      </p>
                      <button
                        onClick={handleAutoSheetsSetup}
                        disabled={setupLoading}
                        className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-transform active:scale-95 shadow-md shadow-red-600/15"
                      >
                        {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        <span>Automatically Setup Google Sheet Database</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                      <p className="text-xs text-emerald-800 font-bold">✓ CRM Spreadsheet Syncing Active</p>
                      <p className="text-[11px] text-emerald-600 leading-normal">
                        All incoming coupon requests, updates, notes history, and log trails are automatically written to Google Sheet Database ID: <strong className="font-mono text-slate-900">{dbStatus.spreadsheetId}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* HEALTH CONTROL CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">System Performance & Health</h3>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">ACTIVE VERSION</span>
                    <p className="font-mono font-bold text-slate-900">v{dbStatus?.version || "2.0.0"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">TIMEZONE CONFIG</span>
                    <p className="font-bold text-slate-900">{dbStatus?.timezone || "Asia/Kolkata"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* LEAD DETAILED REVIEW DRAWER (SLIDING RIGHT SIDEBAR) */}
      {selectedLead && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex justify-end"
          onClick={() => setSelectedLead(null)}
        >
          <div 
            className="bg-white w-full max-w-lg h-full shadow-2xl relative flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            
            {/* FIXED HEADER */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-slate-50/50">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400">{selectedLead.LeadID}</span>
                <h3 className="text-md sm:text-lg font-black text-slate-950 leading-tight">{selectedLead.Name}</h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-900 font-bold text-md sm:text-lg p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0 ml-4"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Student Academic & Contact Details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/60 leading-normal">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Phone Link</p>
                  <p className="font-mono font-bold text-slate-900">{selectedLead.Phone}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Email Address</p>
                  <p className="font-mono font-bold text-slate-900 truncate">{selectedLead.Email}</p>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-1">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Target Batch / Cohort</p>
                  <p className="font-bold text-slate-950">{selectedLead.Course} ({selectedLead.Exam})</p>
                </div>
                {selectedLead.Remarks && (
                  <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Student Original Note</p>
                    <p className="text-slate-600 font-medium italic">"{selectedLead.Remarks}"</p>
                  </div>
                )}
              </div>

              {/* CRM Update Operations Panel */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">Ambassador CRM Actions</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Update Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as LeadStatus)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="NEW">NEW</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="WAITING_STUDENT">WAITING FOR STUDENT OTP</option>
                      <option value="COUPON_DELIVERED">COUPON DELIVERED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Priority Rating</label>
                    <select
                      value={editPriority}
                      onChange={e => setEditPriority(e.target.value as Priority)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label htmlFor="otp-required-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">OTP Processing Required?</label>
                    <input
                      type="checkbox"
                      id="otp-required-checkbox"
                      checked={editOtpRequired}
                      onChange={e => setEditOtpRequired(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                  </div>
                  {editOtpRequired && (
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                      <label htmlFor="otp-received-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Has Student Provided OTP?</label>
                      <input
                        type="checkbox"
                        id="otp-received-checkbox"
                        checked={editOtpReceived}
                        onChange={e => setEditOtpReceived(e.target.checked)}
                        className="accent-red-600 rounded"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Apply Personalized Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AMB_600_COUPON"
                    value={editCouponCode}
                    onChange={e => setEditCouponCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono font-bold uppercase focus:bg-white outline-none"
                  />
                  <div className="flex items-center space-x-2 pt-1.5">
                    <input
                      type="checkbox"
                      id="coupon-delivered-checkbox"
                      checked={editCouponDelivered}
                      onChange={e => setEditCouponDelivered(e.target.checked)}
                      className="accent-red-600 rounded"
                    />
                    <label htmlFor="coupon-delivered-checkbox" className="text-[11px] text-slate-500 cursor-pointer select-none">Mark Coupon as Delivered successfully?</label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Ambassador Internal CRM Remarks</label>
                  <textarea
                    placeholder="e.g. Student OTP verified. Delivered campaign batch coupon successfully."
                    value={editRemarks}
                    onChange={e => setEditRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs h-20 outline-none resize-none focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="p-6 border-t border-slate-100 flex space-x-3 bg-slate-50/50 shrink-0">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-xs font-bold transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleUpdateLead}
                className="w-2/3 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-red-600/10"
              >
                <Check className="w-4 h-4" />
                <span>Save CRM Update</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
