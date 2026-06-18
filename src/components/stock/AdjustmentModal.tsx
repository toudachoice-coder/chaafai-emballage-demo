"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Product } from "@/lib/types";

interface AdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    productId: string,
    direction: "in" | "out",
    qty: number,
    reason: string
  ) => void;
  products: Product[];
}

export function AdjustmentModal({
  open,
  onClose,
  onSubmit,
  products,
}: AdjustmentModalProps) {
  const [productId, setProductId] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setProductId(products[0]?.id ?? "");
    setDirection("in");
    setQty("");
    setReason("");
    setError("");
  }, [open, products]);

  const selected = products.find((p) => p.id === productId);

  const handleSubmit = () => {
    if (!productId) return setError("Veuillez choisir un produit.");
    if (qty === "" || Number(qty) <= 0)
      return setError("Quantité invalide.");
    onSubmit(productId, direction, Number(qty), reason.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustement de stock"
      description="Corrigez manuellement le stock (inventaire, casse, perte…)."
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Valider l&apos;ajustement
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Produit</label>
          <select
            className="input"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Choisir un produit…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-1 text-xs text-slate-400">
              Stock actuel : {selected.stock} {selected.unit.split(" ")[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type d&apos;ajustement</label>
            <select
              className="input"
              value={direction}
              onChange={(e) => setDirection(e.target.value as "in" | "out")}
            >
              <option value="in">Entrée (+)</option>
              <option value="out">Sortie (−)</option>
            </select>
          </div>
          <div>
            <label className="label">Quantité</label>
            <input
              type="number"
              min="1"
              step="1"
              className="input"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Raison / notes</label>
          <textarea
            className="input min-h-[70px] resize-y"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. Inventaire, casse, produit périmé…"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
