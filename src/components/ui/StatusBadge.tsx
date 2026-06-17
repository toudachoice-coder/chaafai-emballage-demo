import React from "react";
import type { PaymentStatus } from "@/lib/types";
import { statusLabel } from "@/lib/store";

const styles: Record<PaymentStatus, string> = {
  paid: "bg-brand-50 text-brand-700",
  partial: "bg-amber-50 text-amber-700",
  unpaid: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`badge ${styles[status]}`}>{statusLabel(status)}</span>;
}
