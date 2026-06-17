// Core domain types for the Chaafai Emballage demo.
// Kept intentionally generic so future modules (Achats, Ventes, Frais,
// Factures, Rapports...) can be layered on without breaking existing data.

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  /** Unit of measure, e.g. "pièce", "paquet", "carton", "kg", "rouleau". */
  unit: string;
  /** Purchase / cost price in MAD. */
  costPrice: number;
  /** Sale price in MAD. */
  sellPrice: number;
  /** Current quantity in stock. */
  stock: number;
  /** Threshold below which a low-stock alert is raised. */
  minStock: number;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface LineItem {
  productId: string;
  /** Snapshot of product name at transaction time. */
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: LineItem[];
  total: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  clientId: string;
  items: LineItem[];
  total: number;
  /** "paid" | "unpaid" | "partial" */
  status: PaymentStatus;
  date: string;
  note?: string;
  createdAt: string;
}

export type PaymentStatus = "paid" | "unpaid" | "partial";

export interface Expense {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export type MovementType = "in" | "out" | "adjust";

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  /** Signed-by-context quantity; always positive, meaning derived from type. */
  qty: number;
  /** Free-text reason, e.g. "Achat #123", "Vente #45", "Inventaire". */
  reason: string;
  date: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  saleId?: string;
  clientId: string;
  amount: number;
  status: PaymentStatus;
  date: string;
  dueDate?: string;
  createdAt: string;
}

/** Shape of the full demo database held in localStorage. */
export interface Database {
  categories: Category[];
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  movements: StockMovement[];
  invoices: Invoice[];
}
