import Link from 'next/link';
import { Plus, Truck, CheckCircle2, Banknote, Users, MapPin, Flag, ArrowRight } from 'lucide-react';
import { GererNav } from '@/components/gerer/GererNav';
import { RouteMap } from '@/components/map/RouteMap';
import { Badge } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';
import { allCourses, activeCourses, fleetStats, type CourseView } from '@/lib/courses';
import { SHIPMENT_STATUS } from '@/lib/labels';
import { money, moneyCompact, km } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function GererDashboard() {
  const user = await getCurrentUser();
  const scope = user?.role === 'CARRIER' ? user.id : undefined;
  const courses = allCourses(scope);
  const active = activeCourses(scope);
  const stats = fleetStats(scope);
  const featured = active[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <GererNav active="gerer" user={user} />

      <div className="container-app py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">Tableau de bord</h1>
            <p className="text-sm text-ink-muted">Gérez vos courses, vos camions et vos chauffeurs.</p>
          </div>
          <Link href="/gerer/nouveau" className="btn-primary">
            <Plus size={18} /> Nouvelle course
          </Link>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={<Truck />} label="Courses en cours" value={String(stats.active)} tone="amber" />
          <Kpi icon={<CheckCircle2 />} label="Livrées" value={String(stats.delivered)} tone="green" />
          <Kpi icon={<Banknote />} label="CA livré" value={moneyCompact(stats.revenue)} tone="blue" />
          <Kpi icon={<Users />} label="Chauffeurs" value={String(stats.drivers.length)} tone="slate" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Carte de la course en cours */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink-soft">Course en cours</h2>
            {featured ? (
              <Link href={`/gerer/course/${featured.shipment.id}`} className="card block overflow-hidden hover:shadow-pop">
                <RouteMap
                  from={{ ...featured.freight.pickup, label: featured.freight.pickup.city }}
                  to={{ ...featured.freight.delivery, label: featured.freight.delivery.city }}
                  current={
                    featured.shipment.currentLat != null
                      ? { lat: featured.shipment.currentLat, lng: featured.shipment.currentLng! }
                      : null
                  }
                  progress={featured.shipment.progress}
                  className="aspect-[16/10] w-full rounded-none border-0"
                />
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold text-ink">{featured.freight.pickup.city} → {featured.freight.delivery.city}</p>
                    <p className="text-xs text-ink-muted">
                      {featured.pct}% · reste {km(featured.remainingKm)} · {featured.driverName ?? 'Non assigné'}
                    </p>
                  </div>
                  <Badge tone={SHIPMENT_STATUS[featured.shipment.status].tone}>
                    {SHIPMENT_STATUS[featured.shipment.status].label}
                  </Badge>
                </div>
              </Link>
            ) : (
              <div className="card flex flex-col items-center justify-center gap-3 p-10 text-center">
                <p className="text-ink-muted">Aucune course en cours.</p>
                <Link href="/gerer/nouveau" className="btn-primary"><Plus size={16} /> Créer une course</Link>
              </div>
            )}
          </div>

          {/* Liste des courses */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink-soft">Toutes les courses ({courses.length})</h2>
            <div className="space-y-3">
              {courses.map((c) => (
                <CourseRow key={c.shipment.id} c={c} />
              ))}
              {courses.length === 0 && <p className="text-sm text-ink-muted">Aucune course pour le moment.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'amber' | 'green' | 'blue' | 'slate' }) {
  const toneClass = {
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-brand-50 text-brand-600',
    slate: 'bg-slate-100 text-slate-600',
  }[tone];
  return (
    <div className="card p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>{icon}</div>
      <p className="mt-3 text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function CourseRow({ c }: { c: CourseView }) {
  return (
    <Link
      href={`/gerer/course/${c.shipment.id}`}
      className="card flex items-center gap-4 p-4 hover:shadow-pop"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="flex items-center gap-1"><MapPin size={13} className="text-emerald-600" />{c.freight.pickup.city}</span>
          <ArrowRight size={13} className="text-ink-muted" />
          <span className="flex items-center gap-1"><Flag size={13} className="text-rose-600" />{c.freight.delivery.city}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {c.freight.reference} · {c.freight.distanceKm} km · {money(c.shipment.price)}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${c.pct}%` }} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <Badge tone={SHIPMENT_STATUS[c.shipment.status].tone}>{SHIPMENT_STATUS[c.shipment.status].label}</Badge>
        <p className="mt-1 text-[11px] text-ink-muted">
          {c.shipment.status === 'DELIVERED' ? 'Livré' : `reste ${km(c.remainingKm)}`}
        </p>
      </div>
    </Link>
  );
}
