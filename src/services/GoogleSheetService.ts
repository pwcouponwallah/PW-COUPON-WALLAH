import { Lead } from "../types";
import { 
  createGoogleSpreadsheet, 
  syncToGoogleSheets, 
  fetchLeadsFromSheets, 
  appendToGoogleSheet, 
  readConfig, 
  writeConfig, 
  logError 
} from "../../server-db";

/**
 * Generates Apps Script code to install in Google Sheet for bidirectional webhook triggers.
 * When the sheet is edited, this script posts updates back to the CRM API.
 */
export function getAppsScriptTriggerCode(baseUrl: string, spreadsheetId: string): string {
  const cleanUrl = baseUrl.replace(/\/$/, "");
  return `/**
 * Apps Script trigger for PW Coupon Wallah CRM
 * Install this script under Extensions > Apps Script in your spreadsheet.
 * Set up an 'On Edit' or 'On Change' trigger pointing to the handleEdit function.
 */

var CRM_API_URL = "${cleanUrl}/api/leads/update";
var SPREADSHEET_ID = "${spreadsheetId}";

function handleEdit(e) {
  processPendingEmails();
}

function handleChange(e) {
  processPendingEmails();
}

function getSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("SETTINGS");
  var settings = {};
  if (!sheet) return settings;
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return settings;
  
  var values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    var key = values[i][0];
    var val = values[i][1];
    if (key) {
      settings[key] = val;
    }
  }
  return settings;
}

function processPendingEmails() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30s to prevent concurrent overlapping executions
  } catch (e) {
    Logger.log("Could not acquire lock: " + e.toString());
    return;
  }
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LEADS");
    if (!sheet) return;
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    
    var dataRange = sheet.getRange(2, 1, lastRow - 1, 24);
    var values = dataRange.getValues();
    
    var settings = getSettings();
    var brandName = settings["Brand Name"] || "PW Coupon Wallah";
    var adminEmail = settings["Support Email"] || "pwcouponwallah@gmail.com";
    
    var updated = false;
    
    for (var i = 0; i < values.length; i++) {
      var rowData = values[i];
      var rowIndex = i + 2;
      
      var leadId = rowData[0];
      if (!leadId) continue;
      
      var studentName = rowData[2];
      var phone = rowData[3];
      var studentEmail = rowData[4];
      var exam = rowData[5];
      var course = rowData[6];
      var leadStatus = rowData[11];
      var remarks = rowData[23] || "";
      var couponCode = rowData[15] || "";
      var isExisting = rowData[10] === "TRUE" || rowData[10] === true;
      var lastEmailStatus = rowData[21] || ""; // Column V: LastEmail
      
      if (leadStatus && leadStatus !== lastEmailStatus) {
        Logger.log("Processing lead: " + leadId + " (Status: " + leadStatus + ", LastEmail: " + lastEmailStatus + ")");
        
        // 1. Send Admin Alert on new lead registration (lastEmailStatus is empty/blank)
        if (!lastEmailStatus || lastEmailStatus === "") {
          try {
            sendAdminNotificationEmail(adminEmail, {
              leadId: leadId,
              name: studentName,
              phone: phone,
              email: studentEmail,
              exam: exam,
              course: course,
              language: rowData[8],
              year: rowData[7],
              timeline: rowData[9],
              isExisting: isExisting,
              remarks: remarks
            }, brandName);
          } catch (adminErr) {
            Logger.log("Failed sending admin notification: " + adminErr.toString());
          }
        }
        
        // 2. Send Student Status Transactional Email
        if (studentEmail) {
          try {
            sendStudentStatusEmail(studentEmail, studentName, {
              leadId: leadId,
              course: course,
              exam: exam,
              status: leadStatus,
              couponCode: couponCode,
              remarks: remarks
            }, brandName);
          } catch (studentErr) {
            Logger.log("Failed sending student email: " + studentErr.toString());
          }
        }
        
        // 3. Update LastEmail column to leadStatus to mark as sent
        sheet.getRange(rowIndex, 22).setValue(leadStatus);
        
        // 4. Sync the update back to CRM webhook
        postUpdateToCRM({
          leadId: leadId,
          status: leadStatus,
          priority: rowData[12],
          otpRequired: rowData[13] === "TRUE" || rowData[13] === true,
          otpReceived: rowData[14] === "TRUE" || rowData[14] === true,
          couponCode: couponCode,
          couponDelivered: rowData[16] === "TRUE" || rowData[16] === true,
          remarks: remarks,
          lastEmail: leadStatus,
          token: SPREADSHEET_ID
        });
        
        updated = true;
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function sendStudentStatusEmail(to, studentName, lead, brandName) {
  var emailDetails = getStatusEmailDetails(lead, brandName);
  var htmlBody = buildEmailTemplate(studentName, emailDetails.subject, emailDetails.details, lead, brandName);
  
  MailApp.sendEmail({
    to: to,
    subject: emailDetails.subject,
    htmlBody: htmlBody
  });
}

function sendAdminNotificationEmail(adminEmail, lead, brandName) {
  var subject = "🚨 [NEW LEAD] " + lead.leadId + " - Coupon Request: " + lead.name;
  var htmlBody = '<div style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">' +
    '<div style="text-align: center; margin-bottom: 32px; border-bottom: 2px solid #ef4444; padding-bottom: 20px;">' +
      '<h1 style="color: #dc2626; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.75px;">🚨 New Coupon Lead Registered</h1>' +
      '<p style="color: #64748b; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">PW Ambassador CRM Real-time Notification</p>' +
    '</div>' +
    '<div style="margin-bottom: 32px;">' +
      '<h2 style="color: #0f172a; margin-top: 0; font-size: 16px; font-weight: 700;">A new coupon request has been submitted by a student:</h2>' +
      '<div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 20px; margin: 24px 0; border-radius: 0 12px 12px 0;">' +
        '<table style="width: 100%; font-size: 14px; border-collapse: collapse; line-height: 1.8;">' +
          '<tr><td style="color: #64748b; font-weight: 600; width: 140px;">Request ID:</td><td style="color: #0f172a; font-weight: 700; font-family: monospace;">' + lead.leadId + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Student Name:</td><td style="color: #0f172a; font-weight: 600;">' + lead.name + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Phone Number:</td><td style="color: #0f172a; font-weight: 600;">' + lead.phone + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Email Address:</td><td style="color: #0f172a; font-weight: 600;">' + lead.email + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Target Exam:</td><td style="color: #0f172a; font-weight: 600; text-transform: uppercase;">' + lead.exam + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Target Course:</td><td style="color: #0f172a; font-weight: 600; color: #b91c1c;">' + lead.course + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Language:</td><td style="color: #0f172a;">' + lead.language + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Target Year:</td><td style="color: #0f172a;">' + lead.year + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Timeline:</td><td style="color: #0f172a;">' + lead.timeline + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Existing User:</td><td style="color: #0f172a; font-weight: 600;">' + (lead.isExisting ? "YES (Needs OTP)" : "NO") + '</td></tr>' +
          '<tr><td style="color: #64748b; font-weight: 600;">Remarks:</td><td style="color: #334155; font-style: italic;">' + (lead.remarks || "No remarks") + '</td></tr>' +
        '</table>' +
      '</div>' +
    '</div>' +
    '<div style="text-align: center; margin: 30px 0;">' +
      '<a href="' + CRM_API_URL.replace("/api/leads/update", "") + '/" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">' +
        'Open Ambassador CRM Dashboard' +
      '</a>' +
    '</div>' +
    '<div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">' +
      '<p style="margin: 0;">This is an automated notification from the ' + brandName + ' engine. Action is recommended within 15 minutes for maximum student conversion.</p>' +
    '</div>' +
  '</div>';

  MailApp.sendEmail({
    to: adminEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

function getStatusEmailDetails(lead, brandName) {
  var status = lead.status;
  var subject = "";
  var details = "";
  var statusName = "";

  switch (status) {
    case "NEW":
      statusName = "RECEIVED & PENDING";
      subject = "[" + brandName + "] Request Received - ID: " + lead.leadId;
      details = "We have successfully registered your request for the course <strong>\\\"" + lead.course + "\\\"</strong> (" + lead.exam + "). Your PW Campus Ambassador has put this request under preliminary review. We will verify eligible discount campaigns on the official dashboard shortly.";
      break;

    case "UNDER_REVIEW":
      statusName = "UNDER AMBASSADOR REVIEW";
      subject = "[" + brandName + "] Ambassador Reviewing Request - ID: " + lead.leadId;
      details = "Your request for <strong>\\\"" + lead.course + "\\\"</strong> is currently <strong>UNDER ACTIVE REVIEW</strong>. Your designated ambassador is examining active campaigns to map the maximum eligible discount to your phone number.";
      break;

    case "WAITING_STUDENT":
      statusName = "WAITING ON STUDENT ACTION";
      subject = "[" + brandName + "] OTP Verification Required - ID: " + lead.leadId;
      details = "Action Required: To generate the coupon code on the official ambassador portal, your account requires temporary OTP authentication. <strong>Please connect with your Campus Ambassador on WhatsApp immediately</strong> to coordinate and share the login OTP securely.";
      break;

    case "COUPON_GENERATED":
      statusName = "COUPON GENERATED";
      subject = "[" + brandName + "] Coupon Generated! - ID: " + lead.leadId;
      details = "Success! Your personalized coupon code is being prepared for delivery. The generated code is: <strong style=\\\"font-size: 16px; color: #dc2626; font-family: monospace; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px;\\\">" + (lead.couponCode || "PENDING") + "</strong>. It will be delivered to your WhatsApp/registered device shortly.";
      break;

    case "COUPON_DELIVERED":
      statusName = "COUPON DELIVERED";
      subject = "[" + brandName + "] Coupon Delivered! Use Code Now - ID: " + lead.leadId;
      details = "Excellent news! Your official Physics Wallah discount coupon has been successfully delivered. <br/><br/>" +
                 "Code: <strong style=\\\"font-size: 18px; color: #dc2626; font-family: monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #fca5a5;\\\">" + (lead.couponCode || "Verified") + "</strong><br/><br/>" +
                 "Please apply this code at the checkout page on the official Physics Wallah App/Website to claim your direct ambassador discount.";
      break;

    case "COMPLETED":
      statusName = "COMPLETED & ENROLLED";
      subject = "[" + brandName + "] Batch Enrollment Completed! - ID: " + lead.leadId;
      details = "Congratulations! Your enrollment in <strong>\\\"" + lead.course + "\\\"</strong> is now fully complete and verified. Your coupon has been redeemed. We wish you an amazing, inspiring academic journey with Physics Wallah. Study hard!";
      break;

    case "CLOSED":
      statusName = "REQUEST ARCHIVED/CLOSED";
      subject = "[" + brandName + "] Request Archived - ID: " + lead.leadId;
      details = "Your coupon assistance request has been marked as closed/archived. If you purchased the batch or require additional help, feel free to open a new discount inquiry on our portal.";
      break;

    case "CANCELLED":
      statusName = "REQUEST CANCELLED";
      subject = "[" + brandName + "] Request Cancelled - ID: " + lead.leadId;
      details = "Your request has been cancelled. This could be due to invalid details, an active double booking, or request expiration. Remarks from your ambassador: <em>\\\"" + (lead.remarks || "None provided") + "\\\"</em>.";
      break;

    default:
      statusName = "UPDATED";
      subject = "[" + brandName + "] Request Update - ID: " + lead.leadId;
      details = "Your coupon request has been updated. Status: " + status + ". Remarks: " + (lead.remarks || "No additional comments") + ".";
  }

  return { subject: subject, details: details, statusName: statusName };
}

function buildEmailTemplate(studentName, subject, details, lead, brandName) {
  var waMessage = "Hello PW Ambassador, I have submitted a coupon request.\\nRequest ID: " + lead.leadId + "\\nCourse: " + lead.course + "\\nExam: " + lead.exam + "\\nStudent Name: " + studentName;
  var waUrl = "https://wa.me/919711828344?text=" + encodeURIComponent(waMessage);

  return '<div style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">' +
    '<div style="text-align: center; margin-bottom: 32px; border-bottom: 2px solid #ef4444; padding-bottom: 20px;">' +
      '<h1 style="color: #dc2626; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.75px;">🎯 ' + brandName + '</h1>' +
      '<p style="color: #64748b; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Official PW Ambassador CRM & Assistance Portal</p>' +
    '</div>' +
    '<div style="margin-bottom: 32px;">' +
      '<h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.25px;">Hello ' + studentName + ',</h2>' +
      '<p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your official personalized Physics Wallah (PW) coupon request status has been updated. Here are the latest tracking details:</p>' +
      '<div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 20px; margin: 24px 0; border-radius: 0 12px 12px 0;">' +
        '<table style="width: 100%; font-size: 14px; border-collapse: collapse;">' +
          '<tr>' +
            '<td style="color: #64748b; padding: 6px 0; width: 140px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Request ID:</td>' +
            '<td style="color: #0f172a; padding: 6px 0; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px;">' + lead.leadId + '</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="color: #64748b; padding: 6px 0; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Batch / Course:</td>' +
            '<td style="color: #0f172a; padding: 6px 0; font-weight: 700; font-size: 14px;">' + lead.course + ' (' + lead.exam + ')</td>' +
          '</tr>' +
          '<tr>' +
            '<td style="color: #64748b; padding: 6px 0; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Update Status:</td>' +
            '<td style="color: #2563eb; padding: 6px 0; font-weight: 800; font-size: 14px; text-transform: uppercase;">' + lead.status + '</td>' +
          '</tr>' +
        '</table>' +
      '</div>' +
      '<div style="color: #334155; font-size: 15px; line-height: 1.6; padding: 4px 0;">' +
        details +
      '</div>' +
      '<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 28px 0; text-align: center;">' +
        '<h3 style="color: #166534; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">💬 Direct Message Ambassador on WhatsApp</h3>' +
        '<p style="color: #1e293b; font-size: 13px; margin: 0 0 14px 0; line-height: 1.5;">Initiate a direct chat on <strong>9711828344</strong> to share your coupon details, request active coupon activation, or get batch help.</p>' +
        '<a href="' + waUrl + '" target="_blank" style="background-color: #25d366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 211, 102, 0.2);">' +
          'Chat with Ambassador Now' +
        '</a>' +
      '</div>' +
      '<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 24px 0;">' +
        '<h3 style="color: #0f172a; margin: 0 0 8px 0; font-size: 15px; font-weight: 700; text-align: center;">🚀 Join Our Active Student Communities</h3>' +
        '<p style="color: #475569; font-size: 13px; margin: 0 0 16px 0; line-height: 1.5; text-align: center;">Join other students to receive instantaneous support, extra batch coupon alerts, and preparation materials.</p>' +
        '<div style="text-align: center;">' +
          '<a href="https://chat.whatsapp.com/L9gPNg40VhaH8UxbB3wTVq" target="_blank" style="background-color: #075e54; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; margin: 4px; box-shadow: 0 2px 4px rgba(7, 94, 84, 0.2);">' +
            '👥 WhatsApp Group Link' +
          '</a>' +
          '<a href="https://telegram.me/PW_Helping_Hand" target="_blank" style="background-color: #0088cc; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; margin: 4px; box-shadow: 0 2px 4px rgba(0, 136, 204, 0.2);">' +
            '✈️ Telegram Group Link' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="text-align: center; margin: 36px 0 24px 0;">' +
      '<a href="' + CRM_API_URL.replace("/api/leads/update", "") + '/" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; transition: background-color 0.2s ease; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);">' +
        'Track Your Request Live' +
      '</a>' +
    '</div>' +
    '<div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 36px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">' +
      '<p style="margin: 0 0 6px 0; font-weight: 500;">This is an official transactional message sent by your designated PW Campus Ambassador.</p>' +
      '<p style="margin: 0 0 12px 0;">For urgent inquiries, please connect directly using the portal support option.</p>' +
      '<p style="margin: 0; font-weight: 600; color: #64748b;">© 2026 PW Coupon Wallah. Authorized PW Ambassador Service.</p>' +
    '</div>' +
  '</div>';
}

function postUpdateToCRM(leadPayload) {
  var options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(leadPayload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(CRM_API_URL, options);
  } catch (err) {
    Logger.log("Failed to post update to CRM: " + err.toString());
  }
}
`;
}

