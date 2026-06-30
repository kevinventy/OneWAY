'use client';

import { useEffect, useState } from 'react';
import { RealMap } from '@/components/map/RealMap';
import { Badge } from '@/components/ui';
import { telHref } from '@/data/company';
import { apiGet } from '@/lib/fetcher';
import { km, duration, dateTimeFr } from '@/lib/format';
import type { PublicTracking } from '@/lib/types';
import { MapPin, Flag, Phone, Package, Truck, RefreshCw, CheckCircle2 } from 'lucide-react';

/** Suivi client en temps réel : carte + km restants + progression + historique. */
export function LiveTracking({ initial, code }: { initial: PublicTracking; code: string }) {
  const [t, setT] = useState<PublicTracking>(initial);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initial.delivered || initial.cancelled) return;
    const id = setInterval(async () => {
      try {
        setRefreshing(true);
        const data = await apiGet<PublicTracking>(`/api/track/${encodeURIComponent(code)}`);
        setT(data);
      } catch {
        /* hors-ligne : on garde la dernière position connue */
      } finally {
        setRefreshing(false);
      }
    }, 12000);
    return () => clearInterval(id);
  }, [code, initial.delivered, initial.cancelled]);

  const remainingH = Math.max(0, t.durationH * (1 - t.progress));

  return (
    <div className="space-y-4">
      {/* En-tête statut */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-ink-muted">Course {t.reference}</p>
            <p className="font-mono text-lg font-extrabold tracking-widest text-ink">{t.code}</p>
          </div>
          <Badge tone={t.statusTone}>{t.statusLabel}</Badge>
        </div>

        {/* Progression */}
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.round(t.progress * 100)}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-ink-muted">
            <span>{t.pickup.city}</span>
            <span>{t.delivery.city}</span>
          </div>
        </div>
      </div>

      {/* Carte temps réel */}
      <RealMap
        className="aspect-[4/5] w-full sm:aspect-[16/10]"
        route={t.routeGeometry}
        current={t.current}
        from={{ lat: t.pickup.lat, lng: t.pickup.lng, label: t.pickup.city }}
        to={{ lat: t.delivery.lat, lng: t.delivery.lng, label: t.delivery.city }}
        kmRemaining={t.kmRemaining}
      />

      {/* Indicateurs clés */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Km restants" value={t.delivered ? '0 km' : km(t.kmRemaining)} highlight />
        <Metric label="Distance totale" value={km(t.distanceKm)} />
        <Metric label={t.delivered ? 'Livrée' : 'Temps restant'} value={t.delivered ? '✓' : `~${duration(remainingH)}`} />
      </div>

      {/* Itinéraire */}
      <div className="card divide-y divide-slate-100">
        <Row icon={<MapPin size={18} className="text-emerald-600" />} title="Chargement" main={t.pickup.address} sub={t.pickup.city} />
        <Row icon={<Flag size={18} className="text-rose-600" />} title="Livraison" main={t.delivery.address} sub={t.delivery.city} />
        <Row icon={<Package size={18} className="text-brand-500" />} title="Marchandise" main={t.cargo.label} sub={`${t.cargo.weightKg.toLocaleString('fr-FR')} kg`} />
        <Row icon={<Truck size={18} className="text-ink-soft" />} title="Véhicule" main={t.vehicle.label} sub={t.transporter.company} />
      </div>

      {/* Contact transporteur */}
      {t.transporter.phone && !t.cancelled && (
        <a href={telHref(t.transporter.phone)} className="btn-primary w-full py-3.5">
          <Phone size={18} /> Appeler le transporteur
          {t.transporter.driverName ? ` (${t.transporter.driverName})` : ''}
        </a>
      )}

      {/* Historique */}
      <div className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Historique</h2>
        {t.timeline.length === 0 ? (
          <p className="text-sm text-ink-muted">La course n&apos;a pas encore démarré.</p>
        ) : (
          <ol className="space-y-3">
            {[...t.timeline].reverse().map((e, i) => (
              <li key={`${e.at}-${i}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={i === 0 ? 'mt-1 h-2.5 w-2.5 rounded-full bg-brand-500' : 'mt-1 h-2.5 w-2.5 rounded-full bg-slate-300'} />
                  {i < t.timeline.length - 1 && <span className="my-0.5 w-px flex-1 bg-slate-200" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-medium text-ink">{e.label}</p>
                  <p className="text-[11px] text-ink-muted">{dateTimeFr(e.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
        {t.delivered ? (
          <><CheckCircle2 size={13} className="text-emerald-600" /> Livraison terminée</>
        ) : (
          <><RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Mise à jour automatique</>
        )}
      </p>
    </div>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className={highlight ? 'mt-0.5 text-lg font-extrabold text-brand-700' : 'mt-0.5 text-lg font-extrabold text-ink'}>{value}</p>
    </div>
  );
}

function Row({ icon, title, main, sub }: { icon: React.ReactNode; title: string; main: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{title}</p>
        <p className="truncate text-sm font-semibold text-ink">{main}</p>
      </div>
      <span className="shrink-0 text-xs text-ink-muted">{sub}</span>
    </div>
  );
}
