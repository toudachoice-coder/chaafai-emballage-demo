"use client";

import React, { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Category, Database } from "@/lib/types";
import { addCategory, deleteCategory } from "@/lib/store";
import { useToast } from "@/components/ui/ToastProvider";

interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
  db: Database;
}

export function CategoryManagerModal({
  open,
  onClose,
  db,
}: CategoryManagerModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");

  const productCount = (catId: string) =>
    db.products.filter((p) => p.categoryId === catId).length;

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (
      db.categories.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast("Cette catégorie existe déjà.", "error");
      return;
    }
    addCategory(trimmed);
    setName("");
    toast(`Catégorie « ${trimmed} » ajoutée`);
  };

  const handleDelete = (cat: Category) => {
    if (productCount(cat.id) > 0) {
      toast(
        "Impossible : des produits utilisent cette catégorie.",
        "error"
      );
      return;
    }
    deleteCategory(cat.id);
    toast("Catégorie supprimée");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gérer les catégories"
      description="Les catégories sont dynamiques et réutilisées dans tous les modules."
      footer={
        <button className="btn-primary" onClick={onClose}>
          Terminé
        </button>
      }
    >
      <div className="mb-4 flex gap-2">
        <input
          className="input"
          value={name}
          placeholder="Nouvelle catégorie…"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="btn-primary shrink-0" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {db.categories.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          description="Ajoutez votre première catégorie ci-dessus."
          icon={<Tag className="h-8 w-8" />}
        />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {db.categories.map((cat) => {
            const count = productCount(cat.id);
            return (
              <li
                key={cat.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Tag className="h-4 w-4 text-slate-400" />
                  {cat.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {count} produit{count > 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={count > 0}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title={
                      count > 0
                        ? "Catégorie utilisée par des produits"
                        : "Supprimer"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