export class GoogleSheetService {
  /**
   * Automatically provisions a Google Spreadsheet with all required tabs,
   * configures headers, logs, settings, and populates the Apps Script trigger setup sheet.
   */
  static async setup(token: string, baseUrl?: string): Promise<string> {
    try {
      console.log("[GoogleSheetService] Starting automated spreadsheet setup...");
      const spreadsheetId = await createGoogleSpreadsheet(token);

      // Create instructional sheet for triggers
      const activeBaseUrl = baseUrl || "https://pw-coupon-wallah.vercel.app";
      await this.createTriggerInstructionSheet(spreadsheetId, token, activeBaseUrl);

      console.log(`[GoogleSheetService] Setup successful. Spreadsheet ID: ${spreadsheetId}`);
      return spreadsheetId;
    } catch (err) {
      logError("GoogleSheetService", "setup", err);
      throw err;
    }
  }

  /**
   * Helper to write Apps Script guide directly into spreadsheet for seamless admin setup
   */
  private static async createTriggerInstructionSheet(spreadsheetId: string, token: string, baseUrl: string): Promise<void> {
    const sheetTitle = "APPS_SCRIPT_TRIGGER_GUIDE";
    
    try {
      // Create tab via Google Sheets API batch update
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle
                }
              }
            }
          ]
        })
      });

      // Write instruction cells
      const scriptCode = getAppsScriptTriggerCode(baseUrl, spreadsheetId);
      const instructions = [
        ["🚀 Bidirectional Synchronization Setup Instructions", ""],
        ["Step 1", "Open this Google Sheet, go to the top menu and select: 'Extensions' > 'Apps Script'."],
        ["Step 2", "Delete any existing default code in the editor, and paste the code below."],
        ["Step 3", "Click the Save icon (floppy disk) to save your script project."],
        ["Step 4", "In the Apps Script menu, click the Clock icon on the left (Triggers)."],
        ["Step 5", "Click '+ Add Trigger' at the bottom right. Configure it as follows:"],
        ["  - Choose function to run", "handleEdit"],
        ["  - Choose which deployment should run", "Head"],
        ["  - Event source", "From spreadsheet"],
        ["  - Event type", "On edit (or On change)"],
        ["Step 6", "Click Save. Grant the necessary permissions, and you are done! Live edits will sync back to the CRM."],
        ["", ""],
        ["📋 APPS SCRIPT SOURCE CODE TO COPY:", ""],
        [scriptCode, ""]
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTitle}!A1:B15?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ values: instructions })
      });

      console.log("[GoogleSheetService] APPS_SCRIPT_TRIGGER_GUIDE sheet successfully created.");
    } catch (err) {
      console.warn("[GoogleSheetService] Trigger guide sheet addition failed or already exists.", err);
    }
  }

  /**
   * Syncs a single lead to Google Sheets
   */
  static async syncLead(lead: Lead, token: string, spreadsheetId: string): Promise<void> {
    try {
      await syncToGoogleSheets(spreadsheetId, token);
    } catch (err) {
      logError("GoogleSheetService", "syncLead", err);
      throw err;
    }
  }

  /**
   * Reads all leads from the connected Google Sheet database
   */
  static async fetchLeads(spreadsheetId: string, token: string): Promise<Lead[]> {
    try {
      return await fetchLeadsFromSheets(spreadsheetId, token);
    } catch (err) {
      logError("GoogleSheetService", "fetchLeads", err);
      throw err;
    }
  }

  /**
   * Appends an audit or error log directly into the Google Sheet
   */
  static async appendRowToTab(tabName: string, row: any[], token: string, spreadsheetId: string): Promise<void> {
    try {
      await appendToGoogleSheet(tabName, [row], token, spreadsheetId);
    } catch (err) {
      console.error(`[GoogleSheetService] Failed to append log row to ${tabName}:`, err);
    }
  }
}
