// Client-side persistence layer backed by localStorage.
//
// All reads/writes are guarded so nothing touches `window` during SSR /
// static export. A tiny pub/sub lets React components re-render when the
// data changes. ALL business logic (CRUD + stock movements + payment maths)
// lives here so every module shares the same rules and UI stays presentational.

import type {
  Category,
  Client,
  Database,
  Expense,
  Invoice,
  InvoiceStatus,
  LineItem,
  MovementKind,
  MovementType,
  PaymentStatus,
  Product,
  Purchase,
  Sale,
  StockMovement,
  Supplier,
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
    return migrate({ ...emptyDb, ...parsed });
  } catch {
    return emptyDb;
  }
}

/**
 * Backfills fields introduced after Phase 1 so data saved by an earlier
 * version keeps working without a forced reset.
 */
function migrate(db: Database): Database {
  return {
    ...db,
    clients: db.clients.map((c) => ({ ...c, type: c.type ?? "Autre" })),
    purchases: db.purchases.map((p) => ({
      ...p,
      status: p.status ?? "unpaid",
      paidAmount:
        typeof p.paidAmount === "number"
          ? p.paidAmount
          : p.status === "paid"
          ? p.total
          : 0,
    })),
    sales: db.sales.map((s) => ({
      ...s,
      status: s.status ?? "unpaid",
      paidAmount:
        typeof s.paidAmount === "number"
          ? s.paidAmount
          : s.status === "paid"
          ? s.total
          : 0,
    })),
    invoices: db.invoices.map((inv) => ({
      ...inv,
      docStatus: inv.docStatus ?? "Validée",
      tvaRate: typeof inv.tvaRate === "number" ? inv.tvaRate : 0,
    })),
  };
}

function saveDB(db: Database) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  notify();
}

/** Read-modify-write helper (always commits). */
function mutate(fn: (db: Database) => Database) {
  const next = fn(getDB());
  saveDB(next);
  return next;
}

export interface OpResult {
  ok: boolean;
  error?: string;
}

/**
 * Transaction helper: the callback decides whether to commit. Used by
 * operations that can fail validation (e.g. insufficient stock) so we never
 * persist a partial / invalid state.
 */
function transact(
  fn: (db: Database) => { commit: boolean; next?: Database; result: OpResult }
): OpResult {
  const { commit, next, result } = fn(getDB());
  if (commit && next) saveDB(next);
  return result;
}

/** Wipes localStorage and re-seeds demo data. */
export function resetDemoData() {
  if (!isBrowser()) return;
  const seeded = createSeedDatabase();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  notify();
}

const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function makeMovement(params: {
  productId: string;
  type: MovementType;
  kind: MovementKind;
  qty: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  reference?: string;
  date: string;
}): StockMovement {
  return {
    id: uid("mov"),
    productId: params.productId,
    type: params.type,
    kind: params.kind,
    qty: Math.abs(params.qty),
    reason: params.reason,
    reference: params.reference,
    stockBefore: params.stockBefore,
    stockAfter: params.stockAfter,
    date: params.date,
    createdAt: nowIso(),
  };
}

/** Normalises the paid amount so it stays consistent with the status. */
function normalizePaid(
  total: number,
  status: PaymentStatus,
  paidAmount: number
): number {
  if (status === "paid") return total;
  if (status === "unpaid") return 0;
  return Math.min(Math.max(paidAmount, 0), total);
}

// ---------------------------------------------------------------------------
// Payment helpers (exported for the UI)
// ---------------------------------------------------------------------------

interface Payable {
  total: number;
  status: PaymentStatus;
  paidAmount?: number;
}

/** Amount paid, tolerant of legacy records without `paidAmount`. */
export function paidOf(t: Payable): number {
  if (typeof t.paidAmount === "number") return t.paidAmount;
  return t.status === "paid" ? t.total : 0;
}

/** Remaining amount due. */
export function resteOf(t: Payable): number {
  return Math.max(t.total - paidOf(t), 0);
}

