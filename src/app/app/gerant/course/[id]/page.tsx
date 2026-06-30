import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { courseById, driversFor, driverById, vehicleById, eventsFor, kmRemaining } from '@/lib/queries';
import { RealMap } from '@/components/map/RealMap';
import { Badge } from '@/components/ui';
import { Stepper } from '@/components/course/Stepper';
import { AdvanceButton } from '@/components/course/AdvanceButton';
import { AssignDriver, type AssignableDriver } from '@/components/gerant/AssignDriver';
import { ShareTracking } from '@/components/gerant/ShareTracking';
import { CancelCourseButton } from '@/components/gerant/CancelCourseButton';
import { COURSE_STATUS } from '@/lib/labels';
import { cargoByKey, vehicleByKey } from '@/data/catalog';
import { money, km, duration, dateTimeFr } from '@/lib/format';
import { telHref } from '@/data/company';
import { ArrowLeft, ArrowRight, MapPin, Flag, Phone, Package, Truck, User, Navigation } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GerantCourseDetail({ params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireRole('GERANT');
  } catch {
    redirect('/app');
  }

  const course = courseById(params.id);
  // Cloisonnement : un gérant ne voit que SES courses (anti-IDOR).
  if (!course || course.ownerId !== user.id) notFound();

  const st = COURSE_STATUS[course.status];
  const driver = driverById(course.driverId);
  const vehicle = vehicleById(course.vehicleId) ?? null;
  const events = eventsFor(course.id);
  const active = !['LIVREE', 'ANNULEE'].includes(course.status);
  const remaining = kmRemaining(course);

  const assignable: AssignableDriver[] = driversFor(user.id).map((d) => ({
    id: d.id,
    name: d.name,
    status: d.status,
    vehicleName: vehicleById(d.vehicleId)?.name,
    available: d.status === 'DISPONIBLE',
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/app/gerant/courses" className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
        <ArrowLeft size={16} /> Courses
      </Link>

      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-ink">{course.reference}</h1>
          <p className="flex items-center gap-2 text-sm text-ink">
            <span className="font-medium">{course.pickup.city}</span>
            <ArrowRight size={14} className="text-ink-muted" />
            <span className="font-medium">{course.delivery.city}</span>
          </p>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>

      {/* Stepper */}
      <div className="card p-4">
        <Stepper status={course.status} />
      </div>

      {/* Carte */}
      <RealMap
        className="aspect-[4/5] w-full sm:aspect-video"
        route={course.routeGeometry}
        current={active && course.currentLat != null ? { lat: course.currentLat, lng: course.currentLng! } : null}
        from={{ lat: course.pickup.lat, lng: course.pickup.lng, label: course.pickup.city }}
        to={{ lat: course.delivery.lat, lng: course.delivery.lng, label: course.delivery.city }}
        kmRemaining={active ? remaining : undefined}
      />

      {/* Indicateurs */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Km restants" value={course.status === 'LIVREE' ? '0 km' : km(remaining)} highlight />
        <Metric label="Distance" value={km(course.distanceKm)} />
        <Metric label="Prix" value={money(course.price)} />
      </div>

      {/* Action principale : assigner ou avancer */}
      <div className="card p-4">
        {course.status === 'NOUVELLE' ? (
          <AssignDriver courseId={course.id} drivers={assignable} />
        ) : (
          <AdvanceButton courseId={course.id} status={course.status} />
        )}
      </div>

      {/* Partage du code de suivi */}
      {course.status !== 'ANNULEE' && (
        <ShareTracking code={course.code} reference={course.reference} from={course.pickup.city} to={course.delivery.city} />
      )}

      {/* Détails */}
      <div className="card divide-y divide-slate-100">
        <Row icon={<User size={18} className="text-brand-500" />} title="Client" main={course.client.name} sub={course.client.phone} href={telHref(course.client.phone)} />
        <Row icon={<MapPin size={18} className="text-emerald-600" />} title="Chargement" main={course.pickup.address} sub={course.pickup.city} />
        <Row icon={<Flag size={18} className="text-rose-600" />} title="Livraison" main={course.delivery.address} sub={course.delivery.city} />
        <Row icon={<Package size={18} className="text-ink-soft" />} title="Marchandise" main={cargoByKey(course.cargoType).label} sub={`${course.weightKg.toLocaleString('fr-FR')} kg · ${course.cargoDescription}`} />
        <Row icon={<Truck size={18} className="text-ink-soft" />} title="Véhicule" main={vehicle ? `${vehicle.name} · ${vehicle.plate}` : vehicleByKey(course.vehicleType).label} sub={driver ? `Chauffeur : ${driver.name}` : 'Non assigné'} />
        <Row icon={<Navigation size={18} className="text-ink-soft" />} title="Durée estimée" main={duration(course.durationH)} sub={`Créée le ${dateTimeFr(course.createdAt)}`} />
      </div>

      {/* Historique */}
      {events.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">Historique</h2>
          <ol className="space-y-3">
            {[...events].reverse().map((e, i) => (
              <li key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={i === 0 ? 'mt-1 h-2.5 w-2.5 rounded-full bg-brand-500' : 'mt-1 h-2.5 w-2.5 rounded-full bg-slate-300'} />
                  {i < events.length - 1 && <span className="my-0.5 w-px flex-1 bg-slate-200" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-medium text-ink">{e.label}</p>
                  <p className="text-[11px] text-ink-muted">{dateTimeFr(e.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Annulation */}
      {active && <CancelCourseButton courseId={course.id} />}
    </div>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className={highlight ? 'mt-0.5 text-base font-extrabold text-brand-700' : 'mt-0.5 text-base font-extrabold text-ink'}>{value}</p>
    </div>
  );
}

function Row({ icon, title, main, sub, href }: { icon: React.ReactNode; title: string; main: string; sub: string; href?: string }) {
  const body = (
    <>
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{title}</p>
        <p className="text-sm font-semibold text-ink">{main}</p>
        <p className="text-xs text-ink-muted">{sub}</p>
      </div>
      {href && <Phone size={16} className="mt-1 shrink-0 text-brand-500" />}
    </>
  );
  return href ? (
    <a href={href} className="flex items-start gap-3 p-3.5 transition hover:bg-slate-50">{body}</a>
  ) : (
    <div className="flex items-start gap-3 p-3.5">{body}</div>
  );
}
