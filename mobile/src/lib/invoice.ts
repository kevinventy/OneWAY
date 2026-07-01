import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { money, km, dateFr } from '@/lib/format';
import { vehicleByKey, cargoByKey } from '@/data/catalog';
import { COMPANY } from '@/data/company';
import type { Course } from '@/lib/types';

/** Génère un PDF (facture ou reçu) et ouvre le partage (WhatsApp, e-mail…). */
export async function shareCourseDocument(course: Course, kind: 'FACTURE' | 'RECU', at: number): Promise<void> {
  const html = buildHtml(course, kind, at);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${kind === 'RECU' ? 'Reçu' : 'Facture'} ${course.reference}` });
  }
}

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}

function buildHtml(course: Course, kind: 'FACTURE' | 'RECU', at: number): string {
  const title = kind === 'RECU' ? 'REÇU DE PAIEMENT' : 'FACTURE';
  const vehicle = vehicleByKey(course.vehicleType).label;
  const cargo = cargoByKey(course.cargoType).label;
  const rows: [string, string][] = [
    ['Référence', course.reference],
    ['Code de suivi', course.code],
    ['Date', dateFr(at)],
    ['Client', course.client.name],
    ['Téléphone', course.client.phone],
    ['Trajet', `${course.pickup.city} → ${course.delivery.city}`],
    ['Chargement', course.pickup.address || course.pickup.city],
    ['Livraison', course.delivery.address || course.delivery.city],
    ['Distance', km(course.distanceKm)],
    ['Véhicule', vehicle],
    ['Marchandise', `${cargo} · ${course.weightKg.toLocaleString('fr-FR')} kg`],
  ];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    *{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0b1220}
    body{padding:32px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2a44a0;padding-bottom:16px}
    .brand{font-size:26px;font-weight:900}.brand span{color:#f07d1a}
    .brand .sub{font-size:11px;color:#6b7280;font-weight:600;margin-top:2px}
    .doc{text-align:right}.doc h1{font-size:20px;margin:0;color:#2a44a0;letter-spacing:1px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    td{padding:9px 6px;border-bottom:1px solid #eef1f6;font-size:13px}
    td.k{color:#6b7280;width:38%}td.v{font-weight:700;text-align:right}
    .total{margin-top:22px;background:#16224d;color:#fff;border-radius:12px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center}
    .total .l{font-size:13px;opacity:.85}.total .a{font-size:26px;font-weight:900}
    .foot{margin-top:28px;color:#6b7280;font-size:11px;text-align:center;line-height:1.5}
  </style></head><body>
    <div class="head">
      <div><div class="brand">ONE<span> WAY</span></div><div class="sub">Transport · Livraison · Suivi digital — ${esc(COMPANY.city)}, ${esc(COMPANY.country)}</div></div>
      <div class="doc"><h1>${title}</h1><div style="font-size:12px;color:#6b7280;margin-top:4px">${esc(course.companyName || COMPANY.legalName)}</div></div>
    </div>
    <table>${rows.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`).join('')}</table>
    <div class="total"><div class="l">${kind === 'RECU' ? 'Montant payé' : 'Total à payer'} (Ar)</div><div class="a">${esc(money(course.price))}</div></div>
    <div class="foot">${esc(COMPANY.legalName)} · ${esc(COMPANY.phone)} · ${esc(COMPANY.email)}<br/>Merci de votre confiance — ONE WAY 🇲🇬</div>
  </body></html>`;
}
