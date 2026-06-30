import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Truck, Flag, MapPin, Phone, Radio, CheckCircle2, Package, Ban } from 'lucide-react';
import { GererNav } from '@/components/gerer/GererNav';
import { RouteMap } from '@/components/map/RouteMap';
import { TrackingTimeline } from '@/components/app/TrackingTimeline';
import { LiveRefresh } from '@/components/app/LiveRefresh';
import { ShareTracking } from '@/components/gerer/ShareTracking';
import { Badge } from '@/components/ui';
import { courseById, resolveCompanyId } from '@/lib/courses';
import { trackingFor } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { advanceCourseAction, cancelCourseAction } from '@/app/gerer/actions';
import { SHIPMENT_STATUS } from '@/lib/labels';
import { STATUS_ACTION, nextStatus } from '@/lib/flow';
import { money, km, duration } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CourseDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  // Scope à l'entreprise du gérant (admin → entreprise par défaut). Empêche l'accès
  // à une course d'une autre société via un id deviné (IDOR).
  const companyId = resolveCompanyId(user?.role === 'CARRIER' ? user.id : undefined);
  const course = courseById(params.id, companyId);
  if (!course) notFound();

  const { shipment, freight, driverName, remainingKm, pct } = course;
  const events = trackingFor(shipment.id);
  const delivered = shipment.status === 'DELIVERED';
  const cancelled = shipment.status === 'CANCELLED';
  const active = !delivered && !cancelled;
  const next = nextStatus(shipment.status);
  const actionLabel = STATUS_ACTION[shipment.status];

  return (
    <div className="min-h-screen bg-slate-50">
      <GererNav active="gerer" user={user} />
      <LiveRefresh enabled={active} />

      <div className="container-app py-8">
        <Link href="/gerer" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Tableau de bord
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-sm font-bold text-brand-600">{freight.reference}</span>
            <h1 className="text-2xl font-bold text-ink">{freight.title}</h1>
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin size={14} className="text-emerald-600" /> {freight.pickup.city}
              <span>→</span>
              <Flag size={14} className="text-rose-600" /> {freight.delivery.city}
            </p>
          </div>
          <Badge tone={SHIPMENT_STATUS[shipment.status].tone}>{SHIPMENT_STATUS[shipment.status].label}</Badge>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {/* Carte + km restants */}
            <div className="card overflow-hidden">
              <RouteMap
                from={{ ...freight.pickup, label: freight.pickup.city }}
                to={{ ...freight.delivery, label: freight.delivery.city }}
                current={active ? { lat: shipment.currentLat!, lng: shipment.currentLng! } : null}
                progress={shipment.progress}
                className="aspect-[16/10] w-full rounded-none border-0"
              />
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                <Stat label="Distance" value={km(freight.distanceKm)} />
                <Stat label="Km restants" value={delivered ? '0 km' : km(remainingKm)} highlight={active} />
                <Stat label="Avancement" value={`${pct}%`} />
              </div>
            </div>

            {cancelled && (
              <div className="card flex items-center gap-2 p-4 text-sm font-medium text-rose-600">
                <Ban size={16} /> Cette course a été annulée.
              </div>
            )}

            {/* Avancer la course */}
            {active && (
              <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="text-sm font-semibold text-ink">Faire avancer la course</p>
                  <p className="text-xs text-ink-muted">
                    Étape suivante : {next ? SHIPMENT_STATUS[next].label : '—'}
                  </p>
                </div>
                <form action={advanceCourseAction}>
                  <input type="hidden" name="shipmentId" value={shipment.id} />
                  <button type="submit" className="btn-primary">
                    <Truck size={16} /> {actionLabel ?? 'Avancer'}
                  </button>
                </form>
              </div>
            )}

            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-soft">Historique de suivi</h2>
              <TrackingTimeline events={events} />
            </div>
          </div>

          {/* Aside */}
          <aside className="space-y-5">
            {/* Code de suivi à partager */}
            <div className="card p-4">
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
                <Radio size={15} /> Suivi client
              </h2>
              <p className="mb-2 text-xs text-ink-muted">
                Partagez ce code (ou le lien) au client par SMS / WhatsApp.
              </p>
              <ShareTracking code={shipment.trackingCode} />
            </div>

            {/* Chauffeur & client */}
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink-soft">Affectation</h2>
              <Row icon={<Truck size={15} className="text-brand-600" />} label="Chauffeur" value={driverName ?? 'Non assigné'} />
              <Row icon={<Package size={15} className="text-brand-600" />} label="Marchandise" value={`${freight.weightKg} kg`} />
              <Row icon={<CheckCircle2 size={15} className="text-brand-600" />} label="Durée" value={`≈ ${duration(freight.durationH)}`} />
              {freight.delivery.contactName && (
                <Row icon={<MapPin size={15} className="text-brand-600" />} label="Client" value={freight.delivery.contactName} />
              )}
              {freight.delivery.contactPhone && (
                <a href={`tel:${freight.delivery.contactPhone}`} className="btn-outline mt-2 w-full">
                  <Phone size={15} /> Appeler le client
                </a>
              )}
            </div>

            {/* Prix */}
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Prix de la course</span>
                <span className="text-lg font-extrabold text-ink">{money(shipment.price)}</span>
              </div>
            </div>

            {/* Annuler */}
            {active && (
              <form action={cancelCourseAction}>
                <input type="hidden" name="shipmentId" value={shipment.id} />
                <button type="submit" className="btn-ghost w-full text-rose-600">
                  <Ban size={15} /> Annuler la course
                </button>
              </form>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-4 text-center">
      <p className={`text-lg font-extrabold ${highlight ? 'text-amber-600' : 'text-ink'}`}>{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="flex items-center gap-2 text-ink-muted">{icon} {label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
