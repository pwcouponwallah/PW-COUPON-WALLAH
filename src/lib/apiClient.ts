import { Lead, LeadStatus, Priority, StatusHistoryEntry, EmailLog, AuditLog, ErrorLog } from "../types";

// Detect if we should use fallback (GitHub Pages or standalone static host)
const IS_STATIC_HOST = 
  window.location.hostname.endsWith("github.io") || 
  window.location.hostname.includes("vercel.app") ||
  window.location.hostname.includes("netlify.app");

let useStaticMock = IS_STATIC_HOST;

// Check if server is running. If not, fallback to static mock
fetch("/api/health")
  .then(res => {
    if (!res.ok) useStaticMock = true;
  })
  .catch(() => {
    useStaticMock = true;
  });

/**
 * Initialize default local storage DB for static mock mode
 */
const STORAGE_KEYS = {
  LEADS: "pw_crm_leads",
  HISTORY: "pw_crm_history",
  EMAIL_LOGS: "pw_crm_email_logs",
  AUDIT_LOGS: "pw_crm_audit_logs",
  ERROR_LOGS: "pw_crm_error_logs",
  CONFIG: "pw_crm_config"
};

const defaultLeads: Lead[] = [
  {
    LeadID: "PW202607160001",
    RequestDate: "2026-07-16T12:00:00Z",
    Name: "Aarav Sharma",
    Phone: "9876543210",
    Email: "aarav.sharma@example.com",
    Exam: "JEE",
    Course: "Lakshya JEE 2027",
    TargetYear: "2027",
    Language: "Hindi/English",
    PurchaseTimeline: "Immediate",
    ExistingPWUser: false,
    LeadStatus: LeadStatus.NEW,
    Priority: Priority.MEDIUM,
    OTPRequired: false,
    OTPReceived: false,
    CouponGenerated: "",
    CouponDelivered: false,
    Completed: false,
    CreatedBy: "Student",
    CreatedAt: "2026-07-16T12:00:00Z",
    UpdatedAt: "2026-07-16T12:00:00Z",
    LastEmail: "Request Received",
    LastStatusChange: "2026-07-16T12:00:00Z",
    Remarks: "Looking for maximum batch discount."
  },
  {
    LeadID: "PW202607160002",
    RequestDate: "2026-07-16T14:30:00Z",
    Name: "Ananya Patel",
    Phone: "8765432109",
    Email: "ananya.patel@example.com",
    Exam: "NEET",
    Course: "Yakeen NEET 2027",
    TargetYear: "2027",
    Language: "English",
    PurchaseTimeline: "Within 3 days",
    ExistingPWUser: true,
    LeadStatus: LeadStatus.WAITING_STUDENT,
    Priority: Priority.HIGH,
    OTPRequired: true,
    OTPReceived: false,
    CouponGenerated: "",
    CouponDelivered: false,
    Completed: false,
    CreatedBy: "Student",
    CreatedAt: "2026-07-16T14:30:00Z",
    UpdatedAt: "2026-07-16T14:35:00Z",
    LastEmail: "OTP Action Required",
    LastStatusChange: "2026-07-16T14:35:00Z",
    Remarks: "Existing user, requires OTP coupon generation."
  }
];

const defaultHistory: StatusHistoryEntry[] = [
  {
    LeadID: "PW202607160002",
    OldStatus: "NEW",
    NewStatus: "WAITING_STUDENT",
    Time: "2026-07-16T14:35:00Z",
    UpdatedBy: "Admin",
    Remarks: "Need OTP to generate coupon on PW Dashboard."
  }
];

const defaultEmailLogs: EmailLog[] = [
  {
    Recipient: "aarav.sharma@example.com",
    Subject: "Your PW Coupon Request PW202607160001 Received",
    SentTime: "2026-07-16T12:01:00Z",
    Status: "SUCCESS"
  }
];

const defaultAuditLogs: AuditLog[] = [
  {
    Timestamp: "2026-07-16T14:35:00Z",
    User: "Admin",
    Action: "Status Change to WAITING_STUDENT",
    RequestID: "PW202607160002",
    PreviousValue: "NEW",
    NewValue: "WAITING_STUDENT",
    Browser: "Chrome (Static Sandbox)",
    IP: "127.0.0.1"
  }
];

function getLocalData<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
}

