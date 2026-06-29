/**
 * Formatting helpers. ONE WAY trades primarily in Ariary (MGA) but the
 * platform is multi-currency ready (XOF, EUR, MAD ...).
 */

export type Currency = 'MGA' | 'XOF' | 'EUR' | 'MAD';

const CURRENCY_LABEL: Record<Currency, string> = {
  MGA: 'Ar',
  XOF: 'FCFA',
  EUR: '€',
  MAD: 'DH',
};

/** Format an integer amount, e.g. 1250000 -> "1 250 000 Ar". */
export function money(amount: number, currency: Currency = 'MGA'): string {
  const rounded = Math.round(amount);
  const grouped = rounded.toLocaleString('fr-FR');
  return `${grouped} ${CURRENCY_LABEL[currency]}`;
}

/** Compact money for cards, e.g. 1 250 000 -> "1,25 M Ar". */
export function moneyCompact(amount: number, currency: Currency = 'MGA'): string {
  const label = CURRENCY_LABEL[currency];
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2).replace('.', ',')} M ${label}`;
  if (amount >= 1_000) return `${Math.round(amount / 1000)} k ${label}`;
  return `${Math.round(amount)} ${label}`;
}

export function km(distance: number): string {
  return `${Math.round(distance).toLocaleString('fr-FR')} km`;
}

/** Hours as a French duration, 5.5 -> "5h30". */
export function duration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

export function dateFr(d: string | number | Date): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dateTimeFr(d: string | number | Date): string {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Relative time, e.g. "il y a 5 min". */
export function timeAgo(d: string | number | Date, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(d).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  return `il y a ${days} j`;
}
