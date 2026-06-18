"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Category, Supplier } from "@/lib/types";
import type { SupplierInput } from "@/lib/store";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: SupplierInput) => void;
  categories: Category[];
  supplier?: Supplier | null;
}

const empty = {
  name: "",
  mainCategory: "",
  phone: "",
  email: "",
  address: "",
  ice: "",
  notes: "",
};

export function SupplierFormModal({
  open,
  onClose,
  onSubmit,
  categories,
  supplier,
}: SupplierFormModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (supplier) {
      setForm({
        name: supplier.name,
        mainCategory: supplier.mainCategory ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        ice: supplier.ice ?? "",
        notes: supplier.notes ?? "",
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [open, supplier]);

  const set = (key: keyof typeof empty, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Le nom est requis.";
    if (!form.phone.trim()) e.phone = "Le téléphone est requis.";
    setErrors(e);
    if (Object.keys(e).length) return;

    onSubmit({
      name: form.name.trim(),
      mainCategory: form.mainCategory.trim() || undefined,
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      ice: form.ice.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={supplier ? t("sup.formEditTitle") : t("sup.formAddTitle")}
      description={
        supplier
          ? "Mettez à jour les informations du fournisseur."
          : "Renseignez les informations du nouveau fournisseur."
      }
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {t("common.save")}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">{t("field.name")}</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex. Fournisseur Carton Maroc"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="label">{t("field.mainCategory")}</label>
          <input
            className="input"
            list="supplier-categories"
            value={form.mainCategory}
            onChange={(e) => set("mainCategory", e.target.value)}
            placeholder="Ex. Emballage Carton"
          />
          <datalist id="supplier-categories">
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="label">{t("field.phone")}</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="05 00 00 00 00"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="label">
            {t("field.email")} {t("common.optional")}
          </label>
          <input
            className="input"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="contact@exemple.ma"
          />
        </div>

        <div>
          <label className="label">
            {t("field.ice")} {t("common.optional")}
          </label>
          <input
            className="input"
            value={form.ice}
            onChange={(e) => set("ice", e.target.value)}
            placeholder="Identifiant Commun de l'Entreprise"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">
            {t("field.address")} {t("common.optional")}
          </label>
          <input
            className="input"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Ville, zone industrielle…"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">
            {t("common.notes")} {t("common.optional")}
          </label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Informations complémentaires…"
          />
        </div>
      </div>
    </Modal>
  );
}
