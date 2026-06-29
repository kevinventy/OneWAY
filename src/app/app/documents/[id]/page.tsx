import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { freightById, shipmentById, userById } from '@/lib/queries';
import { computeQuote } from '@/lib/pricing';
import { LogoMark } from '@/components/brand/Logo';
import { PrintButton } from '@/components/app/PrintButton';
import { money, km, dateFr } from '@/lib/format';
import { vehicleByKey, cargoByKey, MARKETPLACE, PRICING_DEFAULTS } from '@/data/catalog';
import { DocumentType } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DOC_TITLE: Record<DocumentType, string> = {
  QUOTE: 'DEVIS DE TRANSPORT',
  BL: 'BORDEREAU DE LIVRAISON',
  INVOICE: 'FACTURE',
  POD: 'PREUVE DE LIVRAISON',
  CERTIFICATE: 'CERTIFICAT',
};

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const doc = db().documents.find((d) => d.id === params.id);
  if (!doc) notFound();

  const freight = doc.freightId ? freightById(doc.freightId) : undefined;
  const shipment = doc.shipmentId ? shipmentById(doc.shipmentId) : undefined;
  const shipperId = freight?.shipperId ?? shipment?.shipperId;
  const shipper = shipperId ? userById(shipperId) : undefined;
  const carrier = shipment ? userById(shipment.carrierId) : undefined;

  const v = freight ? vehicleByKey(freight.vehicleType) : undefined;
  const c = freight ? cargoByKey(freight.cargoType) : undefined;
  const quote =
    freight &&
    computeQuote({
      distanceKm: freight.distanceKm,
      vehicleType: freight.vehicleType,
      cargoType: freight.cargoType,
      weightKg: freight.weightKg,
      declaredValue: freight.declaredValue,
      handlingPickup: true,
      handlingDelivery: true,
      insurance: freight.insurance,
      vat: false,
    });
  const amount = shipment?.price ?? freight?.budget ?? quote?.totalTTC ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/app" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Retour
        </Link>
        <PrintButton />
      </div>

      {/* Document sheet */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-10 print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-brand-950 pb-4">
          <div className="flex items-center gap-3">
            <LogoMark className="h-12 w-12" />
            <div>
              <p className="text-xl font-extrabold text-ink">ONE WAY</p>
              <p className="text-xs text-ink-muted">Transport · Livraison · Suivi Digital</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-brand-700">{DOC_TITLE[doc.type]}</p>
            <p className="text-xs text-ink-muted">N° {doc.reference}</p>
            <p className="text-xs text-ink-muted">{dateFr(doc.createdAt)}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 font-bold text-ink-muted">👤 CLIENT</p>
            <p className="font-semibold text-ink">{shipper?.companyName ?? shipper?.name ?? '—'}</p>
            {shipper?.name && <p>{shipper.name}</p>}
            {shipper?.city && <p>{shipper.city}, Madagascar</p>}
            {shipper?.phone && <p>{shipper.phone}</p>}
          </div>
          <div className="text-right">
            <p className="mb-1 font-bold text-ink-muted">🚛 ONE WAY — TRANSPORT</p>
            <p className="font-semibold text-ink">{carrier?.companyName ?? 'One Way SARL'}</p>
            <p>Antananarivo, Madagascar</p>
            <p>contact@oneway.mg</p>
            {carrier?.phone && <p>{carrier.phone}</p>}
          </div>
        </div>

        {/* Transport params */}
        {freight && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="mb-2 font-bold text-ink-muted">📍 PARAMÈTRES DU TRANSPORT</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <Row k="Chargement" v={`${freight.pickup.city} — ${freight.pickup.address}`} />
              <Row k="Livraison" v={`${freight.delivery.city} — ${freight.delivery.address}`} />
              <Row k="Distance" v={km(freight.distanceKm)} />
              <Row k="Durée estimée" v={freight.durationH ? `${freight.durationH} h` : '—'} />
              <Row k="Véhicule" v={`${v?.emoji} ${v?.label}`} />
              <Row k="Marchandise" v={`${c?.emoji} ${c?.label}`} />
              <Row k="Date" v={dateFr(freight.pickupDate)} />
              <Row k="Poids" v={`${(freight.weightKg / 1000).toLocaleString('fr-FR')} t`} />
            </div>
          </div>
        )}

        {/* Body by type */}
        {(doc.type === 'QUOTE' || doc.type === 'INVOICE') && quote && (
          <div className="mt-6">
            <p className="mb-2 font-bold text-ink-muted">📦 DÉTAIL DES PRESTATIONS</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-ink-muted">
                  <th className="py-2">Désignation</th>
                  <th className="py-2 text-right">Montant (Ar)</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((l) => (
                  <tr key={l.key} className="border-b border-slate-100">
                    <td className="py-2">{l.label}</td>
                    <td className="py-2 text-right font-medium">{money(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td className="py-1 text-right text-ink-muted">Sous-total HT</td><td className="py-1 text-right font-semibold">{money(quote.subtotalHT)}</td></tr>
                <tr><td className="py-1 text-right text-ink-muted">TVA (20 % si applicable)</td><td className="py-1 text-right">{money(quote.vatAmount)}</td></tr>
                <tr className="text-base"><td className="py-2 text-right font-extrabold text-brand-700">TOTAL À PAYER (TTC)</td><td className="py-2 text-right font-extrabold text-brand-700">{money(amount)}</td></tr>
              </tfoot>
            </table>
            {doc.type === 'INVOICE' && (
              <p className="mt-3 text-xs text-ink-muted">
                Dont commission ONE WAY ({Math.round(MARKETPLACE.commissionRate * 100)} %) : {money(shipment?.commission ?? Math.round(amount * MARKETPLACE.commissionRate))}.
              </p>
            )}
          </div>
        )}

        {doc.type === 'BL' && freight && (
          <div className="mt-6 text-sm">
            <p className="mb-2 font-bold text-ink-muted">📦 MARCHANDISE TRANSPORTÉE</p>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-slate-100"><td className="py-2 text-ink-muted">Désignation</td><td className="py-2 text-right font-medium">{freight.title}</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2 text-ink-muted">Nature</td><td className="py-2 text-right">{c?.label}</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2 text-ink-muted">Poids</td><td className="py-2 text-right">{(freight.weightKg / 1000).toLocaleString('fr-FR')} t</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2 text-ink-muted">Dimensions / colis</td><td className="py-2 text-right">{freight.dimensions ?? '—'}</td></tr>
                <tr><td className="py-2 text-ink-muted">Valeur déclarée</td><td className="py-2 text-right">{freight.declaredValue ? money(freight.declaredValue) : '—'}</td></tr>
              </tbody>
            </table>
            <div className="mt-10 grid grid-cols-2 gap-10 text-center text-xs text-ink-muted">
              <div><div className="h-16 border-b border-slate-300" /><p className="mt-1">Signature expéditeur</p></div>
              <div><div className="h-16 border-b border-slate-300" /><p className="mt-1">Signature transporteur</p></div>
            </div>
          </div>
        )}

        {doc.type === 'POD' && shipment && (
          <div className="mt-6 text-sm">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <p className="font-bold">✅ Livraison confirmée</p>
              <p className="mt-1">Expédition {shipment.reference} livrée le {shipment.deliveredAt ? dateFr(shipment.deliveredAt) : '—'}.</p>
              <p>Code de suivi : {shipment.trackingCode}</p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-10 text-center text-xs text-ink-muted">
              <div><div className="h-16 border-b border-slate-300" /><p className="mt-1">Signature destinataire</p></div>
              <div><div className="h-16 border-b border-slate-300" /><p className="mt-1">Cachet ONE WAY</p></div>
            </div>
          </div>
        )}

        {/* Conditions */}
        <div className="mt-8 border-t border-slate-200 pt-4 text-[11px] leading-relaxed text-ink-muted">
          <p className="font-bold">📝 CONDITIONS GÉNÉRALES</p>
          <p>• Devis valable {PRICING_DEFAULTS.quoteValidityDays} jours. Prix en Ariary (MGA) HT sauf mention contraire.</p>
          <p>• Acompte : {Math.round(MARKETPLACE.depositRate * 100)} % à la commande. Pénalités de retard : {MARKETPLACE.lateFeeWeekly * 100} % par semaine.</p>
          <p>• Responsabilité limitée à la valeur déclarée. Paiement : MVola / Orange Money / Airtel Money / Wave / Virement.</p>
        </div>
        <p className="mt-6 text-center text-[11px] text-ink-muted">
          One Way SARL · Transport · Livraison · Suivi Digital · Antananarivo, Madagascar 🇲🇬
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-ink-muted">{k} :</span>
      <span className="text-right font-medium text-ink">{v}</span>
    </div>
  );
}
