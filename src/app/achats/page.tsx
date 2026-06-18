"use client";

import React, { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ShoppingCart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PurchaseFormModal } from "@/components/purchases/PurchaseFormModal";
import { useToast } from "@/components/ui/ToastProvider";
import { useDatabase } from "@/hooks/useDatabase";
import {
  addPurchase,
  updatePurchase,
  deletePurchase,
  supplierName,
  resteOf,
  type PurchaseInput,
} from "@/lib/store";
import type { Purchase, PaymentStatus } from "@/lib/types";
import { formatMAD, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function PurchasesPage() {
  const { db, ready } = useDatabase();
  const { toast } = useToast();
  const { t } = useI18n();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);

  const filtered = useMemo(() => {
    if (!db) return [];
    const q = search.trim().toLowerCase();
    return db.purchases
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (!q) return true;
        return (
          supplierName(db, p.supplierId).toLowerCase().includes(q) ||
          (p.invoiceNumber?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [db, search, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Purchase) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleSubmit = (input: PurchaseInput) => {
    const res = editing
      ? updatePurchase(editing.id, input)
      : addPurchase(input);
    if (!res.ok) {
      toast(res.error ?? t("toast.genericError"), "error");
      return;
    }
    toast(editing ? t("toast.purchaseUpdated") : t("toast.purchaseSaved"));
    setFormOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const res = deletePurchase(deleteTarget.id);
    if (!res.ok) {
      toast(res.error ?? t("toast.genericError"), "error");
      setDeleteTarget(null);
      return;
    }
    toast(t("toast.purchaseDeleted"));
    setDeleteTarget(null);
  };

  return (
    <AppShell
      title={t("page.achats.title")}
      subtitle={t("page.achats.subtitle")}
      actions={
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("buy.addBtn")}</span>
          <span className="sm:hidden">{t("common.add")}</span>
        </button>
      }
    >
      {!ready || !db ? (
        <div className="card h-96 animate-pulse bg-slate-50" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder={t("buy.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input sm:w-56"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | PaymentStatus)
              }
            >
              <option value="all">{t("trx.allStatuses")}</option>
              <option value="paid">{t("status.paid")}</option>
              <option value="partial">{t("status.partial")}</option>
              <option value="unpaid">{t("status.unpaid")}</option>
            </select>
          </div>

          <div className="card overflow-hidden">
            {db.purchases.length === 0 ? (
              <EmptyState
                title={t("buy.empty")}
                description={t("buy.emptyDesc")}
                icon={<ShoppingCart className="h-8 w-8" />}
                action={
                  <button className="btn-primary" onClick={openAdd}>
                    <Plus className="h-4 w-4" />
                    {t("buy.addBtn")}
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title={t("empty.noResult")}
                description={t("empty.noResultDesc")}
                icon={<Search className="h-8 w-8" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">{t("common.date")}</th>
                      <th className="px-5 py-3">{t("common.supplier")}</th>
                      <th className="px-5 py-3">{t("common.products")}</th>
                      <th className="px-5 py-3 text-right">{t("common.total")}</th>
                      <th className="px-5 py-3">{t("common.status")}</th>
                      <th className="px-5 py-3 text-right">{t("common.remaining")}</th>
                      <th className="px-5 py-3 text-right">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p) => {
                      const reste = resteOf(p);
                      const itemsLabel =
                        p.items.length === 1
                          ? p.items[0].name
                          : t("trx.productsCount", { n: p.items.length });
                      return (
                        <tr
                          key={p.id}
                          className="transition-colors hover:bg-slate-50/60"
                        >
                          <td className="px-5 py-3 text-slate-600">
                            {formatDate(p.date)}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {supplierName(db, p.supplierId)}
                            {p.invoiceNumber && (
                              <div className="text-xs font-normal text-slate-400">
                                {p.invoiceNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {itemsLabel}
                            <div className="text-xs text-slate-400">
                              {t("trx.unitsCount", {
                                n: p.items.reduce((s, it) => s + it.qty, 0),
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-800">
                            {formatMAD(p.total)}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            {reste > 0 ? (
                              <span className="font-semibold text-red-600">
                                {formatMAD(reste)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(p)}
                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
                                title={t("common.edit")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                title={t("common.delete")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <PurchaseFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        suppliers={db?.suppliers ?? []}
        products={db?.products ?? []}
        purchase={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        message={t("confirm.deletePurchase")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}
