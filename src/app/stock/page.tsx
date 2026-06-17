"use client";

import React, { useMemo, useState } from "react";
import {
  SlidersHorizontal,
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdjustmentModal } from "@/components/stock/AdjustmentModal";
import { useToast } from "@/components/ui/ToastProvider";
import { useDatabase } from "@/hooks/useDatabase";
import { addAdjustment, productName } from "@/lib/store";
import type { StockMovement } from "@/lib/types";
import { formatDate } from "@/lib/format";

/** Human label for the movement's business origin. */
function movementKind(m: StockMovement): string {
  if (m.kind === "achat") return "Achat";
  if (m.kind === "vente") return "Vente";
  if (m.kind === "ajustement") return "Ajustement";
  if (m.kind === "initial") return "Stock initial";
  // Legacy records without `kind`.
  if (m.type === "in") return "Entrée";
  if (m.type === "out") return "Sortie";
  return "Ajustement";
}

function kindFilterValue(m: StockMovement): string {
  if (m.kind) return m.kind === "initial" ? "ajustement" : m.kind;
  if (m.type === "in") return "achat";
  if (m.type === "out") return "vente";
  return "ajustement";
}

export default function StockPage() {
  const { db, ready } = useDatabase();
  const { toast } = useToast();

  const [typeFilter, setTypeFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!db) return [];
    return [...db.movements]
      .filter((m) => {
        if (typeFilter !== "all" && kindFilterValue(m) !== typeFilter)
          return false;
        if (productFilter !== "all" && m.productId !== productFilter)
          return false;
        const d = m.date.slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [db, typeFilter, productFilter, from, to]);

  const handleAdjust = (
    productId: string,
    direction: "in" | "out",
    qty: number,
    reason: string
  ) => {
    const res = addAdjustment(productId, direction, qty, reason);
    if (!res.ok) {
      toast(res.error ?? "Ajustement impossible.", "error");
      return;
    }
    toast("Stock ajusté");
    setAdjustOpen(false);
  };

  const num = (v?: number) => (typeof v === "number" ? String(v) : "—");

  return (
    <AppShell
      title="Mouvements de stock"
      subtitle="Historique des entrées et sorties"
      actions={
        <button className="btn-primary" onClick={() => setAdjustOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Ajuster le stock</span>
          <span className="sm:hidden">Ajuster</span>
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="achat">Achat</option>
              <option value="vente">Vente</option>
              <option value="ajustement">Ajustement</option>
            </select>
            <select
              className="input"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="all">Tous les produits</option>
              {db.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="Date de début"
            />
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="Date de fin"
            />
          </div>

          <div className="card overflow-hidden">
            {db.movements.length === 0 ? (
              <EmptyState
                title="Aucun mouvement"
                description="Les entrées et sorties de stock apparaîtront ici."
                icon={<Boxes className="h-8 w-8" />}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Aucun résultat"
                description="Aucun mouvement ne correspond à ces filtres."
                icon={<Search className="h-8 w-8" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Produit</th>
                      <th className="px-5 py-3 text-right">Entrée</th>
                      <th className="px-5 py-3 text-right">Sortie</th>
                      <th className="px-5 py-3 text-right">Avant</th>
                      <th className="px-5 py-3 text-right">Après</th>
                      <th className="px-5 py-3">Référence / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((m) => {
                      const isIn = m.type === "in";
                      return (
                        <tr
                          key={m.id}
                          className="transition-colors hover:bg-slate-50/60"
                        >
                          <td className="px-5 py-3 text-slate-600">
                            {formatDate(m.date)}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`badge ${
                                m.kind === "vente" || (!m.kind && m.type === "out")
                                  ? "bg-accent-50 text-accent-700"
                                  : m.kind === "ajustement"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-brand-50 text-brand-700"
                              }`}
                            >
                              {isIn ? (
                                <ArrowDownRight className="h-3 w-3" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3" />
                              )}
                              {movementKind(m)}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {productName(db, m.productId)}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-brand-700">
                            {isIn ? m.qty : ""}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-accent-700">
                            {!isIn ? m.qty : ""}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-500">
                            {num(m.stockBefore)}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700">
                            {num(m.stockAfter)}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {m.reason}
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

      <AdjustmentModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        onSubmit={handleAdjust}
        products={db?.products ?? []}
      />
    </AppShell>
  );
}
