"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, FileText, Eye, Printer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InvoiceModal } from "@/components/invoices/InvoiceModal";
import { useToast } from "@/components/ui/ToastProvider";
import { useDatabase } from "@/hooks/useDatabase";
import {
  ensureInvoices,
  invoiceView,
  updateInvoice,
  clientName,
} from "@/lib/store";
import type { InvoiceStatus, PaymentStatus } from "@/lib/types";
import { formatMAD, formatDate } from "@/lib/format";

const docStatusStyles: Record<InvoiceStatus, string> = {
  Brouillon: "bg-slate-100 text-slate-600",
  Validée: "bg-brand-50 text-brand-700",
  Annulée: "bg-red-50 text-red-700",
};

export default function InvoicesPage() {
  const { db, ready } = useDatabase();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState<"all" | PaymentStatus>("all");
  const [docFilter, setDocFilter] = useState<"all" | InvoiceStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Generate a stable invoice for any sale that doesn't have one yet.
  useEffect(() => {
    if (ready) ensureInvoices();
  }, [ready]);

  const rows = useMemo(() => {
    if (!db) return [];
    const q = search.trim().toLowerCase();
    return db.invoices
      .map((inv) => ({ inv, view: invoiceView(db, inv) }))
      .filter(({ inv, view }) => {
        if (payFilter !== "all" && view.paymentStatus !== payFilter)
          return false;
        if (docFilter !== "all" && view.docStatus !== docFilter) return false;
        if (!q) return true;
        return (
          inv.number.toLowerCase().includes(q) ||
          clientName(db, inv.clientId).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.inv.date < b.inv.date ? 1 : -1));
  }, [db, search, payFilter, docFilter]);

  const selectedView = useMemo(() => {
    if (!db || !selectedId) return null;
    const inv = db.invoices.find((i) => i.id === selectedId);
    return inv ? invoiceView(db, inv) : null;
  }, [db, selectedId]);

  const handlePrint = (id: string) => {
    setSelectedId(id);
    // Let the modal mount before invoking the print dialog.
    setTimeout(() => window.print(), 250);
  };

  return (
    <AppShell
      title="Factures"
      subtitle="Factures générées à partir des ventes"
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
                placeholder="Rechercher par n° de facture ou client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input sm:w-48"
              value={payFilter}
              onChange={(e) =>
                setPayFilter(e.target.value as "all" | PaymentStatus)
              }
            >
              <option value="all">Tous les paiements</option>
              <option value="paid">Payé</option>
              <option value="partial">Partiel</option>
              <option value="unpaid">Non payé</option>
            </select>
            <select
              className="input sm:w-48"
              value={docFilter}
              onChange={(e) =>
                setDocFilter(e.target.value as "all" | InvoiceStatus)
              }
            >
              <option value="all">Tous les statuts</option>
              <option value="Brouillon">Brouillon</option>
              <option value="Validée">Validée</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>

          <div className="card overflow-hidden">
            {db.invoices.length === 0 ? (
              <EmptyState
                title="Aucune facture"
                description="Les factures sont créées automatiquement à partir des ventes."
                icon={<FileText className="h-8 w-8" />}
              />
            ) : rows.length === 0 ? (
              <EmptyState
                title="Aucun résultat"
                description="Aucune facture ne correspond à ces critères."
                icon={<Search className="h-8 w-8" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">N° Facture</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Client</th>
                      <th className="px-5 py-3 text-right">Total TTC</th>
                      <th className="px-5 py-3">Paiement</th>
                      <th className="px-5 py-3">Statut</th>
                      <th className="px-5 py-3 text-right">Reste</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map(({ inv, view }) => (
                      <tr
                        key={inv.id}
                        className="cursor-pointer transition-colors hover:bg-slate-50/60"
                        onClick={() => setSelectedId(inv.id)}
                      >
                        <td className="px-5 py-3 font-medium text-brand-700">
                          {inv.number}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatDate(inv.date)}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {view.clientName}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-800">
                          {formatMAD(view.totalTTC)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={view.paymentStatus} />
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`badge ${docStatusStyles[view.docStatus]}`}
                          >
                            {view.docStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {view.reste > 0 ? (
                            <span className="font-semibold text-red-600">
                              {formatMAD(view.reste)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setSelectedId(inv.id)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
                              title="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePrint(inv.id)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
                              title="Imprimer / PDF"
                            >
                              <Printer className="h-4 w-4" />
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

      <InvoiceModal
        open={!!selectedView}
        onClose={() => setSelectedId(null)}
        view={selectedView}
        onChangeStatus={(status) => {
          if (!selectedId) return;
          updateInvoice(selectedId, { docStatus: status });
          toast(`Facture marquée « ${status} »`);
        }}
        onChangeTva={(rate) => {
          if (!selectedId) return;
          updateInvoice(selectedId, { tvaRate: rate });
        }}
      />
    </AppShell>
  );
}
