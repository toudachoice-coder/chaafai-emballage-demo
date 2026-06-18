"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  LineItemsEditor,
  type DraftLine,
  emptyLine,
  lineTotal,
} from "@/components/transactions/LineItemsEditor";
import { PaymentFields } from "@/components/transactions/PaymentFields";
import type { Client, PaymentStatus, Product, Sale } from "@/lib/types";
import type { SaleInput } from "@/lib/store";
import { formatMAD } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

const todayInput = () => new Date().toISOString().slice(0, 10);

interface SaleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: SaleInput) => void;
  clients: Client[];
  products: Product[];
  sale?: Sale | null;
}

export function SaleFormModal({
  open,
  onClose,
  onSubmit,
  clients,
  products,
  sale,
}: SaleFormModalProps) {
  const { t } = useI18n();
  const [date, setDate] = useState(todayInput());
  const [clientId, setClientId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [discount, setDiscount] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (sale) {
      setDate(sale.date.slice(0, 10));
      setClientId(sale.clientId);
      setLines(
        sale.items.map((it) => ({
          productId: it.productId,
          qty: String(it.qty),
          unitPrice: String(it.unitPrice),
        }))
      );
      setDiscount(sale.discount ? String(sale.discount) : "");
      setStatus(sale.status);
      setPaidAmount(String(sale.paidAmount ?? ""));
      setNote(sale.note ?? "");
    } else {
      setDate(todayInput());
      setClientId(clients[0]?.id ?? "");
      setLines([emptyLine()]);
      setDiscount("");
      setStatus("paid");
      setPaidAmount("");
      setNote("");
    }
    setError("");
  }, [open, sale, clients]);

  const gross = useMemo(
    () => lines.reduce((s, l) => s + lineTotal(l), 0),
    [lines]
  );
  const total = Math.max(gross - (Number(discount) || 0), 0);

  const handleSubmit = () => {
    if (!clientId) return setError("Veuillez choisir un client.");
    const validLines = lines.filter((l) => l.productId && Number(l.qty) > 0);
    if (validLines.length === 0)
      return setError("Ajoutez au moins une ligne de produit valide.");

    onSubmit({
      clientId,
      date: new Date(date).toISOString(),
      items: validLines.map((l) => ({
        productId: l.productId,
        name: products.find((p) => p.id === l.productId)?.name ?? "Produit",
        qty: Number(l.qty),
        unitPrice: Number(l.unitPrice) || 0,
      })),
      discount: Number(discount) || 0,
      status,
      paidAmount: Number(paidAmount) || 0,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sale ? t("common.edit") : t("sell.addBtn")}
      description="L'enregistrement diminue automatiquement le stock."
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {t("common.save")}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t("common.date")}</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("common.client")}</label>
            <select
              className="input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">{t("trx.chooseClient")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">{t("common.products")}</label>
          <LineItemsEditor
            products={products}
            lines={lines}
            onChange={setLines}
            priceMode="sell"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t("field.discount")}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("field.netTotal")}</label>
            <div className="input flex items-center justify-between font-semibold text-slate-800">
              <span>{formatMAD(total)}</span>
              {Number(discount) > 0 && (
                <span className="text-xs font-normal text-slate-400">
                  brut {formatMAD(gross)}
                </span>
              )}
            </div>
          </div>
        </div>

        <PaymentFields
          total={total}
          status={status}
          paidAmount={paidAmount}
          onStatusChange={setStatus}
          onPaidChange={setPaidAmount}
        />

        <div>
          <label className="label">
            {t("common.notes")} {t("common.optional")}
          </label>
          <textarea
            className="input min-h-[70px] resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Informations complémentaires…"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
