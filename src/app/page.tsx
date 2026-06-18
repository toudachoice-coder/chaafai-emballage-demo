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
  Trophy,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDatabase } from "@/hooks/useDatabase";
import {
  getDashboardStats,
  getTopProducts,
  getRecentOperations,
  categoryName,
  clientName,
  resteOf,
} from "@/lib/store";
import { formatMAD, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

const opStyles = {
  vente: { tKey: "dash.opVente", cls: "bg-brand-50 text-brand-700", icon: Receipt },
  achat: {
    tKey: "dash.opAchat",
    cls: "bg-accent-50 text-accent-700",
    icon: ShoppingCart,
  },
  frais: { tKey: "dash.opFrais", cls: "bg-slate-100 text-slate-600", icon: Wallet },
} as const;

export default function DashboardPage() {
  const { db, ready } = useDatabase();
  const { t } = useI18n();

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

  const unpaidSales = useMemo(
    () =>
      db
        ? db.sales
            .filter((s) => resteOf(s) > 0)
            .sort((a, b) => (a.date < b.date ? 1 : -1))
        : [],
    [db]
  );

  const topProducts = useMemo(() => (db ? getTopProducts(db, 5) : []), [db]);
  const recentOps = useMemo(() => (db ? getRecentOperations(db, 8) : []), [db]);

  return (
    <AppShell
      title={t("page.dashboard.title")}
      subtitle={t("page.dashboard.subtitle")}
    >
      {!ready || !stats || !db ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Primary KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("dash.products")}
              value={String(stats.productCount)}
              hint={t("dash.hintClientsSuppliers", {
                c: stats.clientCount,
                s: stats.supplierCount,
              })}
              icon={Package}
              tone="accent"
            />
            <StatCard
              label={t("dash.stockValue")}
              value={formatMAD(stats.stockValue)}
              hint={t("dash.hintSaleValue", {
                v: formatMAD(stats.potentialRevenue),
              })}
              icon={Boxes}
              tone="brand"
            />
            <StatCard
              label={t("dash.estimatedProfit")}
              value={formatMAD(stats.estimatedProfit)}
              hint={t("dash.hintProfitFormula")}
              icon={TrendingUp}
              tone={stats.estimatedProfit >= 0 ? "brand" : "red"}
            />
            <StatCard
              label={t("dash.lowStockAlerts")}
              value={String(stats.lowStockCount)}
              hint={t("dash.hintReplenish")}
              icon={AlertTriangle}
              tone={stats.lowStockCount > 0 ? "amber" : "slate"}
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("dash.totalSales")}
              value={formatMAD(stats.totalSales)}
              icon={Receipt}
              tone="brand"
            />
            <StatCard
              label={t("dash.totalPurchases")}
              value={formatMAD(stats.totalPurchases)}
              icon={ShoppingCart}
              tone="accent"
            />
            <StatCard
              label={t("dash.totalExpenses")}
              value={formatMAD(stats.totalExpenses)}
              icon={Wallet}
              tone="slate"
            />
            <StatCard
              label={t("dash.unpaidSales")}
              value={formatMAD(stats.unpaidSalesAmount)}
              hint={t("dash.hintUnpaid", {
                n: stats.unpaidSalesCount,
                v: formatMAD(stats.supplierPayables),
              })}
              icon={FileWarning}
              tone={stats.unpaidSalesCount > 0 ? "red" : "slate"}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Low stock alerts */}
            <section className="card">
              <SectionHeader
                title={t("dash.secLowStock")}
                icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                action={
                  <Link
                    href="/produits"
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    {t("dash.viewProducts")}
                  </Link>
                }
              />
              {lowStock.length === 0 ? (
                <EmptyState
                  title={t("dash.noAlert")}
                  description={t("dash.noAlertDesc")}
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
                      <span className="badge bg-amber-50 text-amber-700">
                        {p.stock} / {p.minStock} {p.unit.split(" ")[0]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Unpaid sales */}
            <section className="card">
              <SectionHeader
                title={t("dash.secUnpaid")}
                icon={<FileWarning className="h-5 w-5 text-red-500" />}
                action={
                  <Link
                    href="/ventes"
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    {t("dash.viewSales")}
                  </Link>
                }
              />
              {unpaidSales.length === 0 ? (
                <EmptyState
                  title={t("dash.allSettled")}
                  description={t("dash.allSettledDesc")}
                  icon={<Receipt className="h-8 w-8" />}
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {unpaidSales.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {clientName(db, s.clientId)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(s.date)} · {t("dash.totalShort", {
                            v: formatMAD(s.total),
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-red-600">
                        {formatMAD(resteOf(s))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Top products */}
            <section className="card">
              <SectionHeader
                title={t("dash.secTop")}
                icon={<Trophy className="h-5 w-5 text-amber-500" />}
              />
              {topProducts.length === 0 ? (
                <EmptyState
                  title={t("dash.noSales")}
                  description={t("dash.noSalesDesc")}
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {topProducts.map((top, i) => (
                    <li
                      key={top.productId}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                          {i + 1}
                        </span>
                        <p className="truncate text-sm font-medium text-slate-800">
                          {top.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">
                          {top.qty}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatMAD(top.revenue)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent operations */}
            <section className="card">
              <SectionHeader
                title={t("dash.secRecent")}
                icon={<Activity className="h-5 w-5 text-brand-600" />}
              />
              {recentOps.length === 0 ? (
                <EmptyState
                  title={t("dash.noOps")}
                  description={t("dash.noOpsDesc")}
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentOps.map((op) => {
                    const style = opStyles[op.kind];
                    const Icon = style.icon;
                    return (
                      <li
                        key={`${op.kind}-${op.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`rounded-lg p-1.5 ${style.cls}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {op.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {t(style.tKey)} · {formatDate(op.date)}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">
                          {formatMAD(op.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
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