function setLocalData<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Ensure local storage is seeded in static fallback mode
if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
  setLocalData(STORAGE_KEYS.LEADS, defaultLeads);
  setLocalData(STORAGE_KEYS.HISTORY, defaultHistory);
  setLocalData(STORAGE_KEYS.EMAIL_LOGS, defaultEmailLogs);
  setLocalData(STORAGE_KEYS.AUDIT_LOGS, defaultAuditLogs);
  setLocalData(STORAGE_KEYS.ERROR_LOGS, []);
  setLocalData(STORAGE_KEYS.CONFIG, {
    spreadsheetId: "1mock-Spreadsheet-ID-for-GitHub-Pages-Demo",
    brandName: "PW Coupon Wallah (Demo)",
    supportEmail: "pwcouponwallah@gmail.com",
    timezone: "Asia/Kolkata",
    version: "2.0.0-SPA"
  });
}

/**
 * Custom Fetch Interceptor
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!useStaticMock) {
    // Standard full-stack network request
    return fetch(url, options);
  }

  // Handle static local CRM simulation (for GitHub Pages deployment compatibility)
  console.log(`[apiClient] Static fallback interceptor routing: ${url}`);
  
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate minor network latency

  const path = url.replace(/^\/api/, "");
  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. HEALTH CHECK
  if (path === "/health") {
    const config = getLocalData<any>(STORAGE_KEYS.CONFIG, { spreadsheetId: "mock" });
    const leads = getLocalData<Lead[]>(STORAGE_KEYS.LEADS, []);
    return new Response(JSON.stringify({
      status: "ok",
      sheetsConnected: true,
      spreadsheetId: config.spreadsheetId,
      leadsCount: leads.length,
      timezone: config.timezone || "Asia/Kolkata",
      version: config.version || "2.0.0-SPA",
      brandName: config.brandName || "PW Coupon Wallah (Demo)"
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 2. COURSE BATCH RECOMMENDATION
  if (path === "/gemini/recommend") {
    const { exam, currentClass, targetYear, language } = body;
    const isNEET = String(exam).toUpperCase().includes("NEET");
    const recommendedBatch = isNEET ? "Yakeen NEET 2027" : "Lakshya JEE 2027";
    const reasoning = `Based on your selection for ${exam} (${language || "Hinglish"}) with target year ${targetYear || "2027"}, we recommend enrolling in the official Physics Wallah "${recommendedBatch}" series. It includes daily interactive live lectures, exhaustive syllabus coverage, customized study packages, and peer discussion portals. This recommended batch fits your learning pace and academic goals perfectly.`;
    const discountTidbit = "Your designated ambassador code can grant you a high-tier direct cohort discount on this recommended course.";

    return new Response(JSON.stringify({ recommendedBatch, reasoning, discountTidbit }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 3. SECURE SHEET CONFIGURATION & AUTOMATED PROVISIONING
  if (path === "/sheets/setup" || path === "/sheets/save") {
    const spreadsheetId = body.spreadsheetId || "1mock-Spreadsheet-ID-for-GitHub-Pages-Demo";
    const config = getLocalData<any>(STORAGE_KEYS.CONFIG, {});
    config.spreadsheetId = spreadsheetId;
    setLocalData(STORAGE_KEYS.CONFIG, config);

    return new Response(JSON.stringify({ success: true, spreadsheetId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 4. REQUEST OFFICIAL COUPON
  if (path === "/leads/create") {
    const leads = getLocalData<Lead[]>(STORAGE_KEYS.LEADS, []);
    
    // Duplicate check
    const activeDuplicate = leads.find(
      l => l.Phone === body.phone && 
      l.LeadStatus !== LeadStatus.CLOSED && 
      l.LeadStatus !== LeadStatus.CANCELLED
    );

    if (activeDuplicate) {
      return new Response(JSON.stringify({
        duplicate: true,
        requestId: activeDuplicate.LeadID,
        message: `An active request already exists. Track using your Request ID: ${activeDuplicate.LeadID}`
      }), { status: 409, headers: { "Content-Type": "application/json" } });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const LeadID = `PW${dateStr}${String(leads.length + 1).padStart(4, "0")}`;

    const newLead: Lead = {
      LeadID,
      RequestDate: new Date().toISOString(),
      Name: body.name,
      Phone: body.phone,
      Email: body.email,
      Exam: body.exam,
      Course: body.course,
      TargetYear: body.targetYear || "2027",
      Language: body.language || "Hindi/English",
      PurchaseTimeline: body.purchaseTimeline || "Immediate",
      ExistingPWUser: !!body.existingPwUser,
      LeadStatus: LeadStatus.NEW,
      Priority: Priority.MEDIUM,
      OTPRequired: !!body.existingPwUser,
      OTPReceived: false,
      CouponGenerated: "",
      CouponDelivered: false,
      Completed: false,
      CreatedBy: "Student",
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      LastEmail: "Request Received",
      LastStatusChange: new Date().toISOString(),
      Remarks: body.remarks || ""
    };

    leads.push(newLead);
    setLocalData(STORAGE_KEYS.LEADS, leads);

    // Logs
    const emailLogs = getLocalData<EmailLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);
    emailLogs.push({
      Recipient: body.email,
      Subject: `[PW Coupon Wallah] Official Request Received - ${LeadID}`,
      SentTime: new Date().toISOString(),
      Status: "SUCCESS"
    });
    setLocalData(STORAGE_KEYS.EMAIL_LOGS, emailLogs);

    const auditLogs = getLocalData<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    auditLogs.push({
      Timestamp: new Date().toISOString(),
      User: "Student",
      Action: "Created Coupon Request",
      RequestID: LeadID,
      PreviousValue: "None",
      NewValue: "NEW",
      Browser: "Chrome (Static Sandbox)",
      IP: "127.0.0.1"
    });
    setLocalData(STORAGE_KEYS.AUDIT_LOGS, auditLogs);

    return new Response(JSON.stringify({
      success: true,
      message: "Coupon request submitted successfully",
      requestId: LeadID
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 5. TRACK REQUEST PORTAL
  if (path === "/leads/track") {
    const leads = getLocalData<Lead[]>(STORAGE_KEYS.LEADS, []);
    const { requestId, identifier } = body;

    const lead = leads.find(
      l => l.LeadID === requestId && (l.Phone === identifier || l.Email.toLowerCase() === identifier.toLowerCase())
    );

    if (!lead) {
      return new Response(JSON.stringify({ error: "No matching record found. Please verify details." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const history = getLocalData<StatusHistoryEntry[]>(STORAGE_KEYS.HISTORY, []).filter(h => h.LeadID === requestId);

    const timeline = [
      {
        stage: "Request Received",
        status: "completed",
        time: lead.CreatedAt,
        remarks: "We received your request. Reviewing eligibility on PW dashboard."
      },
      {
        stage: "Under Ambassador Review",
        status: lead.LeadStatus !== LeadStatus.NEW ? "completed" : "pending",
        time: lead.LeadStatus !== LeadStatus.NEW ? lead.UpdatedAt : null,
        remarks: "Ambassador is active. Cross-checking batch coupon campaigns."
      },
      {
        stage: "OTP Verification (If Applicable)",
        status: lead.OTPRequired ? (lead.OTPReceived ? "completed" : "warning") : "skipped",
        time: lead.OTPReceived ? lead.UpdatedAt : null,
        remarks: lead.OTPRequired 
          ? (lead.OTPReceived ? "OTP verified. Official coupon in generation." : "Action required: Contact ambassador on WhatsApp to share login OTP.")
          : "Not required for this discount tier."
      },
      {
        stage: "Coupon Generated & Delivered",
        status: lead.CouponDelivered ? "completed" : (lead.LeadStatus === LeadStatus.CANCELLED ? "failed" : "pending"),
        time: lead.CouponDelivered ? lead.UpdatedAt : null,
        remarks: lead.CouponDelivered 
          ? `SUCCESS! Your official personalized code is: ${lead.CouponGenerated || "Verified via WhatsApp"}.`
          : (lead.LeadStatus === LeadStatus.CANCELLED ? "Request cancelled." : "Awaiting coupon generation.")
      }
    ];

    return new Response(JSON.stringify({ lead, history, timeline }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 6. RETRIEVE ALL LEADS
  if (path === "/leads/list" || path === "/leads/list/") {
    const leads = getLocalData<Lead[]>(STORAGE_KEYS.LEADS, []);
    return new Response(JSON.stringify(leads), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 7. UPDATE LEAD STATUS
  if (path === "/leads/update") {
    const leads = getLocalData<Lead[]>(STORAGE_KEYS.LEADS, []);
    const leadIndex = leads.findIndex(l => l.LeadID === body.leadId);

    if (leadIndex === -1) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const oldLead = leads[leadIndex];
    const oldStatus = oldLead.LeadStatus;

    const updatedLead: Lead = {
      ...oldLead,
      LeadStatus: body.status || oldLead.LeadStatus,
      Priority: body.priority || oldLead.Priority,
      CouponGenerated: body.couponCode !== undefined ? body.couponCode.trim() : oldLead.CouponGenerated,
      Remarks: body.remarks !== undefined ? body.remarks.trim() : oldLead.Remarks,
      OTPRequired: body.otpRequired !== undefined ? !!body.otpRequired : oldLead.OTPRequired,
      OTPReceived: body.otpReceived !== undefined ? !!body.otpReceived : oldLead.OTPReceived,
      CouponDelivered: body.couponDelivered !== undefined ? !!body.couponDelivered : oldLead.CouponDelivered,
      Completed: body.status === LeadStatus.COMPLETED || body.status === LeadStatus.COUPON_DELIVERED ? true : oldLead.Completed,
      UpdatedAt: new Date().toISOString()
    };

    leads[leadIndex] = updatedLead;
    setLocalData(STORAGE_KEYS.LEADS, leads);

    if (body.status && body.status !== oldStatus) {
      const history = getLocalData<StatusHistoryEntry[]>(STORAGE_KEYS.HISTORY, []);
      history.push({
        LeadID: body.leadId,
        OldStatus: oldStatus,
        NewStatus: body.status,
        Time: new Date().toISOString(),
        UpdatedBy: "Admin",
        Remarks: body.remarks || `Status transitioned to ${body.status}`
      });
      setLocalData(STORAGE_KEYS.HISTORY, history);

      // Email log
      const emailLogs = getLocalData<EmailLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);
      emailLogs.push({
        Recipient: updatedLead.Email,
        Subject: `[PW Coupon Wallah] Progress Update - Request ${body.leadId}`,
        SentTime: new Date().toISOString(),
        Status: "SUCCESS"
      });
      setLocalData(STORAGE_KEYS.EMAIL_LOGS, emailLogs);
    }

    const auditLogs = getLocalData<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    auditLogs.push({
      Timestamp: new Date().toISOString(),
      User: "Admin",
      Action: `Updated Lead ${body.leadId}`,
      RequestID: body.leadId,
      PreviousValue: oldStatus,
      NewValue: body.status || oldLead.LeadStatus,
      Browser: "Chrome (Static Sandbox)",
      IP: "127.0.0.1"
    });
    setLocalData(STORAGE_KEYS.AUDIT_LOGS, auditLogs);

    return new Response(JSON.stringify({ success: true, lead: updatedLead }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 8. RETRIEVE ANALYTICS SUMMARY
  if (path === "/analytics") {
    const leads = getLocalData<Lead[]>(STORAGE_KEYS.LEADS, []);
    const total = leads.length;
    const completed = leads.filter(l => l.Completed || l.LeadStatus === LeadStatus.COMPLETED).length;
    const pending = leads.filter(l => l.LeadStatus !== LeadStatus.COMPLETED && l.LeadStatus !== LeadStatus.CLOSED && l.LeadStatus !== LeadStatus.CANCELLED).length;
    const otpQueue = leads.filter(l => l.LeadStatus === LeadStatus.WAITING_STUDENT).length;

    const exams = { JEE: 0, NEET: 0, Class9_10: 0, Others: 0 };
    leads.forEach(l => {
      const e = l.Exam ? l.Exam.toUpperCase() : "OTHERS";
      if (e.includes("JEE")) exams.JEE++;
      else if (e.includes("NEET")) exams.NEET++;
      else if (e.includes("9") || e.includes("10")) exams.Class9_10++;
      else exams.Others++;
    });

    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return new Response(JSON.stringify({
      total,
      completed,
      pending,
      otpQueue,
      conversionRate,
      turnaroundHours: 4,
      examStats: [
        { name: "IIT JEE", value: exams.JEE },
        { name: "NEET", value: exams.NEET },
        { name: "Foundation (9-10)", value: exams.Class9_10 },
        { name: "Other Batches", value: exams.Others }
      ],
      recentTrends: leads.slice(0, 10).map(l => ({
        date: new Date(l.CreatedAt).toLocaleDateString("en-IN"),
        name: l.Name,
        exam: l.Exam,
        status: l.LeadStatus
      }))
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 9. LOGS
  if (path === "/logs") {
    return new Response(JSON.stringify({
      auditLogs: getLocalData(STORAGE_KEYS.AUDIT_LOGS, []).slice(-100).reverse(),
      emailLogs: getLocalData(STORAGE_KEYS.EMAIL_LOGS, []).slice(-100).reverse(),
      errorLogs: getLocalData(STORAGE_KEYS.ERROR_LOGS, []).slice(-100).reverse()
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // 10. FORCE SYNC
  if (path === "/sheets/sync") {
    return new Response(JSON.stringify({ success: true, message: "Database synchronized successfully with Google Sheets." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
}
