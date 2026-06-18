"use client";

import React, { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Category, Database } from "@/lib/types";
import { addCategory, deleteCategory } from "@/lib/store";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

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
  const { t } = useI18n();
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
      toast(t("prod.catExists"), "error");
      return;
    }
    addCategory(trimmed);
    setName("");
    toast(t("toast.catAdded", { name: trimmed }));
  };

  const handleDelete = (cat: Category) => {
    if (productCount(cat.id) > 0) {
      toast(t("prod.catInUse"), "error");
      return;
    }
    deleteCategory(cat.id);
    toast(t("toast.catDeleted"));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("prod.manageCats")}
      description={t("prod.manageCatsDesc")}
      footer={
        <button className="btn-primary" onClick={onClose}>
          {t("common.done")}
        </button>
      }
    >
      <div className="mb-4 flex gap-2">
        <input
          className="input"
          value={name}
          placeholder={t("prod.newCat")}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="btn-primary shrink-0" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          {t("common.add")}
        </button>
      </div>

      {db.categories.length === 0 ? (
        <EmptyState
          title={t("prod.categories")}
          description=""
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
                    {count} {t("common.products")}
                  </span>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={count > 0}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title={count > 0 ? t("prod.catInUse") : t("common.delete")}
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