export function statusLabel(status: PaymentStatus): string {
  return status === "paid"
    ? "Payé"
    : status === "partial"
    ? "Partiel"
    : "Non payé";
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function addCategory(name: string): Category {
  const category: Category = {
    id: uid("cat"),
    name: name.trim(),
    createdAt: nowIso(),
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
// Products
// ---------------------------------------------------------------------------

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export function addProduct(input: ProductInput): Product {
  const ts = nowIso();
  const product: Product = {
    ...input,
    id: uid("prod"),
    createdAt: ts,
    updatedAt: ts,
  };
  mutate((db) => {
    const movements = [...db.movements];
    if (product.stock > 0) {
      movements.unshift(
        makeMovement({
          productId: product.id,
          type: "in",
          kind: "initial",
          qty: product.stock,
          stockBefore: 0,
          stockAfter: product.stock,
          reason: "Stock initial",
          date: ts,
        })
      );
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
    const ts = nowIso();

    // Any manual change to stock quantity is recorded as an adjustment.
    if (prev && prev.stock !== input.stock) {
      const diff = input.stock - prev.stock;
      movements.unshift(
        makeMovement({
          productId: id,
          type: diff > 0 ? "in" : "out",
          kind: "ajustement",
          qty: Math.abs(diff),
          stockBefore: prev.stock,
          stockAfter: input.stock,
          reason: `Ajustement fiche produit (${diff > 0 ? "+" : ""}${diff})`,
          date: ts,
        })
      );
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
// Clients
// ---------------------------------------------------------------------------

export type ClientInput = Omit<Client, "id" | "createdAt">;

export function addClient(input: ClientInput): Client {
  const client: Client = { ...input, id: uid("cli"), createdAt: nowIso() };
  mutate((db) => ({ ...db, clients: [client, ...db.clients] }));
  return client;
}

export function updateClient(id: string, input: ClientInput) {
  mutate((db) => ({
    ...db,
    clients: db.clients.map((c) => (c.id === id ? { ...c, ...input, id } : c)),
  }));
}

export function deleteClient(id: string) {
  mutate((db) => ({
    ...db,
    clients: db.clients.filter((c) => c.id !== id),
  }));
}

/** Outstanding balance owed by a client (sum of unpaid sale remainders). */
export function clientBalance(db: Database, clientId: string): number {
  return db.sales
    .filter((s) => s.clientId === clientId)
    .reduce((sum, s) => sum + resteOf(s), 0);
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export type SupplierInput = Omit<Supplier, "id" | "createdAt">;

export function addSupplier(input: SupplierInput): Supplier {
  const supplier: Supplier = { ...input, id: uid("sup"), createdAt: nowIso() };
  mutate((db) => ({ ...db, suppliers: [supplier, ...db.suppliers] }));
  return supplier;
}

export function updateSupplier(id: string, input: SupplierInput) {
  mutate((db) => ({
    ...db,
    suppliers: db.suppliers.map((s) =>
      s.id === id ? { ...s, ...input, id } : s
    ),
  }));
}

export function deleteSupplier(id: string) {
  mutate((db) => ({
    ...db,
    suppliers: db.suppliers.filter((s) => s.id !== id),
  }));
}

/** Outstanding balance to pay a supplier (sum of unpaid purchase remainders). */
export function supplierBalance(db: Database, supplierId: string): number {
  return db.purchases
    .filter((p) => p.supplierId === supplierId)
    .reduce((sum, p) => sum + resteOf(p), 0);
}

// ---------------------------------------------------------------------------
// Purchases (Achats) — increase stock
// ---------------------------------------------------------------------------

export interface PurchaseInput {
  supplierId: string;
  items: { productId: string; name: string; qty: number; unitPrice: number }[];
  status: PaymentStatus;
  paidAmount: number;
  invoiceNumber?: string;
  date: string;
  note?: string;
}

function purchaseReason(p: { invoiceNumber?: string; id: string }) {
  return `Achat ${p.invoiceNumber?.trim() || p.id}`;
}

export function addPurchase(input: PurchaseInput): OpResult {
  return transact((db) => {
    const id = uid("pur");
    const products = db.products.map((p) => ({ ...p }));
    const movements = [...db.movements];
    const total = input.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      const before = prod.stock;
      prod.stock = before + item.qty;
      movements.unshift(
        makeMovement({
          productId: prod.id,
          type: "in",
          kind: "achat",
          qty: item.qty,
          stockBefore: before,
          stockAfter: prod.stock,
          reason: purchaseReason({ invoiceNumber: input.invoiceNumber, id }),
          reference: id,
          date: input.date,
        })
      );
    }

    const purchase: Purchase = {
      id,
      supplierId: input.supplierId,
      items: input.items,
      total,
      status: input.status,
      paidAmount: normalizePaid(total, input.status, input.paidAmount),
      invoiceNumber: input.invoiceNumber?.trim() || undefined,
      date: input.date,
      note: input.note?.trim() || undefined,
      createdAt: nowIso(),
    };

    return {
      commit: true,
      next: {
        ...db,
        products,
        purchases: [purchase, ...db.purchases],
        movements,
      },
      result: { ok: true },
    };
  });
}

export function updatePurchase(id: string, input: PurchaseInput): OpResult {
  return transact((db) => {
    const existing = db.purchases.find((p) => p.id === id);
    if (!existing)
      return { commit: false, result: { ok: false, error: "Achat introuvable." } };

    const products = db.products.map((p) => ({ ...p }));
    // Revert previous stock effect, then apply the new one.
    for (const item of existing.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) prod.stock -= item.qty;
    }
    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) prod.stock += item.qty;
    }
    const negative = products.find((p) => p.stock < 0);
    if (negative)
      return {
        commit: false,
        result: {
          ok: false,
          error: `Stock insuffisant pour « ${negative.name} » après modification.`,
        },
      };

    const total = input.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const movements = db.movements.filter((m) => m.reference !== id);
    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      movements.unshift(
        makeMovement({
          productId: prod.id,
          type: "in",
          kind: "achat",
          qty: item.qty,
          stockBefore: prod.stock - item.qty,
          stockAfter: prod.stock,
          reason: purchaseReason({ invoiceNumber: input.invoiceNumber, id }),
          reference: id,
          date: input.date,
        })
      );
    }

    const purchase: Purchase = {
      ...existing,
      supplierId: input.supplierId,
      items: input.items,
      total,
      status: input.status,
      paidAmount: normalizePaid(total, input.status, input.paidAmount),
      invoiceNumber: input.invoiceNumber?.trim() || undefined,
      date: input.date,
      note: input.note?.trim() || undefined,
    };

    return {
      commit: true,
      next: {
        ...db,
        products,
        purchases: db.purchases.map((p) => (p.id === id ? purchase : p)),
        movements,
      },
      result: { ok: true },
    };
  });
}

export function deletePurchase(id: string): OpResult {
  return transact((db) => {
    const existing = db.purchases.find((p) => p.id === id);
    if (!existing)
      return { commit: false, result: { ok: false, error: "Achat introuvable." } };

    const products = db.products.map((p) => ({ ...p }));
    for (const item of existing.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) prod.stock -= item.qty;
    }
    const negative = products.find((p) => p.stock < 0);
    if (negative)
      return {
        commit: false,
        result: {
          ok: false,
          error: `Suppression impossible : le stock de « ${negative.name} » deviendrait négatif.`,
        },
      };

    return {
      commit: true,
      next: {
        ...db,
        products,
        purchases: db.purchases.filter((p) => p.id !== id),
        movements: db.movements.filter((m) => m.reference !== id),
      },
      result: { ok: true },
    };
  });
}

// ---------------------------------------------------------------------------
// Sales (Ventes) — decrease stock (never below zero)
// ---------------------------------------------------------------------------

export interface SaleInput {
  clientId: string;
  items: { productId: string; name: string; qty: number; unitPrice: number }[];
  discount?: number;
  status: PaymentStatus;
  paidAmount: number;
  date: string;
  note?: string;
}

function saleTotal(input: SaleInput): number {
  const gross = input.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  return Math.max(gross - (input.discount ?? 0), 0);
}

function saleReason(id: string) {
  return `Vente ${id}`;
}

export function addSale(input: SaleInput): OpResult {
  return transact((db) => {
    const id = uid("sal");
    const products = db.products.map((p) => ({ ...p }));
    const movements = [...db.movements];

    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      if (item.qty > prod.stock)
        return {
          commit: false,
          result: {
            ok: false,
            error: `Stock insuffisant pour « ${prod.name} » (disponible : ${prod.stock}).`,
          },
        };
      const before = prod.stock;
      prod.stock = before - item.qty;
      movements.unshift(
        makeMovement({
          productId: prod.id,
          type: "out",
          kind: "vente",
          qty: item.qty,
          stockBefore: before,
          stockAfter: prod.stock,
          reason: saleReason(id),
          reference: id,
          date: input.date,
        })
      );
    }

    const total = saleTotal(input);
    const sale: Sale = {
      id,
      clientId: input.clientId,
      items: input.items,
      discount: input.discount || undefined,
      total,
      status: input.status,
      paidAmount: normalizePaid(total, input.status, input.paidAmount),
      date: input.date,
      note: input.note?.trim() || undefined,
      createdAt: nowIso(),
    };

    return {
      commit: true,
      next: { ...db, products, sales: [sale, ...db.sales], movements },
      result: { ok: true },
    };
  });
}

export function updateSale(id: string, input: SaleInput): OpResult {
  return transact((db) => {
    const existing = db.sales.find((s) => s.id === id);
    if (!existing)
      return { commit: false, result: { ok: false, error: "Vente introuvable." } };

    const products = db.products.map((p) => ({ ...p }));
    // Restore previous stock effect first…
    for (const item of existing.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) prod.stock += item.qty;
    }
    // …then apply the new lines, guarding against negative stock.
    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      if (item.qty > prod.stock)
        return {
          commit: false,
          result: {
            ok: false,
            error: `Stock insuffisant pour « ${prod.name} » (disponible : ${prod.stock}).`,
          },
        };
      prod.stock -= item.qty;
    }

    const total = saleTotal(input);
    const movements = db.movements.filter((m) => m.reference !== id);
    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      movements.unshift(
        makeMovement({
          productId: prod.id,
          type: "out",
          kind: "vente",
          qty: item.qty,
          stockBefore: prod.stock + item.qty,
          stockAfter: prod.stock,
          reason: saleReason(id),
          reference: id,
          date: input.date,
        })
      );
    }

    const sale: Sale = {
      ...existing,
      clientId: input.clientId,
      items: input.items,
      discount: input.discount || undefined,
      total,
      status: input.status,
      paidAmount: normalizePaid(total, input.status, input.paidAmount),
      date: input.date,
      note: input.note?.trim() || undefined,
    };

    return {
      commit: true,
      next: {
        ...db,
        products,
        sales: db.sales.map((s) => (s.id === id ? sale : s)),
        movements,
      },
      result: { ok: true },
    };
  });
}

