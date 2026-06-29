import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { money, km, dateFr } from './format';
import { computeQuote } from './pricing';
import { vehicleByKey, cargoByKey, MARKETPLACE, PRICING_DEFAULTS } from '@/data/catalog';
import type { Freight, Shipment, User } from './types';

const NAVY = '#16224d';
const ORANGE = '#f07d1a';

/** Génère et partage une facture / un devis PDF (en-tête ONE WAY). */
export async function generateDocumentPdf(opts: {
  freight: Freight;
  shipment?: Shipment | null;
  client?: User | null;
  type?: 'INVOICE' | 'QUOTE';
}): Promise<void> {
  const { freight, shipment, client } = opts;
  const type = opts.type ?? (shipment ? 'INVOICE' : 'QUOTE');
  const v = vehicleByKey(freight.vehicleType);
  const c = cargoByKey(freight.cargoType);
  const q = computeQuote({
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
  const amount = shipment?.price ?? freight.budget ?? q.totalTTC;
  const ref = shipment ? shipment.reference : freight.reference;
  const title = type === 'INVOICE' ? 'FACTURE' : 'DEVIS DE TRANSPORT';

  const lines = q.lines
    .map((l) => `<tr><td>${l.label}</td><td style="text-align:right">${money(l.amount)}</td></tr>`)
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    *{font-family:-apple-system,system-ui,sans-serif;color:#0b1220}
    body{padding:28px;font-size:13px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${NAVY};padding-bottom:14px}
    .brand{font-size:22px;font-weight:800;color:${NAVY}}
    .brand span{color:${ORANGE}}
    .doc{text-align:right}.doc b{color:${NAVY};font-size:16px}
    .muted{color:#5b6678;font-size:11px}
    h3{color:#5b6678;font-size:11px;letter-spacing:.5px;margin:18px 0 6px}
    .grid{display:flex;justify-content:space-between;gap:20px}
    table{width:100%;border-collapse:collapse;margin-top:6px}
    td{padding:7px 0;border-bottom:1px solid #eef0f4}
    .total{background:${NAVY};color:#fff;padding:12px 14px;border-radius:8px;display:flex;justify-content:space-between;margin-top:14px}
    .total b{font-size:18px}
    .cond{font-size:10px;color:#5b6678;margin-top:18px;line-height:1.5}
    .box{background:#f6f8fc;border-radius:8px;padding:12px}
  </style></head><body>
  <div class="head">
    <div><div class="brand">ONE<span> WAY</span></div><div class="muted">Transport · Livraison · Suivi Digital</div></div>
    <div class="doc"><b>${title}</b><div class="muted">N° ${ref}</div><div class="muted">${dateFr(Date.now())}</div></div>
  </div>
  <div class="grid">
    <div><h3>CLIENT</h3>${client?.companyName ?? client?.name ?? '—'}<div class="muted">${client?.city ?? ''}</div></div>
    <div style="text-align:right"><h3>ONE WAY — TRANSPORT</h3>One Way SARL<div class="muted">Antananarivo, Madagascar</div><div class="muted">contact@oneway.mg</div></div>
  </div>
  <h3>PARAMÈTRES DU TRANSPORT</h3>
  <div class="box grid">
    <div>📍 ${freight.pickup.city} → ${freight.delivery.city}<div class="muted">${km(freight.distanceKm)} · ${freight.durationH ? freight.durationH + ' h' : ''}</div></div>
    <div style="text-align:right">${v.emoji} ${v.label}<div class="muted">${c.emoji} ${c.label} · ${(freight.weightKg / 1000).toLocaleString('fr-FR')} t</div></div>
  </div>
  <h3>DÉTAIL DES PRESTATIONS</h3>
  <table><tr><td><b>Désignation</b></td><td style="text-align:right"><b>Montant (Ar)</b></td></tr>${lines}
    <tr><td style="text-align:right;color:#5b6678">Sous-total HT</td><td style="text-align:right;font-weight:700">${money(q.subtotalHT)}</td></tr>
  </table>
  <div class="total"><span>TOTAL À PAYER (TTC)</span><b>${money(amount)}</b></div>
  ${type === 'INVOICE' ? `<div class="muted" style="margin-top:8px">Dont commission ONE WAY (${Math.round(MARKETPLACE.commissionRate * 100)} %) : ${money(shipment?.commission ?? Math.round(amount * MARKETPLACE.commissionRate))}.</div>` : ''}
  <div class="cond"><b>Conditions :</b> Devis valable ${PRICING_DEFAULTS.quoteValidityDays} jours. Prix en Ariary (MGA). Acompte ${Math.round(MARKETPLACE.depositRate * 100)} % à la commande. Paiement : MVola / Orange Money / Airtel Money / Wave / Virement. Pénalités de retard ${MARKETPLACE.lateFeeWeekly * 100} %/semaine.</div>
  <div class="muted" style="text-align:center;margin-top:20px">One Way SARL · Transport · Livraison · Suivi Digital · Antananarivo, Madagascar 🇲🇬</div>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${title} ${ref}`, UTI: 'com.adobe.pdf' });
  }
}
