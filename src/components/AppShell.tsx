"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Page chrome: responsive sidebar + sticky header + scrollable content. */
export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { dir } = useI18n();

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={dir === "rtl" ? "lg:pr-72" : "lg:pl-72"}>
        <Header
          title={title}
          subtitle={subtitle}
          actions={actions}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
