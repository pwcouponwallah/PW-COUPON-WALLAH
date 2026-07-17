import { Request, Response, NextFunction } from "express";
import { logError, readConfig } from "../../server-db";
import { GoogleSheetService } from "./GoogleSheetService";

export class CRMError extends Error {
  public statusCode: number;
  public errorCode: string;
  public userMessage: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = "INTERNAL_SERVER_ERROR", userMessage?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.userMessage = userMessage || "Something went wrong. Please try again later.";
    Object.setPrototypeOf(this, CRMError.prototype);
  }
}

export class ErrorHandler {
  /**
   * Main Express error handling middleware
   */
  static handle(err: any, req: Request, res: Response, next: NextFunction) {
    const errorTime = new Date().toISOString();
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
    const userMessage = err.userMessage || "An unexpected error occurred. Please contact support or try again.";

    // 1. Log locally
    logError("ExpressServer", `${req.method} ${req.path}`, err);

    // 2. Try logging to Google Sheets in the background
    const config = readConfig();
    if (config.spreadsheetId && config.googleAccessToken) {
      const errorRow = [
        errorTime,
        "ExpressServer",
        `${req.method} ${req.path}`,
        String(err.message || err),
        String(err.stack || "")
      ];
      GoogleSheetService.appendRowToTab("ERROR_LOGS", errorRow, config.googleAccessToken, config.spreadsheetId).catch(
        (syncErr) => console.error("[ErrorHandler] Failed to append error to Google Sheets:", syncErr)
      );
    }

    // 3. Return sanitized, user-friendly response without stack trace
    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: userMessage,
        timestamp: errorTime,
        requestId: req.headers["x-request-id"] || undefined
      }
    });
  }

  /**
   * Global uncaught exception and rejection handlers
   */
  static registerGlobalListeners() {
    process.on("unhandledRejection", (reason: any) => {
      const errorMsg = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : "";
      console.error("[ErrorHandler] Unhandled Promise Rejection:", errorMsg);
      
      logError("GlobalListener", "unhandledRejection", {
        message: errorMsg,
        stack
      });
    });

    process.on("uncaughtException", (error: Error) => {
      console.error("[ErrorHandler] Uncaught Exception:", error.message);
      
      logError("GlobalListener", "uncaughtException", error);
      
      // Keep server alive or let process manager restart
      // Generally in Node we can safely log and continue, or exit if state is corrupt
    });
  }
}
