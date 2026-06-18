"use client";

import React from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatMAD } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export interface DraftLine {
  productId: string;
  qty: string;
  unitPrice: string;
}

export const emptyLine = (): DraftLine => ({
  productId: "",
  qty: "1",
  unitPrice: "",
});

export function lineTotal(line: DraftLine): number {
  return (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
}

interface LineItemsEditorProps {
  products: Product[];
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
  /** Which product price to auto-fill, and whether to warn on stock. */
  priceMode: "cost" | "sell";
}

export function LineItemsEditor({
  products,
  lines,
  onChange,
  priceMode,
}: LineItemsEditorProps) {
  const { t } = useI18n();
  const update = (index: number, patch: Partial<DraftLine>) => {
    onChange(
      lines.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, ...patch };
        // Auto-fill the unit price from the selected product (if still empty).
        if (patch.productId) {
          const prod = products.find((p) => p.id === patch.productId);
          if (prod && (!l.unitPrice || Number(l.unitPrice) === 0)) {
            next.unitPrice = String(
              priceMode === "cost" ? prod.costPrice : prod.sellPrice
            );
          }
        }
        return next;
      })
    );
  };

  const addLine = () => onChange([...lines, emptyLine()]);
  const removeLine = (index: number) =>
    onChange(lines.length > 1 ? lines.filter((_, i) => i !== index) : lines);

  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {lines.map((line, index) => {
          const prod = products.find((p) => p.id === line.productId);
          const overStock =
            priceMode === "sell" &&
            prod &&
            Number(line.qty) > prod.stock;
          return (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
            >
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-5">
                  <select
                    className="input"
                    value={line.productId}
                    onChange={(e) =>
                      update(index, { productId: e.target.value })
                    }
                  >
                    <option value="">{t("trx.chooseProduct")}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {priceMode === "sell" && prod && (
                    <p
                      className={`mt-1 text-xs ${
                        overStock ? "text-red-600" : "text-slate-400"
                      }`}
                    >
                      {overStock && (
                        <AlertTriangle className="mr-1 inline h-3 w-3" />
                      )}
                      {t("tbl.stock")} : {prod.stock} {prod.unit.split(" ")[0]}
                    </p>
                  )}
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input"
                    placeholder={t("common.quantity")}
                    value={line.qty}
                    onChange={(e) => update(index, { qty: e.target.value })}
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder={t("common.unitPrice")}
                    value={line.unitPrice}
                    onChange={(e) =>
                      update(index, { unitPrice: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-3 flex items-center justify-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    disabled={lines.length === 1}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-1 text-right text-xs text-slate-500">
                {t("trx.subtotal")} {formatMAD(lineTotal(line))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="btn-secondary" onClick={addLine}>
          <Plus className="h-4 w-4" />
          {t("trx.addLine")}
        </button>
        <div className="text-sm text-slate-500">
          {t("trx.linesTotal")}{" "}
          <span className="font-semibold text-slate-800">
            {formatMAD(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
