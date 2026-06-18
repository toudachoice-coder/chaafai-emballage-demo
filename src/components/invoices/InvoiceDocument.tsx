import React from "react";
import { LogoMark } from "@/components/Logo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { InvoiceView } from "@/lib/store";
import { formatMAD, formatDate } from "@/lib/format";

/** Clean, A4-style printable invoice for Chaafai Emballage. */
export function InvoiceDocument({ view }: { view: InvoiceView }) {
  const { invoice, client, clientName, items } = view;
  const annulee = view.docStatus === "Annulée";

  return (
    <div className="mx-auto w-full max-w-[800px] bg-white p-8 text-slate-800 sm:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <LogoMark size={52} />
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900">
              Chaafai <span className="text-brand-600">Emballage</span>
            </div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Solutions d&apos;emballage pour professionnels
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Maroc · contact@chaafai-emballage.ma
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold uppercase tracking-wide text-slate-900">
            Facture
          </div>
          <div className="mt-1 text-sm font-semibold text-brand-700">
            {invoice.number}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Date : {formatDate(invoice.date)}
          </div>
          <div className="mt-2 flex justify-end">
            <span
              className={`badge ${
                annulee
                  ? "bg-red-50 text-red-700"
                  : view.docStatus === "Brouillon"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-brand-50 text-brand-700"
              }`}
            >
              {view.docStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Client + meta */}
      <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Facturé à
          </div>
          <div className="text-base font-semibold text-slate-900">
            {clientName}
          </div>
          {client?.phone && (
            <div className="text-sm text-slate-600">Tél : {client.phone}</div>
          )}
          {client?.address && (
            <div className="text-sm text-slate-600">{client.address}</div>
          )}
          {client?.ice && (
            <div className="text-sm text-slate-600">ICE : {client.ice}</div>
          )}
        </div>
        <div className="sm:text-right">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Détails
          </div>
          <div className="text-sm text-slate-600">
            Référence vente :{" "}
            <span className="font-medium text-slate-800">
              {invoice.saleId ?? "—"}
            </span>
          </div>
          <div className="text-sm text-slate-600">
            Statut paiement :{" "}
            <span className="font-medium">
              <StatusBadge status={view.paymentStatus} />
            </span>
          </div>
        </div>
      </div>

      {/* Lines */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="border border-slate-200 px-3 py-2">Désignation</th>
            <th className="border border-slate-200 px-3 py-2 text-right">
              Qté
            </th>
            <th className="border border-slate-200 px-3 py-2 text-right">
              P.U. (DH)
            </th>
            <th className="border border-slate-200 px-3 py-2 text-right">
              Total (DH)
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="border border-slate-200 px-3 py-4 text-center text-slate-400"
              >
                Aucune ligne
              </td>
            </tr>
          ) : (
            items.map((it, i) => (
              <tr key={i}>
                <td className="border border-slate-200 px-3 py-2">
                  {it.name}
                </td>
                <td className="border border-slate-200 px-3 py-2 text-right">
                  {it.qty}
                </td>
                <td className="border border-slate-200 px-3 py-2 text-right">
                  {formatMAD(it.unitPrice)}
                </td>
                <td className="border border-slate-200 px-3 py-2 text-right">
                  {formatMAD(it.qty * it.unitPrice)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-sm">
          {view.discount > 0 && (
            <Row label="Remise" value={`- ${formatMAD(view.discount)}`} />
          )}
          <Row label="Total HT" value={formatMAD(view.totalHT)} />
          <Row
            label={`TVA (${Math.round(view.tvaRate * 100)} %)`}
            value={formatMAD(view.tvaAmount)}
          />
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
            <span>Total TTC</span>
            <span>{formatMAD(view.totalTTC)}</span>
          </div>
          <Row label="Montant payé" value={formatMAD(view.paid)} />
          <div className="flex items-center justify-between font-semibold">
            <span className="text-slate-600">Reste à payer</span>
            <span className={view.reste > 0 ? "text-red-600" : "text-brand-700"}>
              {formatMAD(view.reste)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Notes : </span>
          {invoice.notes}
        </div>
      )}

      {/* Signature + footer */}
      <div className="mt-10 grid grid-cols-2 gap-6">
        <div className="text-xs text-slate-400">
          <p>Merci pour votre confiance.</p>
          <p>Chaafai Emballage — Solutions d&apos;emballage pour professionnels.</p>
        </div>
        <div className="text-right">
          <div className="mb-12 text-sm font-medium text-slate-600">
            Cachet &amp; Signature
          </div>
          <div className="ml-auto h-px w-40 bg-slate-300" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
