import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Phone, Navigation, Package } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { shipmentById, freightById, userById, trackingFor } from '@/lib/queries';
import { db } from '@/lib/db';
import { RouteMap } from '@/components/map/RouteMap';
import { TrackingTimeline } from '@/components/app/TrackingTimeline';
import { AdvanceControls } from '@/components/app/AdvanceControls';
import { LiveRefresh } from '@/components/app/LiveRefresh';
import { RouteLine } from '@/components/app/cards';
import { Badge, SectionTitle } from '@/components/ui';
import { SHIPMENT_STATUS } from '@/lib/labels';
import { km, dateFr } from '@/lib/format';
import { cargoByKey } from '@/data/catalog';

export const dynamic = 'force-dynamic';

export default async function DriverMission({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'DRIVER') redirect('/app');
  const shipment = shipmentById(params.id);
  if (!shipment) notFound();
  const driver = db().drivers.find((d) => d.id === shipment.driverId);
  if (!driver || driver.userId !== user.id) notFound();
  const freight = freightById(shipment.freightId)!;
  const shipper = userById(shipment.shipperId)!;
  const events = trackingFor(shipment.id);
  const delivered = shipment.status === 'DELIVERED';
  const c = cargoByKey(freight.cargoType);

  return (
    <div className="space-y-4">
      <LiveRefresh enabled={!delivered} />
      <Link href="/app/driver" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Mes missions
      </Link>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-brand-600">{shipment.reference}</span>
        <Badge tone={SHIPMENT_STATUS[shipment.status].tone}>{SHIPMENT_STATUS[shipment.status].label}</Badge>
      </div>
      <h1 className="-mt-2 text-xl font-bold text-ink">{freight.title}</h1>

      <RouteMap
        from={{ ...freight.pickup, label: freight.pickup.city }}
        to={{ ...freight.delivery, label: freight.delivery.city }}
        current={!delivered ? { lat: shipment.currentLat!, lng: shipment.currentLng! } : null}
        progress={shipment.progress}
        className="aspect-[16/10] w-full"
      />

      {/* Big actionable controls for the driver (mobile-first) */}
      {!delivered && <AdvanceControls shipmentId={shipment.id} status={shipment.status} />}

      <div className="card p-4">
        <RouteLine from={`${freight.pickup.city} — ${freight.pickup.address}`} to={`${freight.delivery.city} — ${freight.delivery.address}`} />
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <p className="flex items-center gap-1.5 text-ink-soft"><Navigation size={15} className="text-brand-600" /> {km(freight.distanceKm)}</p>
          <p className="flex items-center gap-1.5 text-ink-soft"><Package size={15} className="text-brand-600" /> {(freight.weightKg / 1000).toLocaleString('fr-FR')} t · {c.label}</p>
          <p className="text-ink-soft">📅 {dateFr(freight.pickupDate)}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {freight.pickup.contactPhone && (
            <a href={`tel:${freight.pickup.contactPhone}`} className="btn-outline"><Phone size={15} /> Contact départ</a>
          )}
          {freight.delivery.contactPhone && (
            <a href={`tel:${freight.delivery.contactPhone}`} className="btn-outline"><Phone size={15} /> Contact arrivée</a>
          )}
          <a href={`tel:${shipper.phone}`} className="btn-outline col-span-2"><Phone size={15} /> Appeler le chargeur</a>
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle title="Suivi" />
        <TrackingTimeline events={events} />
      </div>
    </div>
  );
}
