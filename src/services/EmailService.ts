import { Lead, LeadStatus } from "../types";
import { sendGmailEmail, logError } from "../../server-db";

/**
 * Transactional HTML Email Template Builder
 */
export function buildEmailTemplate(
  lead: Lead,
  statusName: string,
  details: string,
  brandName: string = "PW Coupon Wallah"
): string {
  const waMessage = `Hello PW Ambassador, I have submitted a coupon request.
Request ID: ${lead.LeadID}
Course: ${lead.Course}
Exam: ${lead.Exam}
Student Name: ${lead.Name}
Phone: ${lead.Phone}`;
  const waUrl = `https://wa.me/919711828344?text=${encodeURIComponent(waMessage)}`;

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 32px; border-bottom: 2px solid #ef4444; padding-bottom: 20px;">
        <h1 style="color: #dc2626; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.75px;">🎯 ${brandName}</h1>
        <p style="color: #64748b; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">Official PW Ambassador CRM & Assistance Portal</p>
      </div>
      
      <div style="margin-bottom: 32px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.25px;">Hello ${lead.Name},</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your official personalized Physics Wallah (PW) coupon request status has been updated. Here are the latest tracking details:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 20px; margin: 24px 0; border-radius: 0 12px 12px 0;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; padding: 6px 0; width: 140px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Request ID:</td>
              <td style="color: #0f172a; padding: 6px 0; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px;">${lead.LeadID}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Batch / Course:</td>
              <td style="color: #0f172a; padding: 6px 0; font-weight: 700; font-size: 14px;">${lead.Course} (${lead.Exam})</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Update Status:</td>
              <td style="color: #2563eb; padding: 6px 0; font-weight: 800; font-size: 14px; text-transform: uppercase;">${statusName}</td>
            </tr>
          </table>
        </div>
        
        <div style="color: #334155; font-size: 15px; line-height: 1.6; padding: 4px 0;">
          ${details}
        </div>

        <!-- Dynamic WhatsApp Action Box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 28px 0; text-align: center;">
          <h3 style="color: #166534; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">💬 Direct Message Ambassador on WhatsApp</h3>
          <p style="color: #1e293b; font-size: 13px; margin: 0 0 14px 0; line-height: 1.5;">Initiate a direct chat on <strong>9711828344</strong> to share your coupon details, request active coupon activation, or get batch help.</p>
          <a href="${waUrl}" target="_blank" style="background-color: #25d366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 211, 102, 0.2);">
            Chat with Ambassador Now
          </a>
        </div>

        <!-- Community Group Links -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 24px 0;">
          <h3 style="color: #0f172a; margin: 0 0 8px 0; font-size: 15px; font-weight: 700; text-align: center;">🚀 Join Our Active Student Communities</h3>
          <p style="color: #475569; font-size: 13px; margin: 0 0 16px 0; line-height: 1.5; text-align: center;">Join other students to receive instantaneous support, extra batch coupon alerts, and preparation materials.</p>
          <div style="text-align: center;">
            <a href="https://chat.whatsapp.com/L9gPNg40VhaH8UxbB3wTVq" target="_blank" style="background-color: #075e54; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; margin: 4px; box-shadow: 0 2px 4px rgba(7, 94, 84, 0.2);">
              👥 WhatsApp Group Link
            </a>
            <a href="https://telegram.me/PW_Helping_Hand" target="_blank" style="background-color: #0088cc; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; margin: 4px; box-shadow: 0 2px 4px rgba(0, 136, 204, 0.2);">
              ✈️ Telegram Group Link
            </a>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 36px 0 24px 0;">
        <a href="https://ais-dev-peqz4kg57pb7qntq5aofgb-178935493329.asia-southeast1.run.app" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; transition: background-color 0.2s ease; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);">
          Track Your Request Live
        </a>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 36px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
        <p style="margin: 0 0 6px 0; font-weight: 500;">This is an official transactional message sent by your designated PW Campus Ambassador.</p>
        <p style="margin: 0 0 12px 0;">For urgent inquiries, please connect directly using the portal support option.</p>
        <p style="margin: 0; font-weight: 600; color: #64748b;">© 2026 PW Coupon Wallah. Authorized PW Ambassador Service.</p>
      </div>
    </div>
  `;
}

export class EmailService {
  /**
   * Generates email subject and body content based on CRM LeadStatus
   */
  static getStatusEmailDetails(lead: Lead, status: LeadStatus): { subject: string; details: string; statusName: string } {
    let subject = "";
    let details = "";
    let statusName = "";

    switch (status) {
      case LeadStatus.NEW:
        statusName = "RECEIVED & PENDING";
        subject = `[PW Coupon Wallah] Request Received - ID: ${lead.LeadID}`;
        details = `We have successfully registered your request for the course <strong>"${lead.Course}"</strong> (${lead.Exam}). Your PW Campus Ambassador has put this request under preliminary review. We will verify eligible discount campaigns on the official dashboard shortly.`;
        break;

      case LeadStatus.UNDER_REVIEW:
        statusName = "UNDER AMBASSADOR REVIEW";
        subject = `[PW Coupon Wallah] Ambassador Reviewing Request - ID: ${lead.LeadID}`;
        details = `Your request for <strong>"${lead.Course}"</strong> is currently <strong>UNDER ACTIVE REVIEW</strong>. Your designated ambassador is examining active campaigns to map the maximum eligible discount to your phone number: <strong>${lead.Phone}</strong>.`;
        break;

      case LeadStatus.WAITING_STUDENT:
        statusName = "WAITING ON STUDENT ACTION";
        subject = `[PW Coupon Wallah] OTP Verification Required - ID: ${lead.LeadID}`;
        details = `Action Required: To generate the coupon code on the official ambassador portal, your account requires temporary OTP authentication. <strong>Please connect with your Campus Ambassador on WhatsApp immediately</strong> to coordinate and share the login OTP securely.`;
        break;

      case LeadStatus.COUPON_GENERATED:
        statusName = "COUPON GENERATED";
        subject = `[PW Coupon Wallah] Coupon Generated! - ID: ${lead.LeadID}`;
        details = `Success! Your personalized coupon code is being prepared for delivery. The generated code is: <strong style="font-size: 16px; color: #dc2626; font-family: monospace; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${lead.CouponGenerated || "PENDING"}</strong>. It will be delivered to your WhatsApp/registered device shortly.`;
        break;

      case LeadStatus.COUPON_DELIVERED:
        statusName = "COUPON DELIVERED";
        subject = `[PW Coupon Wallah] Coupon Delivered! Use Code Now - ID: ${lead.LeadID}`;
        details = `Excellent news! Your official Physics Wallah discount coupon has been successfully delivered. <br/><br/>
                   Code: <strong style="font-size: 18px; color: #dc2626; font-family: monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #fca5a5;">${lead.CouponGenerated || "Verified"}</strong><br/><br/>
                   Please apply this code at the checkout page on the official Physics Wallah App/Website to claim your direct ambassador discount.`;
        break;

      case LeadStatus.COMPLETED:
        statusName = "COMPLETED & ENROLLED";
        subject = `[PW Coupon Wallah] Batch Enrollment Completed! - ID: ${lead.LeadID}`;
        details = `Congratulations! Your enrollment in <strong>"${lead.Course}"</strong> is now fully complete and verified. Your coupon has been redeemed. We wish you an amazing, inspiring academic journey with Physics Wallah. Study hard!`;
        break;

      case LeadStatus.CLOSED:
        statusName = "REQUEST ARCHIVED/CLOSED";
        subject = `[PW Coupon Wallah] Request Archived - ID: ${lead.LeadID}`;
        details = `Your coupon assistance request has been marked as closed/archived. If you purchased the batch or require additional help, feel free to open a new discount inquiry on our portal.`;
        break;

      case LeadStatus.CANCELLED:
        statusName = "REQUEST CANCELLED";
        subject = `[PW Coupon Wallah] Request Cancelled - ID: ${lead.LeadID}`;
        details = `Your request has been cancelled. This could be due to invalid details, an active double booking, or request expiration. Remarks from your ambassador: <em>"${lead.Remarks || "None provided"}"</em>.`;
        break;

      default:
        statusName = "UPDATED";
        subject = `[PW Coupon Wallah] Request Update - ID: ${lead.LeadID}`;
        details = `Your coupon request has been updated. Status: ${status}. Remarks: ${lead.Remarks || "No additional comments"}.`;
    }

    return { subject, details, statusName };
  }

  /**
   * Evaluates a lead status change and triggers a Gmail API request
   */
  static async triggerStatusEmail(
    lead: Lead,
    newStatus: LeadStatus,
    accessToken: string,
    brandName: string = "PW Coupon Wallah"
  ): Promise<boolean> {
    if (!accessToken) {
      console.warn("[EmailService] Missing Google access token, skipping Gmail delivery.");
      return false;
    }

    try {
      const { subject, details, statusName } = this.getStatusEmailDetails(lead, newStatus);
      const htmlBody = buildEmailTemplate(lead, statusName, details, brandName);

      await sendGmailEmail(lead.Email, subject, htmlBody, accessToken);
      console.log(`[EmailService] Transactional status email sent successfully to ${lead.Email} (Status: ${newStatus})`);
      return true;
    } catch (err) {
      logError("EmailService", "triggerStatusEmail", err);
      console.error(`[EmailService] Failed to send transactional email for lead ${lead.LeadID}:`, err);
      return false;
    }
  }

  /**
   * Triggers an email notification to the Admin when a new lead is created
   */
  static async triggerAdminNotification(
    lead: Lead,
    accessToken: string,
    adminEmail: string = "pwcouponwallah@gmail.com",
    brandName: string = "PW Coupon Wallah"
  ): Promise<boolean> {
    if (!accessToken) {
      console.warn("[EmailService] Missing Google access token, skipping Admin Gmail notification.");
      return false;
    }

    try {
      const subject = `🚨 [NEW LEAD] ${lead.LeadID} - Coupon Request: ${lead.Name}`;
      
      const adminHtmlBody = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 32px; border-bottom: 2px solid #ef4444; padding-bottom: 20px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.75px;">🚨 New Coupon Lead Registered</h1>
            <p style="color: #64748b; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">PW Ambassador CRM Real-time Notification</p>
          </div>
          
          <div style="margin-bottom: 32px;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 16px; font-weight: 700;">A new coupon request has been submitted by a student:</h2>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 20px; margin: 24px 0; border-radius: 0 12px 12px 0;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse; line-height: 1.8;">
                <tr>
                  <td style="color: #64748b; font-weight: 600; width: 140px;">Request ID:</td>
                  <td style="color: #0f172a; font-weight: 700; font-family: monospace;">${lead.LeadID}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Student Name:</td>
                  <td style="color: #0f172a; font-weight: 600;">${lead.Name}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Phone Number:</td>
                  <td style="color: #0f172a; font-weight: 600;">${lead.Phone}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Email Address:</td>
                  <td style="color: #0f172a; font-weight: 600;">${lead.Email}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Target Exam:</td>
                  <td style="color: #0f172a; font-weight: 600; text-transform: uppercase;">${lead.Exam}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Target Course:</td>
                  <td style="color: #0f172a; font-weight: 600; color: #b91c1c;">${lead.Course}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Language:</td>
                  <td style="color: #0f172a;">${lead.Language}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Target Year:</td>
                  <td style="color: #0f172a;">${lead.TargetYear}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Timeline:</td>
                  <td style="color: #0f172a;">${lead.PurchaseTimeline}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Existing User:</td>
                  <td style="color: #0f172a; font-weight: 600;">${lead.ExistingPWUser ? "YES (Needs OTP)" : "NO"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Remarks:</td>
                  <td style="color: #334155; font-style: italic;">${lead.Remarks || "No remarks"}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://ais-dev-peqz4kg57pb7qntq5aofgb-178935493329.asia-southeast1.run.app" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block;">
              Open Ambassador CRM Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">This is an automated notification from the ${brandName} engine. Action is recommended within 15 minutes for maximum student conversion.</p>
          </div>
        </div>
      `;

      await sendGmailEmail(adminEmail, subject, adminHtmlBody, accessToken);
      console.log(`[EmailService] Admin notification email sent successfully to ${adminEmail} for lead ${lead.LeadID}`);
      return true;
    } catch (err) {
      logError("EmailService", "triggerAdminNotification", err);
      console.error(`[EmailService] Failed to send Admin notification for lead ${lead.LeadID}:`, err);
      return false;
    }
  }
}
