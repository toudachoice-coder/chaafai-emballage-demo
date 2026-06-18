"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Phone,
  Mail,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { useToast } from "@/components/ui/ToastProvider";
import { useDatabase } from "@/hooks/useDatabase";
import {
  addClient,
  updateClient,
  deleteClient,
  clientBalance,
  type ClientInput,
} from "@/lib/store";
import type { Client } from "@/lib/types";
import { formatMAD } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ClientsPage() {
  const { db, ready } = useDatabase();
  const { toast } = useToast();
  const { t } = useI18n();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    if (!db) return [];
    const q = search.trim().toLowerCase();
    if (!q) return db.clients;
    return db.clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone?.toLowerCase().includes(q) ?? false) ||
        c.type.toLowerCase().includes(q)
    );
  }, [db, search]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);
    setFormOpen(true);
  };

  const handleSubmit = (input: ClientInput) => {
    if (editing) {
      updateClient(editing.id, input);
      toast(t("toast.updated", { name: input.name }));
    } else {
      addClient(input);
      toast(t("toast.added", { name: input.name }));
    }
    setFormOpen(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteClient(deleteTarget.id);
    toast(t("toast.deleted", { name: deleteTarget.name }));
    setDeleteTarget(null);
  };

  return (
    <AppShell
      title={t("page.clients.title")}
      subtitle={t("page.clients.subtitle")}
      actions={
        <button className="btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("cli.addBtn")}</span>
          <span className="sm:hidden">{t("common.add")}</span>
        </button>
      }
    >
      {!ready || !db ? (
        <div className="card h-96 animate-pulse bg-slate-50" />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder={t("cli.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="card overflow-hidden">
            {db.clients.length === 0 ? (
              <EmptyState
                title={t("cli.empty")}
                description={t("cli.emptyDesc")}
                icon={<Users className="h-8 w-8" />}
                action={
                  <button className="btn-primary" onClick={openAdd}>
                    <Plus className="h-4 w-4" />
                    {t("cli.addBtn")}
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title={t("empty.noResult")}
                description={t("empty.noResultDesc")}
                icon={<Search className="h-8 w-8" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">{t("common.client")}</th>
                      <th className="px-5 py-3">{t("tbl.type")}</th>
                      <th className="px-5 py-3">{t("tbl.contact")}</th>
                      <th className="px-5 py-3 text-right">{t("tbl.unpaidBalance")}</th>
                      <th className="px-5 py-3 text-right">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((c) => {
                      const balance = clientBalance(db, c.id);
                      return (
                        <tr
                          key={c.id}
                          className="transition-colors hover:bg-slate-50/60"
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-800">
                              {c.name}
                            </div>
                            {c.ice && (
                              <div className="text-xs text-slate-400">
                                ICE : {c.ice}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className="badge bg-accent-50 text-accent-700">
                              {c.type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {c.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {c.phone}
                              </div>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Mail className="h-3.5 w-3.5" />
                                {c.email}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {balance > 0 ? (
                              <span className="font-semibold text-red-600">
                                {formatMAD(balance)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(c)}
                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
                                title={t("common.edit")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(c)}
                                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                title={t("common.delete")}
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

      <ClientFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        client={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        message={t("confirm.deleteItem", { name: deleteTarget?.name ?? "" })}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}
