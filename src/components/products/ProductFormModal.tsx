"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Category, Product } from "@/lib/types";
import type { ProductInput } from "@/lib/store";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ProductInput) => void;
  categories: Category[];
  /** When provided, the form is in edit mode. */
  product?: Product | null;
}

const emptyForm = {
  name: "",
  categoryId: "",
  sku: "",
  unit: "pièce",
  costPrice: "",
  sellPrice: "",
  stock: "",
  minStock: "",
};

type FormState = typeof emptyForm;

export function ProductFormModal({
  open,
  onClose,
  onSubmit,
  categories,
  product,
}: ProductFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name,
        categoryId: product.categoryId,
        sku: product.sku ?? "",
        unit: product.unit,
        costPrice: String(product.costPrice),
        sellPrice: String(product.sellPrice),
        stock: String(product.stock),
        minStock: String(product.minStock),
      });
    } else {
      setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    }
    setErrors({});
  }, [open, product, categories]);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Le nom est requis.";
    if (!form.categoryId) e.categoryId = "Choisissez une catégorie.";
    if (form.costPrice === "" || Number(form.costPrice) < 0)
      e.costPrice = "Prix d'achat invalide.";
    if (form.sellPrice === "" || Number(form.sellPrice) < 0)
      e.sellPrice = "Prix de vente invalide.";
    if (form.stock === "" || Number(form.stock) < 0)
      e.stock = "Stock invalide.";
    if (form.minStock === "" || Number(form.minStock) < 0)
      e.minStock = "Seuil invalide.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      categoryId: form.categoryId,
      sku: form.sku.trim() || undefined,
      unit: form.unit.trim() || "pièce",
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
    });
  };

  const margin =
    Number(form.sellPrice) - Number(form.costPrice) || 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? "Modifier le produit" : "Ajouter un produit"}
      description={
        product
          ? "Mettez à jour les informations du produit."
          : "Renseignez les informations du nouveau produit."
      }
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {product ? "Enregistrer" : "Ajouter le produit"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nom du produit</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex. Boîte alimentaire plastique"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="label">Catégorie</label>
          <select
            className="input"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>
          )}
        </div>

        <div>
          <label className="label">Référence (SKU)</label>
          <input
            className="input"
            value={form.sku}
            onChange={(e) => set("sku", e.target.value)}
            placeholder="Optionnel"
          />
        </div>

        <div>
          <label className="label">Unité</label>
          <input
            className="input"
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="Ex. paquet (50), carton, kg…"
          />
        </div>

        <div>
          <label className="label">Prix d&apos;achat (DH)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={form.costPrice}
            onChange={(e) => set("costPrice", e.target.value)}
          />
          {errors.costPrice && (
            <p className="mt-1 text-xs text-red-600">{errors.costPrice}</p>
          )}
        </div>

        <div>
          <label className="label">Prix de vente (DH)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={form.sellPrice}
            onChange={(e) => set("sellPrice", e.target.value)}
          />
          {errors.sellPrice && (
            <p className="mt-1 text-xs text-red-600">{errors.sellPrice}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Marge unitaire estimée :{" "}
            <span
              className={`font-semibold ${
                margin >= 0 ? "text-brand-700" : "text-red-600"
              }`}
            >
              {margin.toFixed(2)} DH
            </span>
          </div>
        </div>

        <div>
          <label className="label">Stock actuel</label>
          <input
            type="number"
            min="0"
            step="1"
            className="input"
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
          />
          {errors.stock && (
            <p className="mt-1 text-xs text-red-600">{errors.stock}</p>
          )}
        </div>

        <div>
          <label className="label">Seuil d&apos;alerte (stock min.)</label>
          <input
            type="number"
            min="0"
            step="1"
            className="input"
            value={form.minStock}
            onChange={(e) => set("minStock", e.target.value)}
          />
          {errors.minStock && (
            <p className="mt-1 text-xs text-red-600">{errors.minStock}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
