"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Boxes,
  TrendingUp,
  AlertTriangle,
  FileWarning,
  Wallet,
  ShoppingCart,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Settings2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDatabase } from "@/hooks/useDatabase";
import { getDashboardStats, categoryName } from "@/lib/store";
import { formatMAD, formatDate } from "@/lib/format";

export default function DashboardPage() {
  const { db, ready } = useDatabase();

  const stats = useMemo(() => (db ? getDashboardStats(db) : null), [db]);

  const lowStock = useMemo(
    () =>
      db
        ? [...db.products]
            .filter((p) => p.stock <= p.minStock)
            .sort((a, b) => a.stock - b.stock)
        : [],
    [db]
  );

  const unpaidInvoices = useMemo(
    () => (db ? db.invoices.filter((i) => i.status !== "paid") : []),
    [db]
  );

  const recentMovements = useMemo(
    () => (db ? db.movements.slice(0, 6) : []),
    [db]
  );

  return (
    <AppShell
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité"
    >
      {!ready || !stats || !db ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Primary KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Produits"
              value={String(stats.productCount)}
              hint={`${stats.clientCount} clients · ${stats.supplierCount} fournisseurs`}
              icon={Package}
              tone="accent"
            />
            <StatCard
              label="Valeur du stock (coût)"
              value={formatMAD(stats.stockValue)}
              hint={`Valeur de vente : ${formatMAD(stats.potentialRevenue)}`}
              icon={Boxes}
              tone="brand"
            />
            <StatCard
              label="Bénéfice estimé"
              value={formatMAD(stats.estimatedProfit)}
              hint="Ventes − Achats − Frais"
              icon={TrendingUp}
              tone={stats.estimatedProfit >= 0 ? "brand" : "red"}
            />
            <StatCard
              label="Alertes stock bas"
              value={String(stats.lowStockCount)}
              hint="Produits à réapprovisionner"
              icon={AlertTriangle}
              tone={stats.lowStockCount > 0 ? "amber" : "slate"}
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total ventes"
              value={formatMAD(stats.totalSales)}
              icon={Receipt}
              tone="brand"
            />
            <StatCard
              label="Total achats"
              value={formatMAD(stats.totalPurchases)}
              icon={ShoppingCart}
              tone="accent"
            />
            <StatCard
              label="Total frais"
              value={formatMAD(stats.totalExpenses)}
              icon={Wallet}
              tone="slate"
            />
            <StatCard
              label="Factures impayées"
              value={formatMAD(stats.unpaidInvoicesAmount)}
              hint={`${stats.unpaidInvoicesCount} facture(s)`}
              icon={FileWarning}
              tone={stats.unpaidInvoicesCount > 0 ? "red" : "slate"}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Low stock alerts */}
            <section className="card">
              <SectionHeader
                title="Alertes de stock bas"
                icon={
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                }
                action={
                  <Link
                    href="/produits"
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Voir les produits
                  </Link>
                }
              />
              {lowStock.length === 0 ? (
                <EmptyState
                  title="Aucune alerte"
                  description="Tous vos produits sont au-dessus du seuil minimum."
                  icon={<Boxes className="h-8 w-8" />}
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {lowStock.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {categoryName(db, p.categoryId)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="badge bg-amber-50 text-amber-700">
                          {p.stock} / {p.minStock} {p.unit.split(" ")[0]}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Unpaid invoices */}
            <section className="card">
              <SectionHeader
                title="Factures impayées"
                icon={<FileWarning className="h-5 w-5 text-red-500" />}
              />
              {unpaidInvoices.length === 0 ? (
                <EmptyState
                  title="Tout est réglé"
                  description="Aucune facture en attente de paiement."
                  icon={<Receipt className="h-8 w-8" />}
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {unpaidInvoices.map((inv) => {
                    const client = db.clients.find(
                      (c) => c.id === inv.clientId
                    );
                    return (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-4 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {inv.number}
                          </p>
                          <p className="text-xs text-slate-500">
                            {client?.name ?? "—"} · {formatDate(inv.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-sm font-semibold text-slate-800">
                            {formatMAD(inv.amount)}
                          </span>
                          <span
                            className={`badge ${
                              inv.status === "partial"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {inv.status === "partial"
                              ? "Partiel"
                              : "Impayée"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Recent stock movements */}
          <section className="card">
            <SectionHeader
              title="Derniers mouvements de stock"
              icon={<Boxes className="h-5 w-5 text-brand-600" />}
            />
            {recentMovements.length === 0 ? (
              <EmptyState
                title="Aucun mouvement"
                description="Les entrées et sorties de stock apparaîtront ici."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentMovements.map((m) => {
                  const product = db.products.find(
                    (p) => p.id === m.productId
                  );
                  const isIn = m.type === "in";
                  const isOut = m.type === "out";
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`rounded-lg p-1.5 ${
                            isIn
                              ? "bg-brand-50 text-brand-700"
                              : isOut
                              ? "bg-accent-50 text-accent-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isIn ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : isOut ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <Settings2 className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {product?.name ?? "Produit supprimé"}
                          </p>
                          <p className="text-xs text-slate-500">{m.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm font-semibold ${
                            isIn
                              ? "text-brand-700"
                              : isOut
                              ? "text-accent-700"
                              : "text-slate-600"
                          }`}
                        >
                          {isIn ? "+" : isOut ? "−" : "±"}
                          {m.qty}
                        </span>
                        <p className="text-xs text-slate-400">
                          {formatDate(m.date)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function SectionHeader({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse bg-slate-50" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card h-64 animate-pulse bg-slate-50" />
        <div className="card h-64 animate-pulse bg-slate-50" />
      </div>
    </div>
  );
}
