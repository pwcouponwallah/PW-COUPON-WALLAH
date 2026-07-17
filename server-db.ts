import * as fs from "fs";
import * as path from "path";
import { Lead, LeadStatus, Priority, StatusHistoryEntry, EmailLog, AuditLog, ErrorLog } from "./src/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

interface LocalDB {
  leads: Lead[];
  statusHistory: StatusHistoryEntry[];
  emailLogs: EmailLog[];
  auditLogs: AuditLog[];
  errorLogs: ErrorLog[];
}

const defaultDB: LocalDB = {
  leads: [
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
  ],
  statusHistory: [
    {
      LeadID: "PW202607160002",
      OldStatus: "NEW",
      NewStatus: "WAITING_STUDENT",
      Time: "2026-07-16T14:35:00Z",
      UpdatedBy: "Admin",
      Remarks: "Need OTP to generate coupon on PW Dashboard."
    }
  ],
  emailLogs: [
    {
      Recipient: "aarav.sharma@example.com",
      Subject: "Your PW Coupon Request PW202607160001 Received",
      SentTime: "2026-07-16T12:01:00Z",
      Status: "SUCCESS"
    }
  ],
  auditLogs: [
    {
      Timestamp: "2026-07-16T14:35:00Z",
      User: "Admin",
      Action: "Status Change to WAITING_STUDENT",
      RequestID: "PW202607160002",
      PreviousValue: "NEW",
      NewValue: "WAITING_STUDENT",
      Browser: "Chrome",
      IP: "127.0.0.1"
    }
  ],
  errorLogs: []
};

// Initialize folder and database files
export function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf8");
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(
        {
          spreadsheetId: null,
          adminEmail: "pwcouponwallah@gmail.com",
          brandName: "PW Coupon Wallah",
          supportEmail: "pwcouponwallah@gmail.com",
          logoUrl: "",
          primaryColor: "#dc2626",
          timezone: "Asia/Kolkata",
          version: "2.0.0",
          maintenanceMode: false,
          rateLimitPerHour: 3,
          googleAccessToken: null
        },
        null,
        2
      ),
      "utf8"
    );
  }
}

export function readDB(): LocalDB {
  initDB();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read local DB", e);
    return defaultDB;
  }
}

export function writeDB(db: LocalDB) {
  initDB();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write local DB", e);
  }
}

export function readConfig() {
  initDB();
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return {
      spreadsheetId: null,
      adminEmail: "pwcouponwallah@gmail.com",
      brandName: "PW Coupon Wallah",
      supportEmail: "pwcouponwallah@gmail.com",
      logoUrl: "",
      primaryColor: "#dc2626",
      timezone: "Asia/Kolkata",
      version: "2.0.0",
      maintenanceMode: false,
      rateLimitPerHour: 3,
      googleAccessToken: null
    };
  }
}

export function writeConfig(config: any) {
  initDB();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write config", e);
  }
}

// Log error helper
export function logError(module: string, fn: string, err: any) {
  const db = readDB();
  const entry: ErrorLog = {
    Time: new Date().toISOString(),
    Module: module,
    Function: fn,
    Error: String(err.message || err),
    StackTrace: String(err.stack || "")
  };
  db.errorLogs.push(entry);
  writeDB(db);
}

// Log audit helper
export function logAudit(user: string, action: string, reqId: string, prev: string, newVal: string, req: any) {
  const db = readDB();
  const entry: AuditLog = {
    Timestamp: new Date().toISOString(),
    User: user,
    Action: action,
    RequestID: reqId,
    PreviousValue: prev,
    NewValue: newVal,
    Browser: req ? req.headers["user-agent"] || "Unknown" : "Server",
    IP: req ? req.ip || req.connection.remoteAddress || "127.0.0.1" : "Server"
  };
  db.auditLogs.push(entry);
  writeDB(db);
}

