"use client";

import React from "react";
import type { PaymentStatus } from "@/lib/types";
import { formatMAD } from "@/lib/format";

interface PaymentFieldsProps {
  total: number;
  status: PaymentStatus;
  paidAmount: string;
  onStatusChange: (status: PaymentStatus) => void;
  onPaidChange: (value: string) => void;
}

/** Shared payment status / paid amount / remaining block for Achats & Ventes. */
export function PaymentFields({
  total,
  status,
  paidAmount,
  onStatusChange,
  onPaidChange,
}: PaymentFieldsProps) {
  const paid =
    status === "paid" ? total : status === "unpaid" ? 0 : Number(paidAmount) || 0;
  const reste = Math.max(total - paid, 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <label className="label">Statut paiement</label>
        <select
          className="input"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as PaymentStatus)}
        >
          <option value="paid">Payé</option>
          <option value="partial">Partiel</option>
          <option value="unpaid">Non payé</option>
        </select>
      </div>
      <div>
        <label className="label">Montant payé (DH)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input"
          value={status === "partial" ? paidAmount : String(paid)}
          disabled={status !== "partial"}
          onChange={(e) => onPaidChange(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Reste à payer</label>
        <div
          className={`input flex items-center font-semibold ${
            reste > 0 ? "text-red-600" : "text-brand-700"
          }`}
        >
          {formatMAD(reste)}
        </div>
      </div>
    </div>
  );
}
