import Link from 'next/link';
import { ArrowRight, MapPin, Package, Weight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { FREIGHT_STATUS, SHIPMENT_STATUS, URGENCY } from '@/lib/labels';
import { money, km, dateFr } from '@/lib/format';
import { vehicleByKey, cargoByKey } from '@/data/catalog';
import type { Freight, Shipment } from '@/lib/types';

export function RouteLine({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex items-center gap-1.5 font-semibold text-ink">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> {from}
      </span>
      <ArrowRight size={14} className="text-ink-muted" />
      <span className="flex items-center gap-1.5 font-semibold text-ink">
        <span className="h-2 w-2 rounded-full bg-rose-500" /> {to}
      </span>
    </div>
  );
}

export function FreightCard({
  freight,
  href,
  bidsCount,
  footer,
}: {
  freight: Freight;
  href: string;
  bidsCount?: number;
  footer?: React.ReactNode;
}) {
  const v = vehicleByKey(freight.vehicleType);
  const c = cargoByKey(freight.cargoType);
  const status = FREIGHT_STATUS[freight.status];
  return (
    <Link href={href} className="card block p-4 transition hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-600">{freight.reference}</span>
            <Badge tone={URGENCY[freight.urgency].tone}>{URGENCY[freight.urgency].label}</Badge>
          </div>
          <h3 className="mt-1 truncate font-semibold text-ink">{freight.title}</h3>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div className="mt-3">
        <RouteLine from={freight.pickup.city} to={freight.delivery.city} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="flex items-center gap-1"><MapPin size={13} /> {km(freight.distanceKm)}</span>
        <span className="flex items-center gap-1"><Weight size={13} /> {(freight.weightKg / 1000).toLocaleString('fr-FR')} t</span>
        <span className="flex items-center gap-1">{v.emoji} {v.label}</span>
        <span className="flex items-center gap-1"><Package size={13} /> {c.emoji} {c.label}</span>
        <span className="flex items-center gap-1"><Clock size={13} /> {dateFr(freight.pickupDate)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs text-ink-muted">{freight.pricingMode === 'AUCTION' ? 'Enchère · à partir de' : 'Prix fixe'}</p>
          <p className="text-lg font-bold text-ink">{money(freight.budget)}</p>
        </div>
        {bidsCount != null ? (
          <Badge tone={bidsCount > 0 ? 'blue' : 'slate'}>{bidsCount} offre{bidsCount > 1 ? 's' : ''}</Badge>
        ) : (
          footer
        )}
      </div>
    </Link>
  );
}

export function ShipmentCard({
  shipment,
  freight,
  href,
  subtitle,
}: {
  shipment: Shipment;
  freight: Freight;
  href: string;
  subtitle?: string;
}) {
  const status = SHIPMENT_STATUS[shipment.status];
  return (
    <Link href={href} className="card block p-4 transition hover:shadow-pop">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-600">{shipment.reference}</span>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <h3 className="mt-1 truncate font-semibold text-ink">{freight.title}</h3>
      <div className="mt-2">
        <RouteLine from={freight.pickup.city} to={freight.delivery.city} />
      </div>
      {/* progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.round(shipment.progress * 100)}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
        <span>{subtitle ?? `Code suivi · ${shipment.trackingCode}`}</span>
        <span className="font-semibold text-ink">{money(shipment.price)}</span>
      </div>
    </Link>
  );
}
