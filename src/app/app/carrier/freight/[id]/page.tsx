import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { freightById, vehiclesOf, userById } from '@/lib/queries';
import { db } from '@/lib/db';
import { RouteMap } from '@/components/map/RouteMap';
import { BidForm } from '@/components/app/BidForm';
import { RouteLine } from '@/components/app/cards';
import { Badge, Avatar, SectionTitle } from '@/components/ui';
import { URGENCY } from '@/lib/labels';
import { quickEstimate } from '@/lib/pricing';
import { money, km, dateFr } from '@/lib/format';
import { vehicleByKey, cargoByKey, VEHICLE_TYPES } from '@/data/catalog';

export const dynamic = 'force-dynamic';

export default async function CarrierFreightDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CARRIER') redirect('/app');
  const freight = freightById(params.id);
  if (!freight) notFound();

  const v = vehicleByKey(freight.vehicleType);
  const c = cargoByKey(freight.cargoType);
  const shipper = userById(freight.shipperId);
  const suggested = quickEstimate(freight.distanceKm, freight.vehicleType, freight.cargoType);
  const fleet = vehiclesOf(user.id).filter((x) => x.available);
  const vehicleOptions = fleet.map((x) => ({ id: x.id, label: `${VEHICLE_TYPES.find((t) => t.key === x.type)?.label} · ${x.plate}` }));
  const existing = db().bids.find((b) => b.freightId === freight.id && b.carrierId === user.id && b.status === 'PENDING');

  return (
    <div className="space-y-5">
      <Link href="/app/carrier" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Fret disponible
      </Link>

      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-brand-600">{freight.reference}</span>
        <Badge tone={URGENCY[freight.urgency].tone}>{URGENCY[freight.urgency].label}</Badge>
        <Badge tone={freight.pricingMode === 'AUCTION' ? 'amber' : 'blue'}>{freight.pricingMode === 'AUCTION' ? 'Enchères' : 'Prix fixe'}</Badge>
      </div>
      <h1 className="-mt-3 text-2xl font-bold text-ink">{freight.title}</h1>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <RouteMap from={{ ...freight.pickup, label: freight.pickup.city }} to={{ ...freight.delivery, label: freight.delivery.city }} className="aspect-[16/10] w-full" />
          <div className="card p-5">
            <RouteLine from={`${freight.pickup.city} — ${freight.pickup.address}`} to={`${freight.delivery.city} — ${freight.delivery.address}`} />
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Info label="Distance" value={km(freight.distanceKm)} />
              <Info label="Durée" value={freight.durationH ? `${freight.durationH} h` : '—'} />
              <Info label="Poids" value={`${(freight.weightKg / 1000).toLocaleString('fr-FR')} t`} />
              <Info label="Véhicule" value={`${v.emoji} ${v.label}`} />
              <Info label="Marchandise" value={`${c.emoji} ${c.label}`} />
              <Info label="Chargement" value={dateFr(freight.pickupDate)} />
            </dl>
          </div>
          {shipper && (
            <div className="card p-4">
              <SectionTitle title="Chargeur" />
              <div className="flex items-center gap-3">
                <Avatar name={shipper.companyName ?? shipper.name} color={shipper.avatarColor} size={40} />
                <div>
                  <p className="font-semibold text-ink">{shipper.companyName ?? shipper.name}</p>
                  <p className="text-xs text-ink-muted">⭐ {shipper.rating.toFixed(1)} ({shipper.ratingCount}) · {shipper.city}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card overflow-hidden">
            <div className="bg-brand-950 p-4 text-white">
              <p className="text-xs text-brand-200">{freight.pricingMode === 'AUCTION' ? 'Budget de départ' : 'Prix proposé'}</p>
              <p className="text-2xl font-extrabold">{money(freight.budget)}</p>
            </div>
          </div>
          <BidForm freightId={freight.id} suggestedPrice={suggested} vehicles={vehicleOptions} existing={existing ? { amount: existing.amount, etaHours: existing.etaHours, message: existing.message, vehicleId: existing.vehicleId } : null} />
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
