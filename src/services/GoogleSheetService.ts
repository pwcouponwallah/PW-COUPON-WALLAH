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
export function getAppsScriptTriggerCode(baseUrl: string): string {
  const cleanUrl = baseUrl.replace(/\/$/, "");
  return `/**
 * Apps Script trigger for PW Coupon Wallah CRM
 * Install this script under Extensions > Apps Script in your spreadsheet.
 * Set up an 'On Edit' or 'On Change' trigger pointing to the handleEdit function.
 */

var CRM_API_URL = "${cleanUrl}/api/leads/update";

function handleEdit(e) {
  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();
  
  // Only trigger on edits inside the LEADS sheet
  if (sheetName !== "LEADS") return;
  
  var range = e.range;
  var row = range.getRow();
  
  // Ignore header row
  if (row === 1) return;
  
  var numCols = sheet.getLastColumn();
  var rowValues = sheet.getRange(row, 1, 1, numCols).getValues()[0];
  
  // Map row to lead object
  var leadPayload = {
    leadId: rowValues[0],          // Col A: LeadID
    status: rowValues[11],         // Col L: LeadStatus
    priority: rowValues[12],       // Col M: Priority
    otpRequired: rowValues[13] === "TRUE" || rowValues[13] === true, // Col N
    otpReceived: rowValues[14] === "TRUE" || rowValues[14] === true, // Col O
    couponCode: rowValues[15],     // Col P: CouponGenerated
    couponDelivered: rowValues[16] === "TRUE" || rowValues[16] === true, // Col Q
    remarks: rowValues[23],        // Col X: Remarks
    source: "GoogleSheetsTrigger"
  };
  
  if (!leadPayload.leadId) return;
  
  // Send data to CRM Webhook
  var options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(leadPayload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(CRM_API_URL, options);
  } catch (err) {
    Logger.log("Failed to post update: " + err.toString());
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
      const scriptCode = getAppsScriptTriggerCode(baseUrl);
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
