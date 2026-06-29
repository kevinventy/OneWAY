import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, FileText, Phone, User } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { shipmentById, freightById, userById, trackingFor, documentsFor } from '@/lib/queries';
import { db } from '@/lib/db';
import { RouteMap } from '@/components/map/RouteMap';
import { TrackingTimeline } from '@/components/app/TrackingTimeline';
import { AdvanceControls } from '@/components/app/AdvanceControls';
import { LiveRefresh } from '@/components/app/LiveRefresh';
import { ReviewForm } from '@/components/app/ReviewForm';
import { RouteLine } from '@/components/app/cards';
import { Badge, SectionTitle, Avatar } from '@/components/ui';
import { SHIPMENT_STATUS } from '@/lib/labels';
import { money, km, dateFr } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CarrierMission({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CARRIER') redirect('/app');
  const shipment = shipmentById(params.id);
  if (!shipment || shipment.carrierId !== user.id) notFound();
  const freight = freightById(shipment.freightId)!;
  const shipper = userById(shipment.shipperId)!;
  const driver = db().drivers.find((d) => d.id === shipment.driverId);
  const events = trackingFor(shipment.id);
  const docs = documentsFor({ shipmentId: shipment.id });
  const delivered = shipment.status === 'DELIVERED';
  const myReview = db().reviews.find((r) => r.shipmentId === shipment.id && r.fromUserId === user.id);

  return (
    <div className="space-y-5">
      <LiveRefresh enabled={!delivered} />
      <Link href="/app/carrier/missions" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Mes missions
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-bold text-brand-600">{shipment.reference}</span>
          <h1 className="text-2xl font-bold text-ink">{freight.title}</h1>
        </div>
        <Badge tone={SHIPMENT_STATUS[shipment.status].tone}>{SHIPMENT_STATUS[shipment.status].label}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <RouteMap
            from={{ ...freight.pickup, label: freight.pickup.city }}
            to={{ ...freight.delivery, label: freight.delivery.city }}
            current={!delivered ? { lat: shipment.currentLat!, lng: shipment.currentLng! } : null}
            progress={shipment.progress}
            className="aspect-[16/10] w-full"
          />
          <div className="card p-5">
            <RouteLine from={`${freight.pickup.city} — ${freight.pickup.address}`} to={`${freight.delivery.city} — ${freight.delivery.address}`} />
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Info label="Distance" value={km(freight.distanceKm)} />
              <Info label="Poids" value={`${(freight.weightKg / 1000).toLocaleString('fr-FR')} t`} />
              <Info label="Chargement" value={dateFr(freight.pickupDate)} />
              <Info label="Rémunération" value={money(shipment.price)} />
            </dl>
          </div>
          <div className="card p-5">
            <SectionTitle title="Historique de suivi" />
            <TrackingTimeline events={events} />
          </div>
        </div>

        <aside className="space-y-5">
          {!delivered && <AdvanceControls shipmentId={shipment.id} status={shipment.status} />}

          <div className="card p-4">
            <SectionTitle title="Chargeur" />
            <div className="flex items-center gap-3">
              <Avatar name={shipper.companyName ?? shipper.name} color={shipper.avatarColor} size={40} />
              <div>
                <p className="font-semibold text-ink">{shipper.companyName ?? shipper.name}</p>
                <p className="text-xs text-ink-muted">⭐ {shipper.rating.toFixed(1)} · {shipper.city}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <a href={`tel:${shipper.phone}`} className="btn-outline flex-1"><Phone size={15} /> Appeler</a>
              <Link href={`/app/messages/${shipment.id}`} className="btn-outline flex-1">Message</Link>
            </div>
          </div>

          {driver && (
            <div className="card p-4">
              <SectionTitle title="Chauffeur affecté" />
              <p className="flex items-center gap-2 text-sm font-medium text-ink"><User size={15} /> {driver.name}</p>
              <p className="text-xs text-ink-muted">Permis {driver.licenseNumber} · {driver.phone}</p>
            </div>
          )}

          {docs.length > 0 && (
            <div className="card p-4">
              <SectionTitle title="Documents" />
              <div className="space-y-2">
                {docs.map((d) => (
                  <Link key={d.id} href={`/app/documents/${d.id}`} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 text-sm hover:bg-slate-50">
                    <FileText size={16} className="text-brand-600" />
                    <span className="truncate font-medium text-ink">{d.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {delivered && !myReview && <ReviewForm shipmentId={shipment.id} targetName={shipper.companyName ?? shipper.name} />}
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
