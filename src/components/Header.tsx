"use client";

import React, { useState } from "react";
import { Menu, RotateCcw, Building2 } from "lucide-react";
import { resetDemoData } from "@/lib/store";
import { useToast } from "./ui/ToastProvider";
import { ConfirmDialog } from "./ui/ConfirmDialog";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, onOpenMenu, actions }: HeaderProps) {
  const { toast } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden text-sm text-slate-500 sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {actions}
          <button
            onClick={() => setConfirmReset(true)}
            className="btn-ghost hidden sm:inline-flex"
            title="Réinitialiser les données de démonstration"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden md:inline">Réinitialiser la démo</span>
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-slate-800">
                Chaafai Emballage
              </p>
              <p className="text-xs text-slate-500">Compte démo</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Réinitialiser la démo"
        message="Toutes vos modifications seront effacées et les données de démonstration d'origine seront restaurées. Continuer ?"
        confirmLabel="Réinitialiser"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          toast("Données de démonstration réinitialisées");
        }}
      />
    </header>
  );
}
