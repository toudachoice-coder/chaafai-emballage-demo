"use client";

import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/lib/types";
import { getDB, subscribe } from "@/lib/store";

/**
 * Subscribes a component to the localStorage-backed database.
 *
 * `ready` is false during SSR / before the first client paint so pages can
 * render a stable skeleton and avoid hydration mismatches. The actual data is
 * only loaded inside an effect (client side only).
 */
export function useDatabase() {
  const [db, setDb] = useState<Database | null>(null);

  const refresh = useCallback(() => {
    setDb(getDB());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribe(refresh);
    // Sync across browser tabs.
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return { db, ready: db !== null, refresh };
}