export function deleteSale(id: string): OpResult {
  return transact((db) => {
    const existing = db.sales.find((s) => s.id === id);
    if (!existing)
      return { commit: false, result: { ok: false, error: "Vente introuvable." } };

    const products = db.products.map((p) => ({ ...p }));
    // Deleting a sale restores the stock it had removed.
    for (const item of existing.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) prod.stock += item.qty;
    }

    // Any linked invoice is kept for history but marked "Annulée", with a
    // snapshot so it still renders after the sale is gone.
    const invoices = db.invoices.map((inv) => {
      if (inv.saleId !== id) return inv;
      return {
        ...inv,
        docStatus: "Annulée" as const,
        snapshot: {
          items: existing.items,
          discount: existing.discount,
          total: existing.total,
          paidAmount: paidOf(existing),
          paymentStatus: existing.status,
          clientName: clientName(db, existing.clientId),
        },
      };
    });

    return {
      commit: true,
      next: {
        ...db,
        products,
        sales: db.sales.filter((s) => s.id !== id),
        movements: db.movements.filter((m) => m.reference !== id),
        invoices,
      },
      result: { ok: true },
    };
  });
}

// ---------------------------------------------------------------------------
// Expenses (Frais)
// ---------------------------------------------------------------------------

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export function addExpense(input: ExpenseInput): Expense {
  const expense: Expense = { ...input, id: uid("exp"), createdAt: nowIso() };
  mutate((db) => ({ ...db, expenses: [expense, ...db.expenses] }));
  return expense;
}

