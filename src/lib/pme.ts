import { useTranslation } from "react-i18next";
import type { Database } from "@/integrations/supabase/types";

export type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export const STATUS_FLOW: ShipmentStatus[] = [
  "shipment_registered",
  "received_at_origin",
  "processing_sorting",
  "dispatched_origin",
  "in_transit",
  "arrived_destination",
  "out_for_delivery",
  "delivered",
];

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  shipment_registered: "Shipment Registered",
  received_at_origin: "Received at Origin Branch",
  processing_sorting: "Processing at Sorting Center",
  dispatched_origin: "Dispatched from Origin Hub",
  in_transit: "In Transit",
  arrived_destination: "Arrived at Destination Hub",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  partial: "Partial",
  refunded: "Refunded",
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  branch_manager: "Branch Manager",
  operations_officer: "Operations Officer",
  dispatcher: "Dispatcher",
  driver: "Driver / Rider",
  customer_support: "Customer Support",
};

export function statusBadgeClass(status: ShipmentStatus): string {
  if (status === "delivered") return "bg-success/10 text-success border-success/20";
  if (status === "cancelled") return "bg-destructive/10 text-destructive border-destructive/20";
  if (status === "delayed") return "bg-warning/15 text-warning-foreground border-warning/30";
  if (status === "out_for_delivery") return "bg-info/10 text-info border-info/20";
  return "bg-navy/10 text-navy border-navy/20";
}

export const STATUS_PROGRESS_MAP: Record<ShipmentStatus, number> = {
  shipment_registered: 5,
  received_at_origin: 10,
  processing_sorting: 20,
  dispatched_origin: 35,
  in_transit: 50,
  arrived_destination: 70,
  out_for_delivery: 90,
  delivered: 100,
  delayed: 0,
  cancelled: 0,
};

export function statusProgress(status: ShipmentStatus): number {
  return STATUS_PROGRESS_MAP[status] ?? 5;
}

export type DeliveryHealth = "scheduled" | "on_schedule" | "almost_due" | "delayed" | "delivered" | "cancelled";

export interface ShipmentProgress {
  health: DeliveryHealth;
  healthLabel: string;
  progressPct: number;
  timeProgressPct: number;
  statusProgressPct: number;
  countdownLabel: string;
  countdownDetail: string;
  message: string;
  totalMs: number;
  elapsedMs: number;
  remainingMs: number;
  phase: "pre_departure" | "in_window" | "overdue" | "delivered" | "cancelled";
}

export function formatCountdown(ms: number, withSeconds = true) {
  const abs = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;
  const parts = [
    `${days} day${days === 1 ? "" : "s"}`,
    `${hours} hr${hours === 1 ? "" : "s"}`,
    `${minutes} min${minutes === 1 ? "" : "s"}`,
  ];
  if (withSeconds) parts.push(`${seconds} sec${seconds === 1 ? "" : "s"}`);
  return parts.join(", ");
}

export const STATUS_MESSAGES: Partial<Record<ShipmentStatus, string>> = {
  shipment_registered: "Your shipment has been registered successfully and is awaiting movement.",
  received_at_origin: "Your shipment has been received at our origin branch and is being prepared.",
  processing_sorting: "Your shipment is being processed at our sorting center.",
  dispatched_origin: "Your shipment has been dispatched from the origin hub.",
  in_transit: "Your shipment is currently moving through our logistics network.",
  arrived_destination: "Your shipment has arrived near the destination and is being prepared for delivery.",
  out_for_delivery: "Your shipment is with a delivery officer and will be delivered soon.",
  delivered: "Your shipment has been delivered successfully.",
  delayed: "Your shipment requires attention. Please contact Priority Mail Express support for an update.",
  cancelled: "This shipment has been cancelled.",
};

