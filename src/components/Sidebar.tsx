"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "./Logo";
import { navItems } from "./nav";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface SidebarProps {
  /** Mobile drawer open state. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, dir } = useI18n();
  const rtl = dir === "rtl";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Closed-drawer transform depends on which side the sidebar sits.
  const closedTransform = rtl ? "translate-x-full" : "-translate-x-full";

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 z-40 flex w-72 flex-col bg-brand-950 transition-transform duration-200 lg:translate-x-0 ${
          rtl ? "right-0" : "left-0"
        } ${open ? "translate-x-0" : closedTransform}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo light />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
            aria-label={t("common.closeMenu")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400/70"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {t(item.tKey)}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                    {t("nav.soon")}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(item.tKey)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-xs text-slate-400">
            {t("sidebar.demoVersion")} · {new Date().getFullYear()}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {t("sidebar.dataLocal")}
          </p>
        </div>
      </aside>
    </>
  );
}