export function updateExpense(id: string, input: ExpenseInput) {
  mutate((db) => ({
    ...db,
    expenses: db.expenses.map((e) => (e.id === id ? { ...e, ...input, id } : e)),
  }));
}

export function deleteExpense(id: string) {
  mutate((db) => ({
    ...db,
    expenses: db.expenses.filter((e) => e.id !== id),
  }));
}

// ---------------------------------------------------------------------------
// Invoices (Factures) — generated from sales, numbers stay stable
// ---------------------------------------------------------------------------

function invoiceSequence(num: string): number {
  const m = num.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 0;
}

export function formatInvoiceNumber(year: number, seq: number): string {
  return `FAC-${year}-${String(seq).padStart(4, "0")}`;
}

function nextInvoiceSequence(db: Database): number {
  const max = db.invoices.reduce(
    (acc, inv) => Math.max(acc, invoiceSequence(inv.number)),
    0
  );
  return max + 1;
}

/**
 * Lazily creates a stable invoice for every sale that doesn't have one yet.
 * Existing invoice numbers are never reassigned. Returns true if anything
 * was created.
 */
export function ensureInvoices(): boolean {
  const db = getDB();
  const linked = new Set(
    db.invoices.map((i) => i.saleId).filter((x): x is string => Boolean(x))
  );
  const missing = db.sales
    .filter((s) => !linked.has(s.id))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (missing.length === 0) return false;

  let seq = nextInvoiceSequence(db);
  const created: Invoice[] = missing.map((s) => ({
    id: uid("inv"),
    number: formatInvoiceNumber(new Date(s.date).getFullYear(), seq++),
    saleId: s.id,
    clientId: s.clientId,
    amount: s.total,
    status: s.status,
    docStatus: "Validée",
    tvaRate: 0,
    date: s.date,
    createdAt: nowIso(),
  }));
  mutate((d) => ({ ...d, invoices: [...d.invoices, ...created] }));
  return true;
}