export function computeShipmentProgress(args: {
  departure_date: string | null;
  expected_arrival_date: string | null;
  current_status: ShipmentStatus;
  delivered_at?: string | null;
  now?: Date;
}): ShipmentProgress {
  const now = args.now ?? new Date();
  const dep = args.departure_date ? new Date(args.departure_date) : null;
  const exp = args.expected_arrival_date ? new Date(args.expected_arrival_date) : null;
  const totalMs = dep && exp ? Math.max(1, exp.getTime() - dep.getTime()) : 0;
  const elapsedMs = dep ? Math.max(0, now.getTime() - dep.getTime()) : 0;
  const remainingMs = exp ? exp.getTime() - now.getTime() : 0;
  const timeProgressPct = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;
  const statusProgressPct = statusProgress(args.current_status);

  let phase: ShipmentProgress["phase"] = "in_window";
  if (args.current_status === "cancelled") phase = "cancelled";
  else if (args.current_status === "delivered") phase = "delivered";
  else if (dep && now < dep) phase = "pre_departure";
  else if (exp && now > exp) phase = "overdue";

  let health: DeliveryHealth = "on_schedule";
  let healthLabel = "On Schedule";
  if (phase === "cancelled") { health = "cancelled"; healthLabel = "Cancelled"; }
  else if (phase === "delivered") { health = "delivered"; healthLabel = "Delivered"; }
  else if (phase === "overdue" || args.current_status === "delayed") { health = "delayed"; healthLabel = "Delayed"; }
  else if (phase === "pre_departure") { health = "scheduled"; healthLabel = "Scheduled"; }
  else if (remainingMs > 0 && remainingMs < 24 * 3600 * 1000) { health = "almost_due"; healthLabel = "Almost Due"; }

  let combined = Math.max(timeProgressPct, statusProgressPct);
  if (args.current_status !== "delivered") combined = Math.min(combined, 95);
  if (phase === "delivered") combined = 100;
  if (phase === "cancelled") combined = 0;

  let countdownLabel = "";
  let countdownDetail = "";
  if (phase === "delivered") {
    countdownLabel = "Delivered successfully";
    countdownDetail = args.delivered_at ? `Delivered on ${formatDateTime(args.delivered_at)}` : "Delivery complete.";
  } else if (phase === "cancelled") {
    countdownLabel = "Shipment cancelled";
    countdownDetail = "This shipment is no longer active.";
  } else if (phase === "pre_departure" && dep) {
    countdownLabel = `Departure in ${formatCountdown(dep.getTime() - now.getTime(), false)}`;
    countdownDetail = "Shipment registered. Awaiting departure from origin.";
  } else if (phase === "in_window") {
    countdownLabel = `Estimated delivery in ${formatCountdown(Math.max(0, remainingMs))}`;
    countdownDetail = "Your shipment is moving within the expected delivery timeframe.";
  } else if (phase === "overdue") {
    countdownLabel = `Overdue by ${formatCountdown(Math.abs(remainingMs), false)}`;
    countdownDetail = "Delivery requires attention. Shipment has exceeded the expected delivery timeframe.";
  }

  const message = STATUS_MESSAGES[args.current_status] ?? countdownDetail;

  return {
    health, healthLabel,
    progressPct: Math.round(combined),
    timeProgressPct: Math.round(timeProgressPct),
    statusProgressPct,
    countdownLabel, countdownDetail,
    message,
    totalMs, elapsedMs, remainingMs,
    phase,
  };
}

export function healthBadgeClass(h: DeliveryHealth): string {
  switch (h) {
    case "delivered": return "bg-success/10 text-success border-success/30";
    case "on_schedule": return "bg-info/10 text-info border-info/30";
    case "scheduled": return "bg-navy/10 text-navy border-navy/30";
    case "almost_due": return "bg-warning/15 text-warning-foreground border-warning/40";
    case "delayed": return "bg-destructive/10 text-destructive border-destructive/30";
    case "cancelled": return "bg-muted text-muted-foreground border-border";
  }
}

export function formatMoney(n: number | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(n ?? 0));
}

export function formatDateTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

// Absolute production site URL — used for QR codes and shareable links so they
// resolve correctly when scanned/opened off-device (not tied to the current host).
export const SITE_URL: string = (() => {
  const fromEnv = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, "");
  return "https://priority-track-pro.lovable.app";
})();

export function trackingUrl(tracking: string) {
  return `${SITE_URL}/track/${tracking}`;
}

export function verifyUrl(receipt: string, code?: string) {
  const base = `${SITE_URL}/verify/${receipt}`;
  return code ? `${base}?code=${encodeURIComponent(code)}` : base;
}

// Deterministic 6-char verification code derived from the receipt number.
// Same receipt always produces the same code; different receipts produce different codes.
export function getVerificationCode(receiptNumber: string | null | undefined): string {
  if (!receiptNumber) return "------";
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < receiptNumber.length; i++) {
    const c = receiptNumber.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ c, 2246822519) >>> 0;
  }
  let combined = (BigInt(h1) << 32n) | BigInt(h2);
  let out = "";
  const base = BigInt(ALPHABET.length);
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[Number(combined % base)];
    combined = combined / base;
  }
  return out;
}

export function verifyReceiptCode(receiptNumber: string, code: string): boolean {
  return getVerificationCode(receiptNumber).toUpperCase() === code.trim().toUpperCase();
}
