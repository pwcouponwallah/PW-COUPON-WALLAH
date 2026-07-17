import express from "express";
import * as path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

import {
  initDB,
  readDB,
  writeDB,
  readConfig,
  writeConfig,
  logError,
  logAudit,
  createGoogleSpreadsheet,
  fetchLeadsFromSheets,
  appendToGoogleSheet,
  sendGmailEmail,
  syncToGoogleSheets
} from "./server-db";
import { Lead, LeadStatus, Priority, StatusHistoryEntry } from "./src/types";

import { EmailService } from "./src/services/EmailService";
import { GoogleSheetService } from "./src/services/GoogleSheetService";
import { ErrorHandler } from "./src/services/ErrorHandler";
import { SecurityMiddleware } from "./src/services/SecurityMiddleware";

dotenv.config();

// Register global uncaught and promise rejection error listeners
ErrorHandler.registerGlobalListeners();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up security headers, input sanitization, and global basic rate limit
app.use(SecurityMiddleware.securityHeaders);
app.use(SecurityMiddleware.sanitizeInput);
app.use(SecurityMiddleware.rateLimiter(2000, 15 * 60 * 1000)); // 2000 requests per 15 minutes limit generally

// Initialize Local Files
initDB();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});

// Helper: Generate Sequential Request ID
function generateRequestID(leads: Lead[]): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20260716
  const prefix = `PW${dateStr}`;
  
  // Count matching date prefix to generate sequential order
  const todayLeads = leads.filter(l => l.LeadID.startsWith(prefix));
  const seq = String(todayLeads.length + 1).padStart(4, "0");
  
  return `${prefix}${seq}`;
}

// Transactional HTML Email Template Builder
function buildEmailHTML(studentName: string, requestId: string, status: string, details: string): string {
  const brand = "PW Coupon Wallah";
  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1e8ed; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #ef4444; padding-bottom: 16px;">
        <h1 style="color: #dc2626; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">🎯 PW Coupon Wallah</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Official Student Assistance Portal & Ambassador CRM</p>
      </div>
      <div style="margin-bottom: 24px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 600;">Dear ${studentName},</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">Your official personalized Physics Wallah (PW) coupon request is updated!</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; padding: 4px 0; width: 120px; font-weight: 500;">Request ID:</td>
              <td style="color: #0f172a; padding: 4px 0; font-weight: 700; font-family: monospace;">${requestId}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0; font-weight: 500;">Current Status:</td>
              <td style="color: #2563eb; padding: 4px 0; font-weight: 700;">${status}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">${details}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0 20px 0;">
        <a href="https://pw-coupon-wallah.vercel.app/" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Track Request Progress</a>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center;">
        <p style="margin: 0 0 4px 0;">This is an official transactional message sent by your PW Campus Ambassador.</p>
        <p style="margin: 0;">For immediate support, please contact the ambassador via the assistance portal.</p>
        <p style="margin: 8px 0 0 0; font-weight: 500; color: #64748b;">© 2026 PW Coupon Wallah. All student rights protected.</p>
      </div>
    </div>
  `;
}

// 1. HEALTH CHECK & STATUS
app.get("/api/health", (req, res) => {
  const config = readConfig();
  const db = readDB();
  res.json({
    status: "ok",
    sheetsConnected: !!config.spreadsheetId,
    spreadsheetId: config.spreadsheetId,
    leadsCount: db.leads.length,
    timezone: config.timezone,
    version: config.version,
    brandName: config.brandName
  });
});

// 2. GEMINI COURSE BATCH RECOMMENDATION SYSTEM
app.post("/api/gemini/recommend", async (req, res) => {
  const { exam, currentClass, targetYear, language, mode, budget } = req.body;
  
  if (!exam) {
    return res.status(400).json({ error: "Exam selection is required" });
  }

  try {
    const prompt = `
      Recommend the perfect Physics Wallah (PW) batch based on the following details:
      - Exam: ${exam}
      - Current Class: ${currentClass || "Not specified"}
      - Target Year: ${targetYear || "Not specified"}
      - Preferred Language: ${language || "Hindi/English mixed (Hinglish)"}
      - Mode of Study: ${mode || "Online"}
      - Approximate Budget: ${budget || "Not specified"}

      Please provide a response structured as JSON with:
      - "recommendedBatch": A short, elegant name of the recommended PW batch series (e.g. "Lakshya JEE", "Yakeen NEET", "Arjuna", "Udaan", "Pathshala", "Vidyapeeth").
      - "reasoning": A professional, 2-paragraph guiding explanation of why this batch fits their specific background, the structure of courses, language alignment, and purchase recommendation.
      - "discountTidbit": A brief, comforting advice note about eligibility for personalized official ambassador coupons (maximum 2 sentences).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedBatch: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            discountTidbit: { type: Type.STRING }
          },
          required: ["recommendedBatch", "reasoning", "discountTidbit"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err) {
    logError("GeminiAI", "recommend", err);
    res.status(500).json({
      error: "AI recommendation is currently unavailable. Please review the batches directly.",
      details: String(err)
    });
  }
});

