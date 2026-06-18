"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/lib/types";
import type { ExpenseInput } from "@/lib/store";
import { useI18n } from "@/lib/i18n/I18nProvider";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Transport",
  "Loyer",
  "Salaires",
  "Électricité",
  "Internet",
  "Maintenance",
  "Carburant",
  "Fournitures",
  "Autre",
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "Espèces",
  "Virement",
  "Chèque",
  "Carte",
  "Crédit",
];

const todayInput = () => new Date().toISOString().slice(0, 10);

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => void;
  expense?: Expense | null;
}

const empty = {
  date: todayInput(),
  category: "Transport" as ExpenseCategory,
  amount: "",
  paymentMethod: "Espèces" as PaymentMethod,
  label: "",
  note: "",
};

export function ExpenseFormModal({
  open,
  onClose,
  onSubmit,
  expense,
}: ExpenseFormModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        date: expense.date.slice(0, 10),
        category: (expense.category as ExpenseCategory) ?? "Autre",
        amount: String(expense.amount),
        paymentMethod: expense.paymentMethod ?? "Espèces",
        label: expense.label,
        note: expense.note ?? "",
      });
    } else {
      setForm({ ...empty, date: todayInput() });
    }
    setErrors({});
  }, [open, expense]);

  const set = (key: keyof typeof empty, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.label.trim()) e.label = "La description est requise.";
    if (form.amount === "" || Number(form.amount) <= 0)
      e.amount = "Montant invalide.";
    if (!form.date) e.date = "La date est requise.";
    setErrors(e);
    if (Object.keys(e).length) return;

    onSubmit({
      date: new Date(form.date).toISOString(),
      category: form.category,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      label: form.label.trim(),
      note: form.note.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? t("common.edit") : t("exp.addBtn")}
      description={
        expense
          ? "Mettez à jour cette dépense."
          : "Enregistrez une nouvelle dépense."
      }
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("common.date")}</label>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-600">{errors.date}</p>
          )}
        </div>

        <div>
          <label className="label">{t("common.category")}</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("common.amount")} (DH)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="label">{t("field.paymentMethod")}</label>
          <select
            className="input"
            value={form.paymentMethod}
            onChange={(e) => set("paymentMethod", e.target.value)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t("field.description")}</label>
          <input
            className="input"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Ex. Loyer dépôt, carburant livraison…"
          />
          {errors.label && (
            <p className="mt-1 text-xs text-red-600">{errors.label}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label">
            {t("common.notes")} {t("common.optional")}
          </label>
          <textarea
            className="input min-h-[70px] resize-y"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Informations complémentaires…"
          />
        </div>
      </div>
    </Modal>
  );
}
