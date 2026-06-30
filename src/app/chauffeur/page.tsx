import Link from 'next/link';
import { MapPin, Flag, Phone, Truck, CheckCircle2, Navigation } from 'lucide-react';
import { GererNav } from '@/components/gerer/GererNav';
import { LiveRefresh } from '@/components/app/LiveRefresh';
import { Badge } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';
import { driverCoursesByUser, type CourseView } from '@/lib/courses';
import { advanceCourseAction } from '@/app/gerer/actions';
import { SHIPMENT_STATUS } from '@/lib/labels';
import { STATUS_ACTION } from '@/lib/flow';
import { km } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ChauffeurPage() {
  const user = await getCurrentUser();
  const mine = user ? driverCoursesByUser(user.id) : [];
  const active = mine.filter((c) => !['DELIVERED', 'CANCELLED'].includes(c.shipment.status));
  const delivered = mine.filter((c) => c.shipment.status === 'DELIVERED').slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50">
      <GererNav active="chauffeur" user={user} />
      <LiveRefresh enabled={active.length > 0} />

      <div className="container-app max-w-2xl py-8">
        <h1 className="text-2xl font-bold text-ink">Mes missions</h1>
        <p className="text-sm text-ink-muted">Bonjour {user?.name?.split(' ')[0] ?? ''} · {active.length} mission(s) en cours.</p>

        <div className="mt-6 space-y-4">
          {active.map((c) => (
            <MissionCard key={c.shipment.id} c={c} />
          ))}
          {active.length === 0 && (
            <div className="card p-10 text-center text-ink-muted">Aucune mission en cours. 👍</div>
          )}
        </div>

        {delivered.length > 0 && (
          <>
            <h2 className="mb-3 mt-10 text-sm font-semibold text-ink-soft">Dernières livraisons</h2>
            <div className="space-y-3">
              {delivered.map((c) => (
                <div key={c.shipment.id} className="card flex items-center justify-between p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    {c.freight.pickup.city} → {c.freight.delivery.city}
                  </div>
                  <Badge tone="green">Livré</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MissionCard({ c }: { c: CourseView }) {
  const { shipment, freight, remainingKm, pct } = c;
  const action = STATUS_ACTION[shipment.status];

  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-brand-600">{freight.reference}</span>
          <Badge tone={SHIPMENT_STATUS[shipment.status].tone}>{SHIPMENT_STATUS[shipment.status].label}</Badge>
        </div>

        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <MapPin size={16} className="shrink-0 text-emerald-600" /> {freight.pickup.city}
          </p>
          <p className="flex items-center gap-2 font-semibold text-ink">
            <Flag size={16} className="shrink-0 text-rose-600" /> {freight.delivery.city}
          </p>
        </div>

        {/* Km restants — bien visible pour le chauffeur */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <Navigation size={16} /> Distance restante
          </span>
          <span className="text-xl font-extrabold text-amber-700">{km(remainingKm)}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-right text-xs text-ink-muted">{pct}% du trajet · {freight.distanceKm} km au total</p>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 p-4 sm:flex-row">
        {action && (
          <form action={advanceCourseAction} className="flex-1">
            <input type="hidden" name="shipmentId" value={shipment.id} />
            <button type="submit" className="btn-primary w-full text-base">
              <Truck size={18} /> {action}
            </button>
          </form>
        )}
        {freight.delivery.contactPhone && (
          <a href={`tel:${freight.delivery.contactPhone}`} className="btn-outline sm:w-auto">
            <Phone size={16} /> Client
          </a>
        )}
        <Link href={`/suivi/${shipment.trackingCode}`} className="btn-ghost sm:w-auto" target="_blank">
          Carte
        </Link>
      </div>
    </div>
  );
}
