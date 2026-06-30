import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Truck,
  MapPin,
  PackageCheck,
  Camera,
  CheckCircle2,
  Clock,
  SearchX,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { RouteMap } from '@/components/map/RouteMap';
import { TrackingTimeline } from '@/components/app/TrackingTimeline';
import { LiveRefresh } from '@/components/app/LiveRefresh';
import { TrackingSearch } from '@/components/track/TrackingSearch';
import { Badge } from '@/components/ui';
import { shipmentByTrackingCode, freightById, userById, trackingFor } from '@/lib/queries';
import { SHIPMENT_STATUS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/apercu" aria-label="Accueil One Way">
          <Logo />
        </Link>
        <Link href="/suivi" className="btn-outline">
          <MapPin size={16} /> Autre suivi
        </Link>
      </div>
    </header>
  );
}

export default function PublicTrackingPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code);
  const shipment = shipmentByTrackingCode(code);

  // ── Code introuvable ───────────────────────────────────────────────────
  if (!shipment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader />
        <div className="container-app py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <SearchX size={26} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-ink">Code introuvable</h1>
            <p className="mt-2 text-ink-muted">
              Aucune livraison ne correspond au code <span className="font-semibold text-ink">{code}</span>.
              Vérifiez le code reçu par SMS ou WhatsApp.
            </p>
            <div className="mt-6">
              <TrackingSearch placeholder="Réessayer — ex. OWMG3456" autoFocus />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const freight = freightById(shipment.freightId)!;
  const carrier = userById(shipment.carrierId)!;
  const events = trackingFor(shipment.id);
  const delivered = shipment.status === 'DELIVERED';
  const pct = Math.round(shipment.progress * 100);
  const remainingH = Math.max(0, Math.round(freight.durationH * (1 - shipment.progress)));
  const status = SHIPMENT_STATUS[shipment.status];

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <LiveRefresh enabled={!delivered} />

      <div className="container-app py-8">
        <Link href="/suivi" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Suivre une autre livraison
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-sm font-bold text-brand-600">Suivi {shipment.trackingCode}</span>
            <h1 className="text-2xl font-bold text-ink">{freight.title}</h1>
            <p className="text-sm text-ink-muted">
              {freight.pickup.city} → {freight.delivery.city} · {freight.distanceKm} km
            </p>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* Carte + progression */}
          <div className="space-y-5 lg:col-span-2">
            <div className="card overflow-hidden">
              <RouteMap
                from={{ ...freight.pickup, label: freight.pickup.city }}
                to={{ ...freight.delivery, label: freight.delivery.city }}
                current={!delivered ? { lat: shipment.currentLat!, lng: shipment.currentLng! } : null}
                progress={shipment.progress}
                className="aspect-[16/10] w-full rounded-none border-0"
              />
              <div className="p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-ink">
                    <Truck size={16} className="text-amber-500" /> {pct} % du trajet
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    {delivered ? (
                      <>
                        <CheckCircle2 size={15} className="text-emerald-500" /> Livré
                      </>
                    ) : (
                      <>
                        <Clock size={15} /> Arrivée estimée ≈ {remainingH} h
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-soft">Historique de suivi</h2>
              <TrackingTimeline events={events} />
            </div>
          </div>

          {/* Aside : transporteur + étapes */}
          <aside className="space-y-5">
            <div className="card p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink-soft">Votre transporteur</h2>
              <p className="font-semibold text-ink">{carrier.companyName ?? carrier.name}</p>
              <p className="text-xs text-ink-muted">{carrier.city}</p>
              <a href={`tel:${carrier.phone}`} className="btn-outline mt-3 w-full">
                <Phone size={15} /> Appeler le transporteur
              </a>
            </div>

            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink-soft">Étapes</h2>
              <ol className="space-y-3 text-sm">
                {[
                  { icon: <PackageCheck size={15} />, t: 'Pris en charge', done: pct > 0 },
                  { icon: <Camera size={15} />, t: 'Chargé', done: pct >= 10 },
                  { icon: <Truck size={15} />, t: 'En route', done: pct >= 15 && !delivered, live: !delivered && pct >= 15 },
                  { icon: <CheckCircle2 size={15} />, t: 'Livré', done: delivered },
                ].map((s, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        s.live
                          ? 'bg-amber-100 text-amber-600 animate-pulse-dot'
                          : s.done
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {s.icon}
                    </span>
                    <span className={s.done || s.live ? 'font-medium text-ink' : 'text-ink-muted'}>{s.t}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="px-1 text-center text-xs text-ink-muted">
              Page de suivi publique · aucune donnée personnelle requise.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
