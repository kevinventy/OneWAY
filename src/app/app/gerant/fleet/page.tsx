import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { vehiclesFor, driversFor, vehicleById } from '@/lib/queries';
import { Badge, SectionTitle, EmptyState } from '@/components/ui';
import { vehicleByKey } from '@/data/catalog';
import { telHref } from '@/data/company';
import { Truck, Phone, IdCard, CheckCircle2, Clock } from 'lucide-react';
import type { Tone } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DRIVER_STATUS: Record<string, { label: string; tone: Tone }> = {
  DISPONIBLE: { label: 'Disponible', tone: 'green' },
  EN_MISSION: { label: 'En mission', tone: 'amber' },
  HORS_LIGNE: { label: 'Hors ligne', tone: 'slate' },
};

export default async function FleetPage() {
  let user;
  try {
    user = await requireRole('GERANT');
  } catch {
    redirect('/app');
  }

  const vehicles = vehiclesFor(user.id);
  const drivers = driversFor(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold text-ink">Flotte</h1>

      {/* Véhicules */}
      <section>
        <SectionTitle title={`Véhicules (${vehicles.length})`} />
        {vehicles.length === 0 ? (
          <EmptyState icon={<Truck size={28} />} title="Aucun véhicule" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map((v) => (
              <div key={v.id} className="card flex items-center gap-3 p-4">
                <span className="text-3xl">{vehicleByKey(v.type).emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{v.name}</p>
                  <p className="text-xs text-ink-muted">{v.plate} · {(v.capacityKg / 1000).toLocaleString('fr-FR')} T</p>
                </div>
                <Badge tone={v.available ? 'green' : 'amber'}>
                  {v.available ? <><CheckCircle2 size={12} /> Libre</> : <><Clock size={12} /> Occupé</>}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Chauffeurs */}
      <section>
        <SectionTitle title={`Chauffeurs (${drivers.length})`} />
        {drivers.length === 0 ? (
          <EmptyState icon={<IdCard size={28} />} title="Aucun chauffeur" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {drivers.map((d) => {
              const ds = DRIVER_STATUS[d.status] ?? DRIVER_STATUS.HORS_LIGNE;
              const veh = vehicleById(d.vehicleId);
              return (
                <div key={d.id} className="card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{d.name}</p>
                    <Badge tone={ds.tone}>{ds.label}</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><IdCard size={13} /> {d.licenseNumber}</p>
                  {veh && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted"><Truck size={13} /> {veh.name} · {veh.plate}</p>}
                  <a href={telHref(d.phone)} className="btn-outline mt-3 w-full py-2 text-sm">
                    <Phone size={14} /> {d.phone}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
