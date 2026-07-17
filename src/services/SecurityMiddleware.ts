import { Request, Response, NextFunction } from "express";

// Simple in-memory storage for IP rate limiting
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipLimits = new Map<string, RateLimitRecord>();

export class SecurityMiddleware {
  /**
   * Simple IP-based rate limiting middleware
   * Default: 100 requests per 15 minutes per IP
   */
  static rateLimiter(limitCount: number = 100, windowMs: number = 15 * 60 * 1000) {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1") as string;
      const now = Date.now();

      let record = ipLimits.get(ip);

      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + windowMs
        };
        ipLimits.set(ip, record);
      } else {
        record.count++;
      }

      // Add Headers
      res.setHeader("X-RateLimit-Limit", limitCount);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limitCount - record.count));
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

      if (record.count > limitCount) {
        return res.status(429).json({
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please slow down and try again later."
          }
        });
      }

      next();
    };
  }

  /**
   * Deep input sanitization to scrub potential HTML/XSS payloads from string values
   */
  static sanitizeInput(req: Request, res: Response, next: NextFunction) {
    const sanitizeValue = (val: any): any => {
      if (typeof val === "string") {
        // Strip or escape common HTML tag characters
        return val
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;")
          .replace(/\//g, "&#x2F;");
      } else if (Array.isArray(val)) {
        return val.map(sanitizeValue);
      } else if (typeof val === "object" && val !== null) {
        const cleaned: any = {};
        for (const key in val) {
          if (Object.prototype.hasOwnProperty.call(val, key)) {
            cleaned[key] = sanitizeValue(val[key]);
          }
        }
        return cleaned;
      }
      return val;
    };

    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }
    if (req.params) {
      req.params = sanitizeValue(req.params);
    }

    next();
  }

  /**
   * Checks for essential secure HTTP headers (simple helmet-like middleware)
   */
  static securityHeaders(req: Request, res: Response, next: NextFunction) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Only set Content-Security-Policy if not interfering with Vite development
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://referrer.referer.google.com; connect-src 'self' https://sheets.googleapis.com https://gmail.googleapis.com"
      );
    }
    next();
  }

  /**
   * Validation schemas for leads
   */
  static validateLeadCreation(req: Request, res: Response, next: NextFunction) {
    const { name, phone, email, exam, course, consent } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(422).json({
        success: false,
        error: { code: "INVALID_FIELD", message: "Name is required and must be at least 2 characters." }
      });
    }

    if (!phone || typeof phone !== "string" || !/^\d{10}$/.test(phone.trim())) {
      return res.status(422).json({
        success: false,
        error: { code: "INVALID_FIELD", message: "Phone number must be exactly 10 digits." }
      });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(422).json({
        success: false,
        error: { code: "INVALID_FIELD", message: "A valid email address is required." }
      });
    }

    if (!exam || typeof exam !== "string") {
      return res.status(422).json({
        success: false,
        error: { code: "INVALID_FIELD", message: "Exam category is required." }
      });
    }

    if (!course || typeof course !== "string") {
      return res.status(422).json({
        success: false,
        error: { code: "INVALID_FIELD", message: "Target batch/course is required." }
      });
    }

    if (consent === undefined || consent === false) {
      return res.status(422).json({
        success: false,
        error: { code: "INVALID_FIELD", message: "Student consent is mandatory to process coupon requests." }
      });
    }

    next();
  }
}
