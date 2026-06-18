"use client";

import React, { useEffect } from "react";
import { X, Printer } from "lucide-react";
import { InvoiceDocument } from "./InvoiceDocument";
import type { InvoiceView } from "@/lib/store";
import type { InvoiceStatus } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";

const DOC_STATUSES: InvoiceStatus[] = ["Brouillon", "Validée", "Annulée"];
const TVA_OPTIONS = [0, 0.07, 0.1, 0.14, 0.2];

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  view: InvoiceView | null;
  onChangeStatus: (status: InvoiceStatus) => void;
  onChangeTva: (rate: number) => void;
}

export function InvoiceModal({
  open,
  onClose,
  view,
  onChangeStatus,
  onChangeTva,
}: InvoiceModalProps) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !view) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm">
      {/* Toolbar (not printed) */}
      <div className="no-print flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-800">
            {view.invoice.number}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="hidden items-center gap-1 text-sm text-slate-500 sm:flex">
            {t("invdoc.tva")}
            <select
              className="input !w-auto !py-1.5"
              value={view.tvaRate}
              onChange={(e) => onChangeTva(Number(e.target.value))}
            >
              {TVA_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {Math.round(r * 100)} %
                </option>
              ))}
            </select>
          </label>
          <select
            className="input !w-auto !py-1.5"
            value={view.docStatus}
            onChange={(e) => onChangeStatus(e.target.value as InvoiceStatus)}
            aria-label={t("common.status")}
          >
            {DOC_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`doc.${s}`)}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {t("inv.printPdf")}
          </button>
        </div>
      </div>

      {/* Scrollable document */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="print-area mx-auto max-w-[800px] rounded-xl bg-white shadow-card-hover">
          <InvoiceDocument view={view} />
        </div>
      </div>
    </div>
  );
}
