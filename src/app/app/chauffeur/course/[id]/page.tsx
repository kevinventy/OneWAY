import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { courseById, driverByUser, vehicleById, eventsFor, kmRemaining } from '@/lib/queries';
import { RealMap } from '@/components/map/RealMap';
import { Badge } from '@/components/ui';
import { Stepper } from '@/components/course/Stepper';
import { AdvanceButton } from '@/components/course/AdvanceButton';
import { COURSE_STATUS } from '@/lib/labels';
import { cargoByKey, vehicleByKey } from '@/data/catalog';
import { km, duration, dateTimeFr } from '@/lib/format';
import { telHref } from '@/data/company';
import { ArrowLeft, ArrowRight, MapPin, Flag, Phone, Package, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChauffeurCourse({ params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireRole('CHAUFFEUR');
  } catch {
    redirect('/app');
  }

  const driver = driverByUser(user.id);
  const course = courseById(params.id);
  // Cloisonnement : un chauffeur ne voit que les courses qui lui sont affectées.
  if (!course || !driver || course.driverId !== driver.id) notFound();

  const st = COURSE_STATUS[course.status];
  const vehicle = vehicleById(course.vehicleId);
  const events = eventsFor(course.id);
  const active = !['LIVREE', 'ANNULEE'].includes(course.status);
  const remaining = kmRemaining(course);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/app/chauffeur" className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
        <ArrowLeft size={16} /> Mes missions
      </Link>

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

      {/* Km restants — gros */}
      <div className="card flex items-center justify-between bg-brand-600 p-5 text-white">
        <div>
          <p className="text-xs font-medium text-brand-100">Kilomètres restants</p>
          <p className="text-3xl font-extrabold">{course.status === 'LIVREE' ? '0' : remaining} km</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-brand-100">Distance totale</p>
          <p className="text-lg font-bold">{km(course.distanceKm)}</p>
        </div>
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

      {/* Stepper */}
      <div className="card p-4">
        <Stepper status={course.status} />
      </div>

      {/* Action principale — gros bouton */}
      <div className="card p-4">
        <AdvanceButton courseId={course.id} status={course.status} />
      </div>

      {/* Appeler le client — gros bouton */}
      <a href={telHref(course.client.phone)} className="btn bg-emerald-600 text-white hover:bg-emerald-700 w-full py-4 text-base">
        <Phone size={20} /> Appeler {course.client.name}
      </a>

      {/* Détails livraison */}
      <div className="card divide-y divide-slate-100">
        <Row icon={<MapPin size={18} className="text-emerald-600" />} title="Chargement" main={course.pickup.address} sub={course.pickup.city} />
        <Row icon={<Flag size={18} className="text-rose-600" />} title="Livraison" main={course.delivery.address} sub={course.delivery.city} />
        <Row icon={<Package size={18} className="text-ink-soft" />} title="Marchandise" main={`${cargoByKey(course.cargoType).label} · ${course.weightKg.toLocaleString('fr-FR')} kg`} sub={course.cargoDescription} />
        <Row icon={<Truck size={18} className="text-ink-soft" />} title="Véhicule" main={vehicle ? `${vehicle.name} · ${vehicle.plate}` : vehicleByKey(course.vehicleType).label} sub={`Durée estimée ${duration(course.durationH)}`} />
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
    </div>
  );
}

function Row({ icon, title, main, sub }: { icon: React.ReactNode; title: string; main: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{title}</p>
        <p className="text-sm font-semibold text-ink">{main}</p>
        <p className="text-xs text-ink-muted">{sub}</p>
      </div>
    </div>
  );
}
