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

export function statusProgress(status: ShipmentStatus): number {
  const idx = STATUS_FLOW.indexOf(status);
  if (status === "delivered") return 100;
  if (status === "cancelled") return 0;
  if (idx < 0) return 10;
  return Math.round(((idx + 1) / STATUS_FLOW.length) * 100);
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

export function trackingUrl(tracking: string) {
  if (typeof window === "undefined") return `/track/${tracking}`;
  return `${window.location.origin}/track/${tracking}`;
}