// Helper to verify that the Google OAuth access token belongs specifically to pwcouponwallah@gmail.com
async function verifyGoogleAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (!response.ok) {
      console.warn(`[verifyGoogleAdminToken] Token info response not OK: ${response.status} ${response.statusText}`);
      return false;
    }
    const data = await response.json();
    const email = data.email || data.user_email;
    const isAuthorized = !!(email && email.toLowerCase() === "pwcouponwallah@gmail.com");
    if (isAuthorized) {
      const config = readConfig();
      if (config.googleAccessToken !== token) {
        config.googleAccessToken = token;
        writeConfig(config);
        console.log("[verifyGoogleAdminToken] Automatically refreshed server googleAccessToken in config.");
      }
    }
    return isAuthorized;
  } catch (err) {
    console.error("[verifyGoogleAdminToken] Error checking google access token:", err);
    return false;
  }
}

// 3. SECURE SHEET CONFIGURATION & AUTOMATED PROVISIONING
app.post("/api/sheets/setup", async (req, res, next) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Valid Google Access Token is required for database setup" });
  }

  try {
    const isAuthorized = await verifyGoogleAdminToken(token);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access Denied: Only pwcouponwallah@gmail.com is authorized to access admin features." });
    }

    const spreadsheetId = await GoogleSheetService.setup(token);
    logAudit("Admin", "Google Sheets Database Automatically Provisioned", "SYSTEM", "Local Files", spreadsheetId, req);
    res.json({ success: true, spreadsheetId });
  } catch (err: any) {
    next(err);
  }
});

// Save existing Spreadsheet ID manually
app.post("/api/sheets/save", async (req, res) => {
  const { spreadsheetId, token } = req.body;
  if (!spreadsheetId) {
    return res.status(400).json({ error: "Spreadsheet ID is required" });
  }

  try {
    const isAuthorized = await verifyGoogleAdminToken(token);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access Denied: Only pwcouponwallah@gmail.com is authorized to access admin features." });
    }

    const config = readConfig();
    config.spreadsheetId = spreadsheetId;
    if (token) config.googleAccessToken = token;
    writeConfig(config);

    if (token) {
      // Trigger background sync
      syncToGoogleSheets(spreadsheetId, token).catch(e => console.error("Sync failed:", e));
    }

    logAudit("Admin", "Google Sheets Database Connected Manually", "SYSTEM", "None", spreadsheetId, req);
    res.json({ success: true, spreadsheetId });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to connect manual database", details: err.message });
  }
});

