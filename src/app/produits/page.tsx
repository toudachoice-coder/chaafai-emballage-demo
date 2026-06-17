"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Tag,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { CategoryManagerModal } from "@/components/products/CategoryManagerModal";
import { useToast } from "@/components/ui/ToastProvider";
import { useDatabase } from "@/hooks/useDatabase";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  categoryName,
  type ProductInput,
} from "@/lib/store";
import type { Product } from "@/lib/types";
import { formatMAD } from "@/lib/format";

type SortKey = "name" | "stock" | "sellPrice";

export default function ProductsPage() {
  const { db, ready } = useDatabase();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    if (!db) return [];
    const q = search.trim().toLowerCase();
    let list = db.products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false);
      const matchesCat =
        categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchesQuery && matchesCat;
    });
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else cmp = a[sortKey] - b[sortKey];
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [db, search, categoryFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleSubmit = (input: ProductInput) => {
    if (editing) {
      updateProduct(editing.id, input);
      toast(`« ${input.name} » mis à jour`);
    } else {
      addProduct(input);
      toast(`« ${input.name} » ajouté au catalogue`);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    toast(`« ${deleteTarget.name} » supprimé`);
    setDeleteTarget(null);
  };

  return (
    <AppShell
      title="Produits"
      subtitle="Gérez votre catalogue de produits d'emballage"
      actions={
        <>
          <button
            className="btn-secondary hidden sm:inline-flex"
            onClick={() => setCategoriesOpen(true)}
          >
            <Tag className="h-4 w-4" />
            Catégories
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter un produit</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </>
      }
    >
      {!ready || !db ? (
        <div className="card h-96 animate-pulse bg-slate-50" />
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Rechercher par nom ou référence…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input sm:w-64"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Toutes les catégories</option>
              {db.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="btn-secondary sm:hidden"
              onClick={() => setCategoriesOpen(true)}
            >
              <Tag className="h-4 w-4" />
              Gérer les catégories
            </button>
          </div>

          <p className="text-sm text-slate-500">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""} affiché
            {filtered.length > 1 ? "s" : ""}
            {db.products.length !== filtered.length &&
              ` sur ${db.products.length}`}
          </p>

          {/* Table */}
          <div className="card overflow-hidden">
            {db.products.length === 0 ? (
              <EmptyState
                title="Aucun produit"
                description="Commencez par ajouter votre premier produit au catalogue."
                icon={<Package className="h-8 w-8" />}
                action={
                  <button className="btn-primary" onClick={openAdd}>
                    <Plus className="h-4 w-4" />
                    Ajouter un produit
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Aucun résultat"
                description="Aucun produit ne correspond à votre recherche."
                icon={<Search className="h-8 w-8" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">
                        <SortButton
                          label="Produit"
                          active={sortKey === "name"}
                          asc={sortAsc}
                          onClick={() => toggleSort("name")}
                        />
                      </th>
                      <th className="px-5 py-3">Catégorie</th>
                      <th className="px-5 py-3 text-right">Prix achat</th>
                      <th className="px-5 py-3 text-right">
                        <SortButton
                          label="Prix vente"
                          active={sortKey === "sellPrice"}
                          asc={sortAsc}
                          onClick={() => toggleSort("sellPrice")}
                          alignRight
                        />
                      </th>
                      <th className="px-5 py-3 text-right">
                        <SortButton
                          label="Stock"
                          active={sortKey === "stock"}
                          asc={sortAsc}
                          onClick={() => toggleSort("stock")}
                          alignRight
                        />
                      </th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p) => {
                      const low = p.stock <= p.minStock;
                      return (
                        <tr
                          key={p.id}
                          className="transition-colors hover:bg-slate-50/60"
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-800">
                              {p.name}
                            </div>
                            {p.sku && (
                              <div className="text-xs text-slate-400">
                                {p.sku}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className="badge bg-slate-100 text-slate-600">
                              {categoryName(db, p.categoryId)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-600">
                            {formatMAD(p.costPrice)}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-800">
                            {formatMAD(p.sellPrice)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span
                              className={`badge ${
                                low
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-brand-50 text-brand-700"
                              }`}
                              title={
                                low
                                  ? `Sous le seuil de ${p.minStock}`
                                  : undefined
                              }
                            >
                              {low && <AlertTriangle className="h-3 w-3" />}
                              {p.stock} {p.unit.split(" ")[0]}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(p)}
                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
                                title="Modifier"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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

      <ProductFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        categories={db?.categories ?? []}
        product={editing}
      />

      {db && (
        <CategoryManagerModal
          open={categoriesOpen}
          onClose={() => setCategoriesOpen(false)}
          db={db}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Voulez-vous vraiment supprimer « ${deleteTarget?.name} » ? Cette action est irréversible.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

function SortButton({
  label,
  active,
  asc,
  onClick,
  alignRight,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
  alignRight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wide transition-colors hover:text-slate-700 ${
        active ? "text-brand-700" : "text-slate-500"
      } ${alignRight ? "flex-row-reverse" : ""}`}
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active && !asc ? "rotate-180" : ""}`} />
    </button>
  );
}
