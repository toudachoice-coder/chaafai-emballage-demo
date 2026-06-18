"use client";

import React, { useMemo, useState } from "react";
import {
  Printer,
  Download,
  RotateCcw,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Wallet,
  Users,
  Truck,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDatabase } from "@/hooks/useDatabase";
import {
  clientName,
  supplierName,
  statusLabel,
  resteOf,
  paidOf,
} from "@/lib/store";
import {
  filterSales,
  filterPurchases,
  filterExpenses,
  getReportSummary,
  getUnpaidClients,
  getSuppliersToPay,
  getTopProductsReport,
  getStockReport,
  type ReportFilters,
} from "@/lib/reports";
import { exportCSV } from "@/lib/csv";
import { formatMAD, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

const TABS = [
  { key: "ventes", tKey: "rep.tVentes" },
  { key: "achats", tKey: "rep.tAchats" },
  { key: "frais", tKey: "rep.tFrais" },
  { key: "stock", tKey: "rep.tStock" },
  { key: "benefice", tKey: "rep.tBenefice" },
  { key: "impayes", tKey: "rep.tImpayes" },
  { key: "fournisseurs", tKey: "rep.tFournisseurs" },
  { key: "top", tKey: "rep.tTop" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const money = (n: number) => n.toFixed(2);

export default function ReportsPage() {
  const { db, ready } = useDatabase();
  const { t } = useI18n();

  const [filters, setFilters] = useState<ReportFilters>({ status: "all" });
  const [tab, setTab] = useState<TabKey>("ventes");

  const set = (patch: Partial<ReportFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const summary = useMemo(
    () => (db ? getReportSummary(db, filters) : null),
    [db, filters]
  );

  const sales = useMemo(
    () => (db ? filterSales(db, filters) : []),
    [db, filters]
  );
  const purchases = useMemo(
    () => (db ? filterPurchases(db, filters) : []),
    [db, filters]
  );
  const expenses = useMemo(
    () => (db ? filterExpenses(db, filters) : []),
    [db, filters]
  );
  const unpaidClients = useMemo(
    () => (db ? getUnpaidClients(db, filters) : []),
    [db, filters]
  );
  const suppliersToPay = useMemo(
    () => (db ? getSuppliersToPay(db, filters) : []),
    [db, filters]
  );
  const topProducts = useMemo(
    () => (db ? getTopProductsReport(db, filters) : []),
    [db, filters]
  );
  const stockRows = useMemo(
    () => (db ? getStockReport(db, filters) : []),
    [db, filters]
  );

  const rangeLabel =
    filters.from || filters.to
      ? `${filters.from ? formatDate(filters.from) : "…"} → ${
          filters.to ? formatDate(filters.to) : "…"
        }`
      : "Toutes les dates";

  const handleExport = () => {
    if (!db) return;
    const stamp = new Date().toISOString().slice(0, 10);
    switch (tab) {
      case "ventes":
        return exportCSV(
          `ventes_${stamp}`,
          ["Date", "Client", "Articles", "Total", "Statut", "Payé", "Reste"],
          sales.map((s) => [
            formatDate(s.date),
            clientName(db, s.clientId),
            s.items.reduce((n, it) => n + it.qty, 0),
            money(s.total),
            statusLabel(s.status),
            money(paidOf(s)),
            money(resteOf(s)),
          ])
        );
      case "achats":
        return exportCSV(
          `achats_${stamp}`,
          ["Date", "Fournisseur", "N° facture", "Total", "Statut", "Payé", "Reste"],
          purchases.map((p) => [
            formatDate(p.date),
            supplierName(db, p.supplierId),
            p.invoiceNumber ?? "",
            money(p.total),
            statusLabel(p.status),
            money(paidOf(p)),
            money(resteOf(p)),
          ])
        );
      case "frais":
        return exportCSV(
          `frais_${stamp}`,
          ["Date", "Description", "Catégorie", "Paiement", "Montant"],
          expenses.map((e) => [
            formatDate(e.date),
            e.label,
            e.category,
            e.paymentMethod ?? "",
            money(e.amount),
          ])
        );
      case "stock":
        return exportCSV(
          `stock_${stamp}`,
          ["Produit", "Catégorie", "Stock", "Seuil", "Coût", "Valeur", "Alerte"],
          stockRows.map((r) => [
            r.name,
            r.category,
            r.stock,
            r.minStock,
            money(r.costPrice),
            money(r.stockValue),
            r.low ? "Oui" : "Non",
          ])
        );
      case "benefice":
        return exportCSV(
          `benefice_${stamp}`,
          ["Indicateur", "Montant"],
          [
            ["Total ventes", money(summary!.totalSales)],
            ["Total achats", money(summary!.totalPurchases)],
            ["Total frais", money(summary!.totalExpenses)],
            ["Bénéfice estimé", money(summary!.estimatedProfit)],
          ]
        );
      case "impayes":
        return exportCSV(
          `impayes_clients_${stamp}`,
          ["Client", "Facturé", "Payé", "Reste dû"],
          unpaidClients.map((r) => [
            r.name,
            money(r.invoiced),
            money(r.paid),
            money(r.due),
          ])
        );
      case "fournisseurs":
        return exportCSV(
          `fournisseurs_a_payer_${stamp}`,
          ["Fournisseur", "Acheté", "Payé", "Reste à payer"],
          suppliersToPay.map((r) => [
            r.name,
            money(r.purchased),
            money(r.paid),
            money(r.due),
          ])
        );
      case "top":
        return exportCSV(
          `top_produits_${stamp}`,
          ["Produit", "Quantité vendue", "Chiffre d'affaires"],
          topProducts.map((r) => [r.name, r.qty, money(r.revenue)])
        );
    }
  };

  return (
    <AppShell
      title={t("page.rapports.title")}
      subtitle={t("page.rapports.subtitle")}
      actions={
        <button className="btn-secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">{t("common.print")}</span>
        </button>
      }
    >
      {!ready || !db || !summary ? (
        <div className="card h-96 animate-pulse bg-slate-50" />
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="no-print card p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div>
                <label className="label">{t("rep.from")}</label>
                <input
                  type="date"
                  className="input"
                  value={filters.from ?? ""}
                  onChange={(e) => set({ from: e.target.value || undefined })}
                />
              </div>
              <div>
                <label className="label">{t("rep.to")}</label>
                <input
                  type="date"
                  className="input"
                  value={filters.to ?? ""}
                  onChange={(e) => set({ to: e.target.value || undefined })}
                />
              </div>
              <div>
                <label className="label">{t("common.client")}</label>
                <select
                  className="input"
                  value={filters.clientId ?? ""}
                  onChange={(e) =>
                    set({ clientId: e.target.value || undefined })
                  }
                >
                  <option value="">{t("common.all")}</option>
                  {db.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("common.supplier")}</label>
                <select
                  className="input"
                  value={filters.supplierId ?? ""}
                  onChange={(e) =>
                    set({ supplierId: e.target.value || undefined })
                  }
                >
                  <option value="">{t("common.all")}</option>
                  {db.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("tbl.product")}</label>
                <select
                  className="input"
                  value={filters.productId ?? ""}
                  onChange={(e) =>
                    set({ productId: e.target.value || undefined })
                  }
                >
                  <option value="">{t("common.all")}</option>
                  {db.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("common.category")}</label>
                <select
                  className="input"
                  value={filters.categoryId ?? ""}
                  onChange={(e) =>
                    set({ categoryId: e.target.value || undefined })
                  }
                >
                  <option value="">{t("common.allF")}</option>
                  {db.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t("field.paymentStatus")}</label>
                <select
                  className="input"
                  value={filters.status ?? "all"}
                  onChange={(e) =>
                    set({
                      status: e.target.value as ReportFilters["status"],
                    })
                  }
                >
                  <option value="all">{t("common.all")}</option>
                  <option value="paid">{t("status.paid")}</option>
                  <option value="partial">{t("status.partial")}</option>
                  <option value="unpaid">{t("status.unpaid")}</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  className="btn-secondary w-full"
                  onClick={() => setFilters({ status: "all" })}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("rep.reset")}
                </button>
              </div>
            </div>
          </div>

          {/* Printable area */}
          <div className="print-area space-y-6">
            {/* Print-only header */}
            <div className="hidden items-center justify-between border-b border-slate-200 pb-3 print:flex">
              <div>
                <div className="text-lg font-bold text-slate-900">
                  {t("rep.headerTitle")}
                </div>
                <div className="text-sm text-slate-500">
                  {t(TABS.find((x) => x.key === tab)?.tKey ?? "")} · {rangeLabel}
                </div>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label={t("dash.totalSales")}
                value={formatMAD(summary.totalSales)}
                icon={Receipt}
                tone="brand"
              />
              <StatCard
                label={t("dash.totalPurchases")}
                value={formatMAD(summary.totalPurchases)}
                icon={ShoppingCart}
                tone="accent"
              />
              <StatCard
                label={t("dash.totalExpenses")}
                value={formatMAD(summary.totalExpenses)}
                icon={Wallet}
                tone="slate"
              />
              <StatCard
                label={t("dash.estimatedProfit")}
                value={formatMAD(summary.estimatedProfit)}
                hint={t("dash.hintProfitFormula")}
                icon={TrendingUp}
                tone={summary.estimatedProfit >= 0 ? "brand" : "red"}
              />
              <StatCard
                label={t("rep.kpiUnpaidClients")}
                value={formatMAD(summary.unpaidClients)}
                icon={Users}
                tone={summary.unpaidClients > 0 ? "red" : "slate"}
              />
              <StatCard
                label={t("rep.kpiSupplierPayables")}
                value={formatMAD(summary.supplierPayables)}
                icon={Truck}
                tone={summary.supplierPayables > 0 ? "amber" : "slate"}
              />
              <StatCard
                label={t("rep.kpiStockValue")}
                value={formatMAD(summary.stockValue)}
                icon={Boxes}
                tone="brand"
              />
              <StatCard
                label={t("rep.kpiLowStock")}
                value={String(summary.lowStockCount)}
                icon={AlertTriangle}
                tone={summary.lowStockCount > 0 ? "amber" : "slate"}
              />
            </div>

            {/* Tabs + export */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="no-print flex flex-wrap gap-2">
                {TABS.map((tabItem) => (
                  <button
                    key={tabItem.key}
                    onClick={() => setTab(tabItem.key)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      tab === tabItem.key
                        ? "bg-brand-600 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {t(tabItem.tKey)}
                  </button>
                ))}
              </div>
              <button className="btn-secondary no-print" onClick={handleExport}>
                <Download className="h-4 w-4" />
                {t("rep.export")}
              </button>
            </div>

            {/* Active report */}
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {t(TABS.find((x) => x.key === tab)?.tKey ?? "")}
                </h2>
              </div>
              <ReportTable
                tab={tab}
                db={db}
                sales={sales}
                purchases={purchases}
                expenses={expenses}
                unpaidClients={unpaidClients}
                suppliersToPay={suppliersToPay}
                topProducts={topProducts}
                stockRows={stockRows}
                summary={summary}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ReportTable({
  tab,
  db,
  sales,
  purchases,
  expenses,
  unpaidClients,
  suppliersToPay,
  topProducts,
  stockRows,
  summary,
}: any) {
  const { t } = useI18n();
  const empty = (
    <EmptyState title={t("rep.noData")} description={t("rep.noDataDesc")} />
  );

  if (tab === "ventes")
    return sales.length === 0 ? (
      empty
    ) : (
      <Table
        head={[
          t("common.date"),
          t("common.client"),
          t("rep.articles"),
          t("common.total"),
          t("common.status"),
          t("common.remaining"),
        ]}
      >
        {sales.map((s: any) => (
          <tr key={s.id} className="hover:bg-slate-50/60">
            <Td>{formatDate(s.date)}</Td>
            <Td bold>{clientName(db, s.clientId)}</Td>
            <Td>{s.items.reduce((n: number, it: any) => n + it.qty, 0)}</Td>
            <Td right>{formatMAD(s.total)}</Td>
            <Td>{t(`status.${s.status}`)}</Td>
            <TdMoney value={resteOf(s)} />
          </tr>
        ))}
      </Table>
    );

  if (tab === "achats")
    return purchases.length === 0 ? (
      empty
    ) : (
      <Table
        head={[
          t("common.date"),
          t("common.supplier"),
          t("rep.invoiceNo"),
          t("common.total"),
          t("common.status"),
          t("common.remaining"),
        ]}
      >
        {purchases.map((p: any) => (
          <tr key={p.id} className="hover:bg-slate-50/60">
            <Td>{formatDate(p.date)}</Td>
            <Td bold>{supplierName(db, p.supplierId)}</Td>
            <Td>{p.invoiceNumber ?? "—"}</Td>
            <Td right>{formatMAD(p.total)}</Td>
            <Td>{t(`status.${p.status}`)}</Td>
            <TdMoney value={resteOf(p)} />
          </tr>
        ))}
      </Table>
    );

  if (tab === "frais")
    return expenses.length === 0 ? (
      empty
    ) : (
      <Table
        head={[
          t("common.date"),
          t("field.description"),
          t("common.category"),
          t("inv.payment"),
          t("common.amount"),
        ]}
      >
        {expenses.map((e: any) => (
          <tr key={e.id} className="hover:bg-slate-50/60">
            <Td>{formatDate(e.date)}</Td>
            <Td bold>{e.label}</Td>
            <Td>{e.category}</Td>
            <Td>{e.paymentMethod ?? "—"}</Td>
            <Td right>{formatMAD(e.amount)}</Td>
          </tr>
        ))}
      </Table>
    );

  if (tab === "stock")
    return stockRows.length === 0 ? (
      empty
    ) : (
      <Table
        head={[
          t("tbl.product"),
          t("common.category"),
          t("tbl.stock"),
          t("rep.threshold"),
          t("rep.value"),
          t("rep.alert"),
        ]}
      >
        {stockRows.map((r: any) => (
          <tr key={r.productId} className="hover:bg-slate-50/60">
            <Td bold>{r.name}</Td>
            <Td>{r.category}</Td>
            <Td right>{r.stock}</Td>
            <Td right>{r.minStock}</Td>
            <Td right>{formatMAD(r.stockValue)}</Td>
            <Td>
              {r.low ? (
                <span className="badge bg-amber-50 text-amber-700">
                  {t("rep.lowStockBadge")}
                </span>
              ) : (
                <span className="text-slate-400">OK</span>
              )}
            </Td>
          </tr>
        ))}
      </Table>
    );

  if (tab === "benefice")
    return (
      <Table head={[t("rep.indicator"), t("common.amount")]}>
        <BeneficeRow label={t("dash.totalSales")} value={summary.totalSales} />
        <BeneficeRow
          label={t("dash.totalPurchases")}
          value={-summary.totalPurchases}
        />
        <BeneficeRow
          label={t("dash.totalExpenses")}
          value={-summary.totalExpenses}
        />
        <tr className="bg-slate-50 font-bold">
          <Td bold>{t("dash.estimatedProfit")}</Td>
          <td
            className={`px-5 py-3 text-right font-bold ${
              summary.estimatedProfit >= 0 ? "text-brand-700" : "text-red-600"
            }`}
          >
            {formatMAD(summary.estimatedProfit)}
          </td>
        </tr>
      </Table>
    );

  if (tab === "impayes")
    return unpaidClients.length === 0 ? (
      empty
    ) : (
      <Table
        head={[
          t("common.client"),
          t("rep.invoiced"),
          t("common.paid"),
          t("rep.dueClient"),
        ]}
      >
        {unpaidClients.map((r: any) => (
          <tr key={r.clientId} className="hover:bg-slate-50/60">
            <Td bold>{r.name}</Td>
            <Td right>{formatMAD(r.invoiced)}</Td>
            <Td right>{formatMAD(r.paid)}</Td>
            <TdMoney value={r.due} />
          </tr>
        ))}
      </Table>
    );

  if (tab === "fournisseurs")
    return suppliersToPay.length === 0 ? (
      empty
    ) : (
      <Table
        head={[
          t("common.supplier"),
          t("rep.purchased"),
          t("common.paid"),
          t("rep.duePay"),
        ]}
      >
        {suppliersToPay.map((r: any) => (
          <tr key={r.supplierId} className="hover:bg-slate-50/60">
            <Td bold>{r.name}</Td>
            <Td right>{formatMAD(r.purchased)}</Td>
            <Td right>{formatMAD(r.paid)}</Td>
            <TdMoney value={r.due} />
          </tr>
        ))}
      </Table>
    );

  // top
  return topProducts.length === 0 ? (
    empty
  ) : (
    <Table
      head={["#", t("tbl.product"), t("rep.qtySold"), t("rep.revenue")]}
    >
      {topProducts.map((r: any, i: number) => (
        <tr key={r.productId} className="hover:bg-slate-50/60">
          <Td>{i + 1}</Td>
          <Td bold>{r.name}</Td>
          <Td right>{r.qty}</Td>
          <Td right>{formatMAD(r.revenue)}</Td>
        </tr>
      ))}
    </Table>
  );
}

function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                className={`px-5 py-3 ${
                  i >= 2 && i === head.length - 1 ? "text-right" : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function Td({
  children,
  right,
  bold,
}: {
  children: React.ReactNode;
  right?: boolean;
  bold?: boolean;
}) {
  return (
    <td
      className={`px-5 py-3 ${right ? "text-right" : ""} ${
        bold ? "font-medium text-slate-800" : "text-slate-600"
      }`}
    >
      {children}
    </td>
  );
}

function TdMoney({ value }: { value: number }) {
  return (
    <td className="px-5 py-3 text-right">
      {value > 0 ? (
        <span className="font-semibold text-red-600">{formatMAD(value)}</span>
      ) : (
        <span className="text-slate-400">—</span>
      )}
    </td>
  );
}

function BeneficeRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="hover:bg-slate-50/60">
      <Td bold>{label}</Td>
      <td
        className={`px-5 py-3 text-right font-medium ${
          value >= 0 ? "text-slate-800" : "text-red-600"
        }`}
      >
        {formatMAD(value)}
      </td>
    </tr>
  );
}
