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

/**
 * Génère un « reçu de livraison à signer » (bon de livraison papier) pré-rempli
 * avec les infos de la course, avec zones à remplir et cadres de signature
 * (destinataire + chauffeur). À imprimer / partager, puis faire signer.
 */
export async function shareDeliveryReceipt(course: Course, at: number, driverName?: string): Promise<void> {
  const html = buildDeliveryReceipt(course, at, driverName);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Reçu de livraison ${course.reference}` });
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

function buildDeliveryReceipt(course: Course, at: number, driverName?: string): string {
  const vehicle = vehicleByKey(course.vehicleType).label;
  const cargo = cargoByKey(course.cargoType).label;
  const rows: [string, string][] = [
    ['Référence', course.reference],
    ['Code de suivi', course.code],
    ['Date', dateFr(at)],
    ['Client', course.client.name],
    ['Téléphone', course.client.phone],
    ['Trajet', `${course.pickup.city} → ${course.delivery.city} · ${km(course.distanceKm)}`],
    ['Chargement', course.pickup.address || course.pickup.city],
    ['Livraison', course.delivery.address || course.delivery.city],
    ['Marchandise', `${cargo} · ${course.weightKg.toLocaleString('fr-FR')} kg${course.cargoDescription ? ' · ' + course.cargoDescription : ''}`],
    ['Véhicule', vehicle],
  ];
  if (driverName) rows.push(['Chauffeur', driverName]);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    @page{size:A4;margin:14mm 14mm}
    *{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0b1220;box-sizing:border-box}
    body{margin:0;font-size:12px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2a44a0;padding-bottom:12px}
    .brand{font-size:26px;font-weight:900}.brand span{color:#f07d1a}
    .brand .sub{font-size:10px;color:#6b7280;font-weight:700;margin-top:3px}
    .doc{text-align:right}.doc h1{font-size:19px;margin:0;color:#2a44a0;letter-spacing:1px}
    .doc .meta{font-size:11px;color:#6b7280;margin-top:4px}
    h2{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#2a44a0;margin:18px 0 6px}
    table{width:100%;border-collapse:collapse}
    td{padding:7px 6px;border-bottom:1px solid #eef1f6;vertical-align:top}
    td.k{color:#6b7280;width:34%}td.v{font-weight:700}
    .total{margin-top:14px;background:#16224d;color:#fff;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center}
    .total .l{font-size:12px;opacity:.85}.total .a{font-size:22px;font-weight:900}
    .box{border:1px solid #e6e9f0;border-radius:10px;padding:12px 14px;margin-top:8px}
    .grid2{display:flex;gap:14px}.grid2>div{flex:1}
    .fill{border-bottom:1px solid #9aa3b2;min-height:15px}
    .check{display:flex;gap:22px;margin-top:6px}
    .chk{width:13px;height:13px;border:1.5px solid #6b7280;border-radius:3px;display:inline-block;margin-right:6px;vertical-align:-2px}
    .sigrow{display:flex;gap:18px;margin-top:14px}.sig{flex:1}
    .sigbox{height:88px;border:1px dashed #9aa3b2;border-radius:10px;margin-top:4px}
    .sig .cap{font-size:11px;color:#6b7280;margin-top:4px}
    .foot{margin-top:18px;border-top:1px solid #eef1f6;padding-top:8px;color:#6b7280;font-size:10px;text-align:center;line-height:1.6}
  </style></head><body>
    <div class="head">
      <div><div class="brand">ONE<span> WAY</span></div><div class="sub">TRANSPORT · LIVRAISON · SUIVI DIGITAL — ${esc(COMPANY.city)}, ${esc(COMPANY.country)} 🇲🇬</div></div>
      <div class="doc"><h1>REÇU DE LIVRAISON</h1><div class="meta">${esc(course.companyName || COMPANY.legalName)}</div></div>
    </div>
    <h2>Informations de la course</h2>
    <table>${rows.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`).join('')}</table>
    <div class="total"><div class="l">Montant à payer (Ar)</div><div class="a">${esc(money(course.price))}</div></div>
    <h2>À remplir à la réception</h2>
    <div class="box">
      <div class="grid2">
        <div><b>Nom du destinataire</b><div class="fill"></div></div>
        <div><b>Date &amp; heure de réception</b><div class="fill"></div></div>
      </div>
      <div style="margin-top:12px"><b>État de la marchandise</b>
        <div class="check"><span><span class="chk"></span>Conforme, sans réserve</span><span><span class="chk"></span>Avec réserves (préciser)</span></div>
        <div class="fill" style="margin-top:8px"></div>
        <div class="fill" style="margin-top:12px"></div>
      </div>
    </div>
    <div class="sigrow">
      <div class="sig"><b>Signature du destinataire</b><div class="sigbox"></div><div class="cap">Précédée de « Reçu conforme »</div></div>
      <div class="sig"><b>Signature du chauffeur</b><div class="sigbox"></div><div class="cap">${esc(driverName || 'ONE WAY')}</div></div>
    </div>
    <div class="foot">${esc(COMPANY.legalName)} · ${esc(COMPANY.phone)} · ${esc(COMPANY.email)}<br/>Ce reçu atteste la remise de la marchandise. Toute réserve doit être mentionnée à la réception. Merci — ONE WAY 🇲🇬</div>
  </body></html>`;
}
