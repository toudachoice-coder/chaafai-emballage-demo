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
import type { Purchase, PaymentStatus, Product, Supplier } from "@/lib/types";
import type { PurchaseInput } from "@/lib/store";

const todayInput = () => new Date().toISOString().slice(0, 10);

interface PurchaseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: PurchaseInput) => void;
  suppliers: Supplier[];
  products: Product[];
  purchase?: Purchase | null;
}

export function PurchaseFormModal({
  open,
  onClose,
  onSubmit,
  suppliers,
  products,
  purchase,
}: PurchaseFormModalProps) {
  const [date, setDate] = useState(todayInput());
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [status, setStatus] = useState<PaymentStatus>("unpaid");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (purchase) {
      setDate(purchase.date.slice(0, 10));
      setSupplierId(purchase.supplierId);
      setInvoiceNumber(purchase.invoiceNumber ?? "");
      setLines(
        purchase.items.map((it) => ({
          productId: it.productId,
          qty: String(it.qty),
          unitPrice: String(it.unitPrice),
        }))
      );
      setStatus(purchase.status);
      setPaidAmount(String(purchase.paidAmount ?? ""));
      setNote(purchase.note ?? "");
    } else {
      setDate(todayInput());
      setSupplierId(suppliers[0]?.id ?? "");
      setInvoiceNumber("");
      setLines([emptyLine()]);
      setStatus("unpaid");
      setPaidAmount("");
      setNote("");
    }
    setError("");
  }, [open, purchase, suppliers]);

  const total = useMemo(
    () => lines.reduce((s, l) => s + lineTotal(l), 0),
    [lines]
  );

  const handleSubmit = () => {
    if (!supplierId) return setError("Veuillez choisir un fournisseur.");
    const validLines = lines.filter(
      (l) => l.productId && Number(l.qty) > 0
    );
    if (validLines.length === 0)
      return setError("Ajoutez au moins une ligne de produit valide.");

    onSubmit({
      supplierId,
      date: new Date(date).toISOString(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      items: validLines.map((l) => ({
        productId: l.productId,
        name: products.find((p) => p.id === l.productId)?.name ?? "Produit",
        qty: Number(l.qty),
        unitPrice: Number(l.unitPrice) || 0,
      })),
      status,
      paidAmount: Number(paidAmount) || 0,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={purchase ? "Modifier l'achat" : "Nouvel achat"}
      description="L'enregistrement met automatiquement à jour le stock."
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {purchase ? "Enregistrer" : "Enregistrer l'achat"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Fournisseur</label>
            <select
              className="input"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Choisir un fournisseur…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Produits</label>
          <LineItemsEditor
            products={products}
            lines={lines}
            onChange={setLines}
            priceMode="cost"
          />
        </div>

        <div>
          <label className="label">N° facture fournisseur (optionnel)</label>
          <input
            className="input"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Ex. FC-2026-0145"
          />
        </div>

        <PaymentFields
          total={total}
          status={status}
          paidAmount={paidAmount}
          onStatusChange={setStatus}
          onPaidChange={setPaidAmount}
        />

        <div>
          <label className="label">Notes (optionnel)</label>
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
