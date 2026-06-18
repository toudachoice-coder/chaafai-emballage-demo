// Reporting data layer: pure functions that filter and aggregate the
// localStorage database. Kept separate from store.ts (mutations) but part of
// the same data layer, so report pages stay presentational.

import type { Database, Expense, PaymentStatus, Purchase, Sale } from "./types";
import { paidOf, resteOf } from "./store";

export interface ReportFilters {
  from?: string;
  to?: string;
  clientId?: string;
  supplierId?: string;
  productId?: string;
  categoryId?: string;
  status?: "all" | PaymentStatus;
}

function inRange(iso: string, from?: string, to?: string): boolean {
  const d = iso.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function filterSales(db: Database, f: ReportFilters): Sale[] {
  return db.sales
    .filter((s) => inRange(s.date, f.from, f.to))
    .filter((s) => (f.clientId ? s.clientId === f.clientId : true))
    .filter((s) =>
      f.status && f.status !== "all" ? s.status === f.status : true
    )
    .filter((s) =>
      f.productId ? s.items.some((it) => it.productId === f.productId) : true
    )
    .filter((s) =>
      f.categoryId
        ? s.items.some(
            (it) =>
              db.products.find((p) => p.id === it.productId)?.categoryId ===
              f.categoryId
          )
        : true
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function filterPurchases(db: Database, f: ReportFilters): Purchase[] {
  return db.purchases
    .filter((p) => inRange(p.date, f.from, f.to))
    .filter((p) => (f.supplierId ? p.supplierId === f.supplierId : true))
    .filter((p) =>
      f.status && f.status !== "all" ? p.status === f.status : true
    )
    .filter((p) =>
      f.productId ? p.items.some((it) => it.productId === f.productId) : true
    )
    .filter((p) =>
      f.categoryId
        ? p.items.some(
            (it) =>
              db.products.find((pr) => pr.id === it.productId)?.categoryId ===
              f.categoryId
          )
        : true
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function filterExpenses(db: Database, f: ReportFilters): Expense[] {
  return db.expenses
    .filter((e) => inRange(e.date, f.from, f.to))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface ReportSummary {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  estimatedProfit: number;
  unpaidClients: number;
  supplierPayables: number;
  stockValue: number;
  lowStockCount: number;
}

/**
 * Headline figures. Flow metrics (sales/purchases/expenses/profit/unpaid)
 * respect the filters; stock metrics reflect the current inventory.
 */
export function getReportSummary(
  db: Database,
  f: ReportFilters
): ReportSummary {
  const sales = filterSales(db, f);
  const purchases = filterPurchases(db, f);
  const expenses = filterExpenses(db, f);

  const totalSales = sales.reduce((s, x) => s + x.total, 0);
  const totalPurchases = purchases.reduce((s, x) => s + x.total, 0);
  const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);

  return {
    totalSales,
    totalPurchases,
    totalExpenses,
    estimatedProfit: totalSales - totalPurchases - totalExpenses,
    unpaidClients: sales.reduce((s, x) => s + resteOf(x), 0),
    supplierPayables: purchases.reduce((s, x) => s + resteOf(x), 0),
    stockValue: db.products.reduce((s, p) => s + p.costPrice * p.stock, 0),
    lowStockCount: db.products.filter((p) => p.stock <= p.minStock).length,
  };
}

export interface ClientBalanceRow {
  clientId: string;
  name: string;
  invoiced: number;
  paid: number;
  due: number;
}

/** Clients with an outstanding balance (respecting client/date filters). */
export function getUnpaidClients(
  db: Database,
  f: ReportFilters
): ClientBalanceRow[] {
  const sales = filterSales(db, { ...f, status: "all" });
  const map = new Map<string, ClientBalanceRow>();
  for (const s of sales) {
    const c = db.clients.find((x) => x.id === s.clientId);
    const row =
      map.get(s.clientId) ??
      {
        clientId: s.clientId,
        name: c?.name ?? "—",
        invoiced: 0,
        paid: 0,
        due: 0,
      };
    row.invoiced += s.total;
    row.paid += paidOf(s);
    row.due += resteOf(s);
    map.set(s.clientId, row);
  }
  return [...map.values()]
    .filter((r) => r.due > 0)
    .sort((a, b) => b.due - a.due);
}

export interface SupplierBalanceRow {
  supplierId: string;
  name: string;
  purchased: number;
  paid: number;
  due: number;
}

export function getSuppliersToPay(
  db: Database,
  f: ReportFilters
): SupplierBalanceRow[] {
  const purchases = filterPurchases(db, { ...f, status: "all" });
  const map = new Map<string, SupplierBalanceRow>();
  for (const p of purchases) {
    const sup = db.suppliers.find((x) => x.id === p.supplierId);
    const row =
      map.get(p.supplierId) ??
      {
        supplierId: p.supplierId,
        name: sup?.name ?? "—",
        purchased: 0,
        paid: 0,
        due: 0,
      };
    row.purchased += p.total;
    row.paid += paidOf(p);
    row.due += resteOf(p);
    map.set(p.supplierId, row);
  }
  return [...map.values()]
    .filter((r) => r.due > 0)
    .sort((a, b) => b.due - a.due);
}

export interface ProductSalesRow {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
}

/** Top products by quantity sold within the filtered sales. */
export function getTopProductsReport(
  db: Database,
  f: ReportFilters
): ProductSalesRow[] {
  const sales = filterSales(db, f);
  const map = new Map<string, ProductSalesRow>();
  for (const s of sales) {
    for (const it of s.items) {
      if (f.productId && it.productId !== f.productId) continue;
      if (
        f.categoryId &&
        db.products.find((p) => p.id === it.productId)?.categoryId !==
          f.categoryId
      )
        continue;
      const row =
        map.get(it.productId) ??
        { productId: it.productId, name: it.name, qty: 0, revenue: 0 };
      row.qty += it.qty;
      row.revenue += it.qty * it.unitPrice;
      map.set(it.productId, row);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty);
}

export interface StockRow {
  productId: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  costPrice: number;
  stockValue: number;
  low: boolean;
}

/** Current inventory snapshot (filtered by product / category). */
export function getStockReport(db: Database, f: ReportFilters): StockRow[] {
  return db.products
    .filter((p) => (f.productId ? p.id === f.productId : true))
    .filter((p) => (f.categoryId ? p.categoryId === f.categoryId : true))
    .map((p) => ({
      productId: p.id,
      name: p.name,
      category:
        db.categories.find((c) => c.id === p.categoryId)?.name ?? "—",
      stock: p.stock,
      minStock: p.minStock,
      costPrice: p.costPrice,
      stockValue: p.costPrice * p.stock,
      low: p.stock <= p.minStock,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
