"use client";

import React, { useState } from "react";
import { Menu, Building2, ChevronDown, RotateCcw, Mail } from "lucide-react";
import { resetDemoData } from "@/lib/store";
import { useToast } from "./ui/ToastProvider";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LANGS } from "@/lib/i18n/translations";
import { COMPANY } from "@/lib/company";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, onOpenMenu, actions }: HeaderProps) {
  const { toast } = useToast();
  const { t, lang, setLang, dir } = useI18n();
  const [confirmReset, setConfirmReset] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const slogan = lang === "ar" ? COMPANY.slogan.ar : COMPANY.slogan.fr;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label={t("common.openMenu")}
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

          {/* Compact language switcher (FR / ع) */}
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  lang === l.code
                    ? "bg-brand-600 text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                aria-pressed={lang === l.code}
                title={l.label}
              >
                {l.short}
              </button>
            ))}
          </div>

          {/* Company card + dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="hidden leading-tight sm:block ltr:text-left rtl:text-right">
                <p className="text-sm font-medium text-slate-800">
                  {COMPANY.name}
                </p>
                <p className="text-xs text-slate-500">
                  {t("header.demoAccount")}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div
                  className={`absolute z-40 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-card-hover ${
                    dir === "rtl" ? "left-0" : "right-0"
                  }`}
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {COMPANY.name}
                      </p>
                      <p className="text-xs text-slate-500">{slogan}</p>
                    </div>
                  </div>

                  <div className="py-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {t("header.managers")}
                    </p>
                    <ul className="space-y-1">
                      {COMPANY.managers.map((m) => (
                        <li key={m.fr} className="text-sm text-slate-700">
                          {lang === "ar" ? m.ar : m.fr}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 py-3">
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      {COMPANY.email}
                    </p>
                  </div>

                  {/* Discreet developer-only tools */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                      {t("header.devTools")}
                    </p>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmReset(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t("header.resetDemo")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={t("header.resetTitle")}
        message={t("header.resetMsg")}
        confirmLabel={t("header.resetConfirm")}
        cancelLabel={t("common.cancel")}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          toast(t("header.resetDone"));
        }}
      />
    </header>
  );
}
