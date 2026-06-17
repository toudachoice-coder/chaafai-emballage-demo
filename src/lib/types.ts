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

export type ClientType =
  | "Restaurant"
  | "Café"
  | "Snack"
  | "Pâtisserie"
  | "Supermarché"
  | "Épicerie"
  | "Autre";

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Identifiant Commun de l'Entreprise (Maroc). */
  ice?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  /** Main product category supplied (free text / category name). */
  mainCategory?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  ice?: string;
  notes?: string;
  createdAt: string;
}

export interface LineItem {
  productId: string;
  /** Snapshot of product name at transaction time. */
  name: string;
  qty: number;
  unitPrice: number;
}

export type PaymentStatus = "paid" | "unpaid" | "partial";

export interface Purchase {
  id: string;
  supplierId: string;
  items: LineItem[];
  total: number;
  status: PaymentStatus;
  /** Amount already paid to the supplier (MAD). */
  paidAmount: number;
  /** Supplier invoice reference. */
  invoiceNumber?: string;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  clientId: string;
  items: LineItem[];
  /** Optional global discount applied to the sale (MAD). */
  discount?: number;
  total: number;
  status: PaymentStatus;
  /** Amount already paid by the client (MAD). */
  paidAmount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | "Transport"
  | "Loyer"
  | "Salaires"
  | "Électricité"
  | "Internet"
  | "Maintenance"
  | "Carburant"
  | "Fournitures"
  | "Autre";

export type PaymentMethod =
  | "Espèces"
  | "Virement"
  | "Chèque"
  | "Carte"
  | "Crédit";

export interface Expense {
  id: string;
  /** Short description / label of the expense. */
  label: string;
  category: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  date: string;
  note?: string;
  createdAt: string;
}

export type MovementType = "in" | "out" | "adjust";

/** Origin of a stock movement, for display on the stock page. */
export type MovementKind = "achat" | "vente" | "ajustement" | "initial";

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  /** Business origin of the movement. */
  kind?: MovementKind;
  /** Always positive; direction derived from `type`. */
  qty: number;
  /** Free-text reason, e.g. "Achat ACH-1", "Inventaire". */
  reason: string;
  /** Reference to the source document id (purchase/sale). */
  reference?: string;
  /** Product stock before / after the movement (when known). */
  stockBefore?: number;
  stockAfter?: number;
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