// 4. STUDENT SIDE: REQUEST OFFICIAL COUPON (Strict validation and rate-limiting to 2000 requests/hour to prevent spam)
app.post(
  "/api/leads/create",
  SecurityMiddleware.rateLimiter(2000, 60 * 60 * 1000), // Max 2000 requests per hour per IP
  SecurityMiddleware.validateLeadCreation,
  async (req, res, next) => {
    const { name, phone, email, exam, course, language, targetYear, purchaseTimeline, existingPwUser, remarks } = req.body;

    try {
      // Check local duplicate leads (active leads only)
      const db = readDB();
      const config = readConfig();
      
      const activeDuplicate = db.leads.find(
        l => l.Phone === phone.trim() && 
        l.LeadStatus !== LeadStatus.CLOSED && 
        l.LeadStatus !== LeadStatus.CANCELLED
      );

      if (activeDuplicate) {
        return res.status(409).json({
          duplicate: true,
          requestId: activeDuplicate.LeadID,
          message: `An active request already exists. Track using your Request ID: ${activeDuplicate.LeadID}`
        });
      }

      // Generate Request ID
      const LeadID = generateRequestID(db.leads);

      // Build the new lead
      const newLead: Lead = {
        LeadID,
        RequestDate: new Date().toISOString(),
        Name: name.trim(),
        Phone: phone.trim(),
        Email: email.trim().toLowerCase(),
        Exam: exam,
        Course: course,
        TargetYear: targetYear || "2027",
        Language: language || "Hindi/English",
        PurchaseTimeline: purchaseTimeline || "Immediate",
        ExistingPWUser: !!existingPwUser,
        LeadStatus: LeadStatus.NEW,
        Priority: Priority.MEDIUM,
        OTPRequired: !!existingPwUser, // Existing user coupon generation requires student OTP interaction on official dashboard
        OTPReceived: false,
        CouponGenerated: "",
        CouponDelivered: false,
        Completed: false,
        CreatedBy: "Student",
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        LastEmail: "Request Received",
        LastStatusChange: new Date().toISOString(),
        Remarks: remarks ? remarks.trim() : ""
      };

      // Save locally
      db.leads.push(newLead);
      writeDB(db);

      // Save to Google Sheets if linked & token exists
      if (config.spreadsheetId && config.googleAccessToken) {
        const row = [
          newLead.LeadID, newLead.RequestDate, newLead.Name, newLead.Phone, newLead.Email,
          newLead.Exam, newLead.Course, newLead.TargetYear, newLead.Language, newLead.PurchaseTimeline,
          newLead.ExistingPWUser ? "TRUE" : "FALSE", newLead.LeadStatus, newLead.Priority,
          newLead.OTPRequired ? "TRUE" : "FALSE", newLead.OTPReceived ? "TRUE" : "FALSE",
          newLead.CouponGenerated, newLead.CouponDelivered ? "TRUE" : "FALSE", newLead.Completed ? "TRUE" : "FALSE",
          newLead.CreatedBy, newLead.CreatedAt, newLead.UpdatedAt, newLead.LastEmail, newLead.LastStatusChange, newLead.Remarks
        ];
        appendToGoogleSheet("LEADS", [row], config.googleAccessToken, config.spreadsheetId).catch(err => {
          console.error("Failed to write lead to sheets directly:", err);
        });
      }

      // Trigger confirmation Transactional Email and Admin Notification via Gmail API
      if (config.googleAccessToken) {
        // 1. Send student confirmation email containing dynamic WhatsApp message & communities
        EmailService.triggerStatusEmail(
          newLead,
          LeadStatus.NEW,
          config.googleAccessToken,
          config.brandName
        ).catch(err => {
          console.error("Failed to send student confirmation email:", err);
        });

        // 2. Send admin alert of new lead
        const adminEmail = config.adminEmail || "pwcouponwallah@gmail.com";
        EmailService.triggerAdminNotification(
          newLead,
          config.googleAccessToken,
          adminEmail,
          config.brandName
        ).catch(err => {
          console.error("Failed to send admin notification email:", err);
        });
      }

      logAudit("Student", "Created Coupon Request", LeadID, "None", "NEW", req);

      res.json({
        success: true,
        message: "Coupon request submitted successfully",
        requestId: LeadID
      });
    } catch (err) {
      next(err);
    }
  }
);

// 5. STUDENT SIDE: TRACK REQUEST PORTAL (NO PASSWORD REQUIRED)
app.post("/api/leads/track", (req, res) => {
  const { requestId, identifier } = req.body; // identifier can be Registered Mobile or Email

  if (!requestId || !identifier) {
    return res.status(400).json({ error: "Both Request ID and Registered Mobile/Email are required" });
  }

  try {
    const db = readDB();
    const lead = db.leads.find(
      l => l.LeadID === requestId && (l.Phone === identifier || l.Email.toLowerCase() === identifier.toLowerCase())
    );

    if (!lead) {
      return res.status(404).json({ error: "No matching record found. Please verify details." });
    }

    // Filter status histories for this specific lead
    const history = db.statusHistory.filter(h => h.LeadID === requestId);

    // Build timeline stages
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

    res.json({
      lead,
      history,
      timeline
    });
  } catch (err) {
    logError("Leads", "track", err);
    res.status(500).json({ error: "Failed to fetch tracking information." });
  }
});

