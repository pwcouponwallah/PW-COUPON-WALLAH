/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LeadStatus {
  NEW = "NEW",
  UNDER_REVIEW = "UNDER_REVIEW",
  WAITING_STUDENT = "WAITING_STUDENT",
  COUPON_GENERATED = "COUPON_GENERATED",
  COUPON_DELIVERED = "COUPON_DELIVERED",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED"
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export interface Lead {
  LeadID: string;
  RequestDate: string;
  Name: string;
  Phone: string;
  Email: string;
  Exam: string;
  Course: string;
  TargetYear: string;
  Language: string;
  PurchaseTimeline: string;
  ExistingPWUser: boolean;
  LeadStatus: LeadStatus;
  Priority: Priority;
  OTPRequired: boolean;
  OTPReceived: boolean;
  CouponGenerated: string; // "YES" | "NO" | specific code
  CouponDelivered: boolean;
  Completed: boolean;
  CreatedBy: string;
  CreatedAt: string;
  UpdatedAt: string;
  LastEmail: string;
  LastStatusChange: string;
  Remarks: string;
}

export interface StatusHistoryEntry {
  LeadID: string;
  OldStatus: string;
  NewStatus: string;
  Time: string;
  UpdatedBy: string;
  Remarks?: string;
}

export interface EmailLog {
  Recipient: string;
  Subject: string;
  SentTime: string;
  Status: string;
  Error?: string;
}

export interface AuditLog {
  Timestamp: string;
  User: string;
  Action: string;
  RequestID: string;
  PreviousValue: string;
  NewValue: string;
  Browser: string;
  IP: string;
}

export interface ErrorLog {
  Time: string;
  Module: string;
  Function: string;
  Error: string;
  StackTrace: string;
}

export interface CRMConfig {
  spreadsheetId: string | null;
  adminEmail: string;
  brandName: string;
  supportEmail: string;
  logoUrl: string;
  primaryColor: string;
  timezone: string;
  version: string;
  maintenanceMode: boolean;
  rateLimitPerHour: number;
}
