"use client";

import React from "react";
import type { PaymentStatus } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";

const styles: Record<PaymentStatus, string> = {
  paid: "bg-brand-50 text-brand-700",
  partial: "bg-amber-50 text-amber-700",
  unpaid: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${styles[status]}`}>{t(`status.${status}`)}</span>
  );
}