// 6. ADMIN SIDE: RETRIEVE ALL LEADS
app.get("/api/leads/list", async (req, res) => {
  const { status, exam, priority, search, token } = req.query;

  try {
    const isAuthorized = await verifyGoogleAdminToken(token ? String(token) : undefined);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access Denied: Only pwcouponwallah@gmail.com is authorized to view leads." });
    }

    let leads: Lead[] = [];
    const config = readConfig();

    if (config.spreadsheetId && token) {
      // Sync or fetch from Google Sheets
      leads = await fetchLeadsFromSheets(config.spreadsheetId, String(token));
      // Save locally to keep in-sync
      const db = readDB();
      db.leads = leads;
      writeDB(db);
    } else {
      // Fallback local
      const db = readDB();
      leads = db.leads;
    }

    // Apply Filters
    let filtered = [...leads];

    if (status && status !== "ALL") {
      filtered = filtered.filter(l => l.LeadStatus === status);
    }
    if (exam && exam !== "ALL") {
      filtered = filtered.filter(l => l.Exam === exam);
    }
    if (priority && priority !== "ALL") {
      filtered = filtered.filter(l => l.Priority === priority);
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        l => l.LeadID.toLowerCase().includes(q) ||
        l.Name.toLowerCase().includes(q) ||
        l.Phone.includes(q) ||
        l.Email.toLowerCase().includes(q) ||
        l.Course.toLowerCase().includes(q)
      );
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());

    res.json(filtered);
  } catch (err) {
    logError("Admin", "listLeads", err);
    // Fallback to local
    const db = readDB();
    res.json(db.leads);
  }
});

