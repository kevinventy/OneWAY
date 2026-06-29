import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, FileText, Phone, Truck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { shipmentById, freightById, userById, trackingFor, documentsFor } from '@/lib/queries';
import { db } from '@/lib/db';
import { RouteMap } from '@/components/map/RouteMap';
import { TrackingTimeline } from '@/components/app/TrackingTimeline';
import { LiveRefresh } from '@/components/app/LiveRefresh';
import { ReviewForm } from '@/components/app/ReviewForm';
import { Badge, SectionTitle, Avatar } from '@/components/ui';
import { RouteLine } from '@/components/app/cards';
import { SHIPMENT_STATUS, TX_STATUS } from '@/lib/labels';
import { money, dateFr } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function TrackingPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const shipment = shipmentById(params.id);
  if (!shipment) notFound();
  const freight = freightById(shipment.freightId)!;
  const carrier = userById(shipment.carrierId)!;
  const events = trackingFor(shipment.id);
  const docs = documentsFor({ shipmentId: shipment.id });
  const tx = db().transactions.find((t) => t.shipmentId === shipment.id);
  const myReview = db().reviews.find((r) => r.shipmentId === shipment.id && r.fromUserId === user.id);
  const delivered = shipment.status === 'DELIVERED';
  const isShipper = user.id === shipment.shipperId;

  return (
    <div className="space-y-5">
      <LiveRefresh enabled={!delivered} />
      <Link href="/app/shipper/shipments" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Mes expéditions
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
            <RouteLine from={freight.pickup.city} to={freight.delivery.city} />
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.round(shipment.progress * 100)}%` }} />
            </div>
            <p className="mt-1 text-right text-xs text-ink-muted">{Math.round(shipment.progress * 100)} % du trajet · code {shipment.trackingCode}</p>
          </div>

          <div className="card p-5">
            <SectionTitle title="Historique de suivi" />
            <TrackingTimeline events={events} />
          </div>
        </div>

        <aside className="space-y-5">
          {/* Carrier */}
          <div className="card p-4">
            <SectionTitle title="Transporteur" />
            <div className="flex items-center gap-3">
              <Avatar name={carrier.companyName ?? carrier.name} color={carrier.avatarColor} size={44} />
              <div>
                <p className="font-semibold text-ink">{carrier.companyName ?? carrier.name}</p>
                <p className="text-xs text-ink-muted">⭐ {carrier.rating.toFixed(1)} ({carrier.ratingCount}) · {carrier.city}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <a href={`tel:${carrier.phone}`} className="btn-outline flex-1"><Phone size={15} /> Appeler</a>
              <Link href={`/app/messages/${shipment.id}`} className="btn-outline flex-1"><Truck size={15} /> Message</Link>
            </div>
          </div>

          {/* Payment */}
          {tx && (
            <div className="card p-4">
              <SectionTitle title="Paiement" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Montant</span>
                <span className="font-bold text-ink">{money(tx.amount)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-ink-muted">Statut</span>
                <Badge tone={TX_STATUS[tx.status].tone}>{TX_STATUS[tx.status].label}</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Le paiement est conservé sous séquestre et libéré au transporteur à la confirmation de livraison.
              </p>
            </div>
          )}

          {/* Documents */}
          <div className="card p-4">
            <SectionTitle title="Documents" />
            <div className="space-y-2">
              {docs.map((d) => (
                <Link key={d.id} href={`/app/documents/${d.id}`} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 text-sm hover:bg-slate-50">
                  <FileText size={16} className="text-brand-600" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{d.title}</span>
                    <span className="text-xs text-ink-muted">{d.reference} · {dateFr(d.createdAt)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Review */}
          {delivered && isShipper && !myReview && (
            <ReviewForm shipmentId={shipment.id} targetName={carrier.companyName ?? carrier.name} />
          )}
        </aside>
      </div>
    </div>
  );
}
