"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Client, ClientType } from "@/lib/types";
import type { ClientInput } from "@/lib/store";
import { useI18n } from "@/lib/i18n/I18nProvider";

const CLIENT_TYPES: ClientType[] = [
  "Restaurant",
  "Café",
  "Snack",
  "Pâtisserie",
  "Supermarché",
  "Épicerie",
  "Autre",
];

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ClientInput) => void;
  client?: Client | null;
}

const empty = {
  name: "",
  type: "Restaurant" as ClientType,
  phone: "",
  email: "",
  address: "",
  ice: "",
  notes: "",
};

export function ClientFormModal({
  open,
  onClose,
  onSubmit,
  client,
}: ClientFormModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (client) {
      setForm({
        name: client.name,
        type: client.type,
        phone: client.phone ?? "",
        email: client.email ?? "",
        address: client.address ?? "",
        ice: client.ice ?? "",
        notes: client.notes ?? "",
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [open, client]);

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
      type: form.type,
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
      title={client ? t("cli.formEditTitle") : t("cli.formAddTitle")}
      description={
        client
          ? "Mettez à jour les informations du client."
          : "Renseignez les informations du nouveau client."
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
            placeholder="Ex. Snack Al Baraka"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="label">{t("field.clientType")}</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {CLIENT_TYPES.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("field.phone")}</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="06 00 00 00 00"
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
            placeholder="Ville, quartier…"
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