export function updateInvoice(
  id: string,
  patch: Partial<Pick<Invoice, "docStatus" | "tvaRate" | "notes">>
) {
  mutate((db) => ({
    ...db,
    invoices: db.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  }));
}

export interface InvoiceView {
  invoice: Invoice;
  client?: Client;
  clientName: string;
  docStatus: InvoiceStatus;
  items: LineItem[];
  discount: number;
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  totalTTC: number;
  paid: number;
  reste: number;
  paymentStatus: PaymentStatus;
  saleExists: boolean;
}

/** Computes the live, display-ready figures for an invoice. */
export function invoiceView(db: Database, invoice: Invoice): InvoiceView {
  const sale = invoice.saleId
    ? db.sales.find((s) => s.id === invoice.saleId)
    : undefined;
  const snap = invoice.snapshot;

  const items = sale ? sale.items : snap?.items ?? [];
  const discount = sale ? sale.discount ?? 0 : snap?.discount ?? 0;
  const totalHT = sale ? sale.total : snap?.total ?? invoice.amount;
  const tvaRate = invoice.tvaRate ?? 0;
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount;
  const paymentStatus = sale
    ? sale.status
    : snap?.paymentStatus ?? invoice.status;
  const paid = sale ? paidOf(sale) : snap?.paidAmount ?? 0;
  const reste = Math.max(totalTTC - paid, 0);

  const client = db.clients.find((c) => c.id === invoice.clientId);
  const clientNm = client?.name ?? snap?.clientName ?? "—";

  return {
    invoice,
    client,
    clientName: clientNm,
    docStatus: invoice.docStatus,
    items,
    discount,
    totalHT,
    tvaRate,
    tvaAmount,
    totalTTC,
    paid,
    reste,
    paymentStatus,
    saleExists: Boolean(sale),
  };
}

