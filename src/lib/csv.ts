// Tiny client-side CSV export helper (no external dependency).

function escapeCell(value: string | number): string {
  const s = String(value ?? "");
  // Quote when the cell contains a separator, quote or newline.
  if (/[";\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Triggers a download of the given rows as a CSV file. Uses `;` as the
 * separator (Excel-FR friendly) and prepends a BOM so accents render
 * correctly in Excel.
 */
export function exportCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  if (typeof window === "undefined") return;
  const lines = [
    headers.map(escapeCell).join(";"),
    ...rows.map((r) => r.map(escapeCell).join(";")),
  ];
  const content = "﻿" + lines.join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
