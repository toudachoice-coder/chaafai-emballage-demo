// Client-side persistence layer backed by localStorage.
//
// All reads/writes are guarded so nothing touches `window` during SSR /
// static export. A tiny pub/sub lets React components re-render when the
// data changes. Business operations (CRUD + stock movements) live here so
// every module shares the same rules.

import type {
  Category,
  Database,
  Product,
  StockMovement,
} from "./types";
import { createSeedDatabase } from "./seed";
import { uid } from "./format";

const STORAGE_KEY = "chaafai_emballage_db_v1";

const emptyDb: Database = {
  categories: [],
  products: [],
  clients: [],
  suppliers: [],
  purchases: [],
  sales: [],
  expenses: [],
  movements: [],
  invoices: [],
};

const isBrowser = () => typeof window !== "undefined";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reads the full database, seeding demo data on first ever load. */
export function getDB(): Database {
  if (!isBrowser()) return emptyDb;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedDatabase();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<Database>;
    // Merge with empty shape so a missing collection never crashes a module.
    return { ...emptyDb, ...parsed };
  } catch {
    return emptyDb;
  }
}

function saveDB(db: Database) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  notify();
}

/** Read-modify-write helper. */
function mutate(fn: (db: Database) => Database) {
  const next = fn(getDB());
  saveDB(next);
  return next;
}

/** Wipes localStorage and re-seeds demo data. */
export function resetDemoData() {
  if (!isBrowser()) return;
  const seeded = createSeedDatabase();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  notify();
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function addCategory(name: string): Category {
  const category: Category = {
    id: uid("cat"),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  mutate((db) => ({ ...db, categories: [...db.categories, category] }));
  return category;
}

export function updateCategory(id: string, name: string) {
  mutate((db) => ({
    ...db,
    categories: db.categories.map((c) =>
      c.id === id ? { ...c, name: name.trim() } : c
    ),
  }));
}

/** Removes a category only if no product references it. Returns success. */
export function deleteCategory(id: string): boolean {
  const db = getDB();
  if (db.products.some((p) => p.categoryId === id)) return false;
  mutate((d) => ({
    ...d,
    categories: d.categories.filter((c) => c.id !== id),
  }));
  return true;
}

// ---------------------------------------------------------------------------
// Stock movements
// ---------------------------------------------------------------------------

export function addMovement(
  productId: string,
  type: StockMovement["type"],
  qty: number,
  reason: string
): StockMovement {
  const movement: StockMovement = {
    id: uid("mov"),
    productId,
    type,
    qty: Math.abs(qty),
    reason,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  mutate((db) => ({ ...db, movements: [movement, ...db.movements] }));
  return movement;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export function addProduct(input: ProductInput): Product {
  const ts = new Date().toISOString();
  const product: Product = {
    ...input,
    id: uid("prod"),
    createdAt: ts,
    updatedAt: ts,
  };
  mutate((db) => {
    const movements = [...db.movements];
    if (product.stock > 0) {
      movements.unshift({
        id: uid("mov"),
        productId: product.id,
        type: "in",
        qty: product.stock,
        reason: "Stock initial",
        date: ts,
        createdAt: ts,
      });
    }
    return { ...db, products: [...db.products, product], movements };
  });
  return product;
}

export function updateProduct(
  id: string,
  input: ProductInput
): Product | undefined {
  let updated: Product | undefined;
  mutate((db) => {
    const prev = db.products.find((p) => p.id === id);
    const movements = [...db.movements];
    const ts = new Date().toISOString();

    // Any manual change to stock quantity is recorded as an adjustment.
    if (prev && prev.stock !== input.stock) {
      const diff = input.stock - prev.stock;
      movements.unshift({
        id: uid("mov"),
        productId: id,
        type: "adjust",
        qty: Math.abs(diff),
        reason: `Ajustement stock (${diff > 0 ? "+" : ""}${diff})`,
        date: ts,
        createdAt: ts,
      });
    }

    const products = db.products.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...input, id, updatedAt: ts };
      return updated;
    });
    return { ...db, products, movements };
  });
  return updated;
}

export function deleteProduct(id: string) {
  mutate((db) => ({
    ...db,
    products: db.products.filter((p) => p.id !== id),
    movements: db.movements.filter((m) => m.productId !== id),
  }));
}

// ---------------------------------------------------------------------------
// Derived data / dashboard stats
// ---------------------------------------------------------------------------

export interface DashboardStats {
  productCount: number;
  stockValue: number;
  potentialRevenue: number;
  lowStockCount: number;
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  estimatedProfit: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesAmount: number;
  clientCount: number;
  supplierCount: number;
}

export function getDashboardStats(db: Database): DashboardStats {
  const stockValue = db.products.reduce(
    (sum, p) => sum + p.costPrice * p.stock,
    0
  );
  const potentialRevenue = db.products.reduce(
    (sum, p) => sum + p.sellPrice * p.stock,
    0
  );
  const lowStockCount = db.products.filter(
    (p) => p.stock <= p.minStock
  ).length;
  const totalSales = db.sales.reduce((s, x) => s + x.total, 0);
  const totalPurchases = db.purchases.reduce((s, x) => s + x.total, 0);
  const totalExpenses = db.expenses.reduce((s, x) => s + x.amount, 0);
  const unpaid = db.invoices.filter((i) => i.status !== "paid");

  return {
    productCount: db.products.length,
    stockValue,
    potentialRevenue,
    lowStockCount,
    totalSales,
    totalPurchases,
    totalExpenses,
    estimatedProfit: totalSales - totalPurchases - totalExpenses,
    unpaidInvoicesCount: unpaid.length,
    unpaidInvoicesAmount: unpaid.reduce((s, i) => s + i.amount, 0),
    clientCount: db.clients.length,
    supplierCount: db.suppliers.length,
  };
}

export function categoryName(db: Database, id: string): string {
  return db.categories.find((c) => c.id === id)?.name ?? "—";
}