// 7. ADMIN SIDE: UPDATE LEAD STATUS / LOG TRANSITION
app.post("/api/leads/update", async (req, res) => {
  const { leadId, status, priority, couponCode, remarks, otpReceived, otpRequired, couponDelivered, token } = req.body;

  const isAuthorized = await verifyGoogleAdminToken(token);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied: Only pwcouponwallah@gmail.com is authorized to update leads." });
  }

  if (!leadId) {
    return res.status(400).json({ error: "Lead ID is required" });
  }

  try {
    const db = readDB();
    const config = readConfig();
    const leadIndex = db.leads.findIndex(l => l.LeadID === leadId);

    if (leadIndex === -1) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const oldLead = db.leads[leadIndex];
    const oldStatus = oldLead.LeadStatus;

    // Apply updates
    const updatedLead: Lead = {
      ...oldLead,
      LeadStatus: status || oldLead.LeadStatus,
      Priority: priority || oldLead.Priority,
      CouponGenerated: couponCode !== undefined ? couponCode.trim() : oldLead.CouponGenerated,
      Remarks: remarks !== undefined ? remarks.trim() : oldLead.Remarks,
      OTPRequired: otpRequired !== undefined ? !!otpRequired : oldLead.OTPRequired,
      OTPReceived: otpReceived !== undefined ? !!otpReceived : oldLead.OTPReceived,
      CouponDelivered: couponDelivered !== undefined ? !!couponDelivered : oldLead.CouponDelivered,
      Completed: status === LeadStatus.COMPLETED || status === LeadStatus.COUPON_DELIVERED ? true : oldLead.Completed,
      UpdatedAt: new Date().toISOString()
    };

    // If status changed, record timeline history
    if (status && status !== oldStatus) {
      updatedLead.LastStatusChange = new Date().toISOString();
      const historyEntry: StatusHistoryEntry = {
        LeadID: leadId,
        OldStatus: oldStatus,
        NewStatus: status,
        Time: new Date().toISOString(),
        UpdatedBy: "Admin",
        Remarks: remarks || `Status transitioned to ${status}`
      };
      db.statusHistory.push(historyEntry);

      // Trigger status-specific notification emails using the centralized EmailService
      const activeToken = token || config.googleAccessToken;
      if (config.spreadsheetId && activeToken) {
        EmailService.triggerStatusEmail(
          updatedLead,
          status as LeadStatus,
          String(activeToken),
          config.brandName
        ).catch(err => {
          console.error("Failed to send transition email via EmailService:", err);
        });
      }
    }

    db.leads[leadIndex] = updatedLead;
    writeDB(db);

    // Save to Google Sheets if configured
    const activeToken = token || config.googleAccessToken;
    if (config.spreadsheetId && activeToken) {
      await syncToGoogleSheets(config.spreadsheetId, String(activeToken));
    }

    logAudit("Admin", `Updated Lead ${leadId}`, leadId, oldStatus, status || oldLead.LeadStatus, req);

    res.json({ success: true, lead: updatedLead });
  } catch (err) {
    logError("Leads", "update", err);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// 8. ADMIN SIDE: RETRIEVE ANALYTICS SUMMARY
app.get("/api/analytics", async (req, res) => {
  const token = req.query.token ? String(req.query.token) : undefined;
  const isAuthorized = await verifyGoogleAdminToken(token);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied: Only pwcouponwallah@gmail.com is authorized to view analytics." });
  }

  try {
    const db = readDB();
    const leads = db.leads;

    const total = leads.length;
    const completed = leads.filter(l => l.Completed || l.LeadStatus === LeadStatus.COMPLETED).length;
    const pending = leads.filter(l => l.LeadStatus !== LeadStatus.COMPLETED && l.LeadStatus !== LeadStatus.CLOSED && l.LeadStatus !== LeadStatus.CANCELLED).length;
    const otpQueue = leads.filter(l => l.LeadStatus === LeadStatus.WAITING_STUDENT).length;

    // Distribution by Exam
    const exams = { JEE: 0, NEET: 0, Class9_10: 0, Others: 0 };
    leads.forEach(l => {
      const e = l.Exam ? l.Exam.toUpperCase() : "OTHERS";
      if (e.includes("JEE")) exams.JEE++;
      else if (e.includes("NEET")) exams.NEET++;
      else if (e.includes("9") || e.includes("10")) exams.Class9_10++;
      else exams.Others++;
    });

    // Conversion rate
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Turnaround: average in hours for completed leads
    let turnaroundHours = 0;
    const completedLeads = leads.filter(l => l.Completed && l.CreatedAt && l.UpdatedAt);
    if (completedLeads.length > 0) {
      const totalDiff = completedLeads.reduce((sum, l) => {
        const diff = new Date(l.UpdatedAt).getTime() - new Date(l.CreatedAt).getTime();
        return sum + diff;
      }, 0);
      turnaroundHours = Math.round((totalDiff / completedLeads.length) / (1000 * 60 * 60));
    }

    res.json({
      total,
      completed,
      pending,
      otpQueue,
      conversionRate,
      turnaroundHours,
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
    });
  } catch (err) {
    logError("Analytics", "getSummary", err);
    res.status(500).json({ error: "Failed to compute analytics" });
  }
});

// 9. ADMIN SIDE: SYSTEM LOGS (AUDIT, EMAIL, ERROR)
app.get("/api/logs", async (req, res) => {
  const token = req.query.token ? String(req.query.token) : undefined;
  const isAuthorized = await verifyGoogleAdminToken(token);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied: Only pwcouponwallah@gmail.com is authorized to view system logs." });
  }

  try {
    const db = readDB();
    res.json({
      auditLogs: db.auditLogs.slice(-100).reverse(), // Last 100 newest first
      emailLogs: db.emailLogs.slice(-100).reverse(),
      errorLogs: db.errorLogs.slice(-100).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch log details" });
  }
});

// 10. ADMIN SIDE: FORCE DB MANUALLY TO SYNCHRONIZE
app.post("/api/sheets/sync", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Access token is required to execute sheets synchronization" });
  }

  try {
    const isAuthorized = await verifyGoogleAdminToken(token);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access Denied: Only pwcouponwallah@gmail.com is authorized to sync database." });
    }

    const config = readConfig();
    if (!config.spreadsheetId) {
      return res.status(400).json({ error: "No Google Sheet connected. Setup spreadsheet database first." });
    }

    await syncToGoogleSheets(config.spreadsheetId, token);
    logAudit("Admin", "Manual Force Sync to Sheets", "ALL", "Local Cache", config.spreadsheetId, req);
    res.json({ success: true, message: "Database synchronized successfully with Google Sheets." });
  } catch (err: any) {
    res.status(500).json({ error: "Force sync failed", details: err.message });
  }
});

// Centralized Error Handling Middleware
app.use(ErrorHandler.handle);

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PW CRM] Full-stack Server Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Fatal Error: failed to launch full-stack server", err);
});