// ---------------------------------------------------------------------------
// Manual stock adjustment
// ---------------------------------------------------------------------------

export function addAdjustment(
  productId: string,
  direction: "in" | "out",
  qty: number,
  reason: string
): OpResult {
  return transact((db) => {
    const products = db.products.map((p) => ({ ...p }));
    const prod = products.find((p) => p.id === productId);
    if (!prod)
      return {
        commit: false,
        result: { ok: false, error: "Produit introuvable." },
      };

    const amount = Math.abs(qty);
    if (direction === "out" && amount > prod.stock)
      return {
        commit: false,
        result: {
          ok: false,
          error: `Stock insuffisant pour « ${prod.name} » (disponible : ${prod.stock}).`,
        },
      };

    const before = prod.stock;
    prod.stock = direction === "in" ? before + amount : before - amount;
    const ts = nowIso();
    const movement = makeMovement({
      productId,
      type: direction,
      kind: "ajustement",
      qty: amount,
      stockBefore: before,
      stockAfter: prod.stock,
      reason: reason.trim() || "Ajustement manuel",
      date: ts,
    });

    return {
      commit: true,
      next: { ...db, products, movements: [movement, ...db.movements] },
      result: { ok: true },
    };
  });
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function categoryName(db: Database, id: string): string {
  return db.categories.find((c) => c.id === id)?.name ?? "—";
}

export function productName(db: Database, id: string): string {
  return db.products.find((p) => p.id === id)?.name ?? "Produit supprimé";
}

export function clientName(db: Database, id: string): string {
  return db.clients.find((c) => c.id === id)?.name ?? "—";
}

export function supplierName(db: Database, id: string): string {
  return db.suppliers.find((s) => s.id === id)?.name ?? "—";
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
  unpaidSalesCount: number;
  unpaidSalesAmount: number;
  supplierPayables: number;
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

  const unpaidSales = db.sales.filter((s) => resteOf(s) > 0);

  return {
    productCount: db.products.length,
    stockValue,
    potentialRevenue,
    lowStockCount,
    totalSales,
    totalPurchases,
    totalExpenses,
    estimatedProfit: totalSales - totalPurchases - totalExpenses,
    unpaidSalesCount: unpaidSales.length,
    unpaidSalesAmount: unpaidSales.reduce((s, x) => s + resteOf(x), 0),
    supplierPayables: db.purchases.reduce((s, x) => s + resteOf(x), 0),
    clientCount: db.clients.length,
    supplierCount: db.suppliers.length,
  };
}

export interface TopProduct {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
}

/** Best-selling products by quantity, derived from sales line items. */
export function getTopProducts(db: Database, limit = 5): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const sale of db.sales) {
    for (const item of sale.items) {
      const entry =
        map.get(item.productId) ??
        { productId: item.productId, name: item.name, qty: 0, revenue: 0 };
      entry.qty += item.qty;
      entry.revenue += item.qty * item.unitPrice;
      map.set(item.productId, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}

export type OperationKind = "vente" | "achat" | "frais";

export interface RecentOperation {
  id: string;
  kind: OperationKind;
  label: string;
  amount: number;
  date: string;
}

/** Unified, most-recent-first timeline of sales, purchases and expenses. */
export function getRecentOperations(db: Database, limit = 8): RecentOperation[] {
  const ops: RecentOperation[] = [
    ...db.sales.map((s) => ({
      id: s.id,
      kind: "vente" as const,
      label: clientName(db, s.clientId),
      amount: s.total,
      date: s.date,
    })),
    ...db.purchases.map((p) => ({
      id: p.id,
      kind: "achat" as const,
      label: supplierName(db, p.supplierId),
      amount: p.total,
      date: p.date,
    })),
    ...db.expenses.map((e) => ({
      id: e.id,
      kind: "frais" as const,
      label: e.label,
      amount: e.amount,
      date: e.date,
    })),
  ];
  return ops.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}
