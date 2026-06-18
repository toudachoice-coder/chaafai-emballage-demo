"use client";

import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ExpenseFormModal,
  EXPENSE_CATEGORIES,
} from "@/components/expenses/ExpenseFormModal";
import { useToast } from "@/components/ui/ToastProvider";
import { useDatabase } from "@/hooks/useDatabase";
import {
  addExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInput,
} from "@/lib/store";
import type { Expense } from "@/lib/types";
import { formatMAD, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ExpensesPage() {
  const { db, ready } = useDatabase();
  const { toast } = useToast();
  const { t } = useI18n();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    if (!db) return [];
    return db.expenses
      .filter((e) => {
        if (categoryFilter !== "all" && e.category !== categoryFilter)
          return false;
        const d = e.date.slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [db, categoryFilter, from, to]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered]
  );

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setFormOpen(true);
  };

  const handleSubmit = (input: ExpenseInput) => {
    if (editing) {
      updateExpense(editing.id, input);
      toast(t("toast.expenseUpdated"));
    } else {
      addExpense(input);
      toast(t("toast.expenseSaved"));
    }
    setFormOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteExpense(deleteTarget.id);
    toast(t("toast.expenseDeleted"));
    setDeleteTarget(null);
  };

  return (
    <AppShell
      title={t("page.frais.title")}
      subtitle={t("page.frais.subtitle")}
      actions={
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("exp.addBtn")}</span>
          <span className="sm:hidden">{t("common.add")}</span>
        </button>
      }
    >
      {!ready || !db ? (
        <div className="card h-96 animate-pulse bg-slate-50" />
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">{t("exp.allCategories")}</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div>
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label={t("exp.from")}
              />
            </div>
            <div>
              <input
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label={t("exp.to")}
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-2">
              <span className="text-sm text-slate-500">{t("common.total")}</span>
              <span className="font-semibold text-slate-800">
                {formatMAD(total)}
              </span>
            </div>
          </div>

          <div className="card overflow-hidden">
            {db.expenses.length === 0 ? (
              <EmptyState
                title={t("exp.empty")}
                description={t("exp.emptyDesc")}
                icon={<Wallet className="h-8 w-8" />}
                action={
                  <button className="btn-primary" onClick={openAdd}>
                    <Plus className="h-4 w-4" />
                    {t("exp.addBtn")}
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title={t("empty.noResult")}
                description={t("empty.noResultDesc")}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">{t("common.date")}</th>
                      <th className="px-5 py-3">{t("field.description")}</th>
                      <th className="px-5 py-3">{t("common.category")}</th>
                      <th className="px-5 py-3">{t("inv.payment")}</th>
                      <th className="px-5 py-3 text-right">{t("common.amount")}</th>
                      <th className="px-5 py-3 text-right">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((e) => (
                      <tr
                        key={e.id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-3 text-slate-600">
                          {formatDate(e.date)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">
                            {e.label}
                          </div>
                          {e.note && (
                            <div className="text-xs text-slate-400">
                              {e.note}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="badge bg-slate-100 text-slate-600">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {e.paymentMethod ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-800">
                          {formatMAD(e.amount)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(e)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
                              title={t("common.edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(e)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                              title={t("common.delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <ExpenseFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        expense={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        message={t("confirm.deleteExpense", { name: deleteTarget?.label ?? "" })}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}