// REST Google API calls helper
async function makeGoogleRequest(url: string, options: any, token: string) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google API error (${res.status}): ${errText}`);
  }

  return res.json();
}

// Create Spreadsheet via Google Sheets API
export async function createGoogleSpreadsheet(token: string) {
  try {
    const payload = {
      properties: {
        title: "PW Coupon Wallah CRM Database v2.0"
      },
      sheets: [
        { properties: { title: "SETTINGS" } },
        { properties: { title: "LEADS" } },
        { properties: { title: "STATUS_HISTORY" } },
        { properties: { title: "EMAIL_LOGS" } },
        { properties: { title: "AUDIT_LOGS" } },
        { properties: { title: "ERROR_LOGS" } }
      ]
    };

    const spreadsheet = await makeGoogleRequest(
      "https://sheets.googleapis.com/v4/spreadsheets",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    );

    const spreadsheetId = spreadsheet.spreadsheetId;

    // Write Headers to each sheet
    await writeHeaders(spreadsheetId, token);

    // Save Spreadsheet ID in local config
    const config = readConfig();
    config.spreadsheetId = spreadsheetId;
    config.googleAccessToken = token; // Store in memory/config for server actions
    writeConfig(config);

    // Sync current local DB to sheets
    await syncToGoogleSheets(spreadsheetId, token);

    return spreadsheetId;
  } catch (err) {
    logError("Database", "createGoogleSpreadsheet", err);
    throw err;
  }
}

async function writeHeaders(spreadsheetId: string, token: string) {
  const updates = [
    {
      range: "SETTINGS!A1:B1",
      values: [["Key", "Value"]]
    },
    {
      range: "LEADS!A1:X1",
      values: [[
        "LeadID", "RequestDate", "Name", "Phone", "Email", "Exam", "Course",
        "TargetYear", "Language", "PurchaseTimeline", "ExistingPWUser",
        "LeadStatus", "Priority", "OTPRequired", "OTPReceived", "CouponGenerated",
        "CouponDelivered", "Completed", "CreatedBy", "CreatedAt", "UpdatedAt",
        "LastEmail", "LastStatusChange", "Remarks"
      ]]
    },
    {
      range: "STATUS_HISTORY!A1:F1",
      values: [["LeadID", "OldStatus", "NewStatus", "Time", "UpdatedBy", "Remarks"]]
    },
    {
      range: "EMAIL_LOGS!A1:E1",
      values: [["Recipient", "Subject", "SentTime", "Status", "Error"]]
    },
    {
      range: "AUDIT_LOGS!A1:H1",
      values: [["Timestamp", "User", "Action", "RequestID", "PreviousValue", "NewValue", "Browser", "IP"]]
    },
    {
      range: "ERROR_LOGS!A1:E1",
      values: [["Time", "Module", "Function", "Error", "StackTrace"]]
    }
  ];

  for (const update of updates) {
    await makeGoogleRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${update.range}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        body: JSON.stringify({ values: update.values })
      },
      token
    );
  }

  // Populate Default Settings
  const config = readConfig();
  const settingsValues = [
    ["Brand Name", config.brandName],
    ["Support Email", config.supportEmail],
    ["Primary Color", config.primaryColor],
    ["Timezone", config.timezone],
    ["Version", config.version]
  ];

  await makeGoogleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SETTINGS!A2:B6?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({ values: settingsValues })
    },
    token
  );
}

// Append rows directly to a Google Sheet
export async function appendToGoogleSheet(sheetName: string, values: any[][], token: string, spreadsheetId: string) {
  try {
    await makeGoogleRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:A:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        body: JSON.stringify({ values })
      },
      token
    );
  } catch (err) {
    logError("Database", "appendToGoogleSheet", err);
    throw err;
  }
}

// Push all local DB arrays to Google Sheets
export async function syncToGoogleSheets(spreadsheetId: string, token: string) {
  try {
    const db = readDB();

    // Map Leads to array format matching schema headers
    const leadsRows = db.leads.map(l => [
      l.LeadID, l.RequestDate, l.Name, l.Phone, l.Email, l.Exam, l.Course,
      l.TargetYear, l.Language, l.PurchaseTimeline, l.ExistingPWUser ? "TRUE" : "FALSE",
      l.LeadStatus, l.Priority, l.OTPRequired ? "TRUE" : "FALSE", l.OTPReceived ? "TRUE" : "FALSE",
      l.CouponGenerated, l.CouponDelivered ? "TRUE" : "FALSE", l.Completed ? "TRUE" : "FALSE",
      l.CreatedBy, l.CreatedAt, l.UpdatedAt, l.LastEmail, l.LastStatusChange, l.Remarks
    ]);

    if (leadsRows.length > 0) {
      await makeGoogleRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/LEADS!A2?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          body: JSON.stringify({ values: leadsRows })
        },
        token
      );
    }

    const historyRows = db.statusHistory.map(h => [
      h.LeadID, h.OldStatus, h.NewStatus, h.Time, h.UpdatedBy, h.Remarks || ""
    ]);
    if (historyRows.length > 0) {
      await makeGoogleRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/STATUS_HISTORY!A2?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          body: JSON.stringify({ values: historyRows })
        },
        token
      );
    }

    const emailRows = db.emailLogs.map(e => [
      e.Recipient, e.Subject, e.SentTime, e.Status, e.Error || ""
    ]);
    if (emailRows.length > 0) {
      await makeGoogleRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/EMAIL_LOGS!A2?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          body: JSON.stringify({ values: emailRows })
        },
        token
      );
    }

    const auditRows = db.auditLogs.map(a => [
      a.Timestamp, a.User, a.Action, a.RequestID, a.PreviousValue, a.NewValue, a.Browser, a.IP
    ]);
    if (auditRows.length > 0) {
      await makeGoogleRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/AUDIT_LOGS!A2?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          body: JSON.stringify({ values: auditRows })
        },
        token
      );
    }

    const errorRows = db.errorLogs.map(er => [
      er.Time, er.Module, er.Function, er.Error, er.StackTrace
    ]);
    if (errorRows.length > 0) {
      await makeGoogleRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/ERROR_LOGS!A2?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          body: JSON.stringify({ values: errorRows })
        },
        token
      );
    }

    console.log("Local DB synced successfully to Google Sheets ID:", spreadsheetId);
  } catch (err) {
    logError("Database", "syncToGoogleSheets", err);
    throw err;
  }
}

// Read entire leads table from Google Sheets
export async function fetchLeadsFromSheets(spreadsheetId: string, token: string): Promise<Lead[]> {
  try {
    const data = await makeGoogleRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/LEADS!A2:X`,
      { method: "GET" },
      token
    );

    if (!data.values) return [];

    return data.values.map((row: any[]) => ({
      LeadID: row[0] || "",
      RequestDate: row[1] || "",
      Name: row[2] || "",
      Phone: row[3] || "",
      Email: row[4] || "",
      Exam: row[5] || "",
      Course: row[6] || "",
      TargetYear: row[7] || "",
      Language: row[8] || "",
      PurchaseTimeline: row[9] || "",
      ExistingPWUser: row[10] === "TRUE",
      LeadStatus: (row[11] as LeadStatus) || LeadStatus.NEW,
      Priority: (row[12] as Priority) || Priority.MEDIUM,
      OTPRequired: row[13] === "TRUE",
      OTPReceived: row[14] === "TRUE",
      CouponGenerated: row[15] || "",
      CouponDelivered: row[16] === "TRUE",
      Completed: row[17] === "TRUE",
      CreatedBy: row[18] || "",
      CreatedAt: row[19] || "",
      UpdatedAt: row[20] || "",
      LastEmail: row[21] || "",
      LastStatusChange: row[22] || "",
      Remarks: row[23] || ""
    }));
  } catch (err) {
    logError("Database", "fetchLeadsFromSheets", err);
    return [];
  }
}

// Send Email via Gmail API (Transactional)
export async function sendGmailEmail(to: string, subject: string, bodyHTML: string, token: string) {
  try {
    // Gmail API accepts RFC 2822 formatted base64url encoded message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `To: ${to}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      bodyHTML
    ];
    const message = messageParts.join("\r\n");
    const base64Safe = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await makeGoogleRequest(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        body: JSON.stringify({ raw: base64Safe })
      },
      token
    );

    // Log success in email logs
    const db = readDB();
    db.emailLogs.push({
      Recipient: to,
      Subject: subject,
      SentTime: new Date().toISOString(),
      Status: "SUCCESS"
    });
    writeDB(db);
  } catch (err) {
    logError("Email", "sendGmailEmail", err);
    // Log failure
    const db = readDB();
    db.emailLogs.push({
      Recipient: to,
      Subject: subject,
      SentTime: new Date().toISOString(),
      Status: "FAILED",
      Error: String(err)
    });
    writeDB(db);
    throw err;
  }
}
