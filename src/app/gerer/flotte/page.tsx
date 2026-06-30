import { Truck, User, Phone, CircleDot } from 'lucide-react';
import { GererNav } from '@/components/gerer/GererNav';
import { Badge } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';
import { companyVehicles, fleetStats, resolveCompanyId } from '@/lib/courses';
import { vehicleByKey } from '@/data/catalog';

export const dynamic = 'force-dynamic';

const DRIVER_STATUS: Record<string, { label: string; tone: 'green' | 'amber' | 'slate' }> = {
  AVAILABLE: { label: 'Disponible', tone: 'green' },
  ON_MISSION: { label: 'En mission', tone: 'amber' },
  OFFLINE: { label: 'Hors ligne', tone: 'slate' },
};

export default async function FlottePage() {
  const user = await getCurrentUser();
  const companyId = resolveCompanyId(user?.role === 'CARRIER' ? user.id : undefined);
  const vehicles = companyVehicles(companyId);
  const { drivers } = fleetStats(companyId);

  return (
    <div className="min-h-screen bg-slate-50">
      <GererNav active="flotte" user={user} />
      <div className="container-app py-8">
        <h1 className="text-2xl font-bold text-ink">Flotte & chauffeurs</h1>
        <p className="text-sm text-ink-muted">Vos {vehicles.length} véhicule(s) et {drivers.length} chauffeur(s).</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Véhicules */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <Truck size={15} /> Véhicules
            </h2>
            <div className="space-y-3">
              {vehicles.map((v) => (
                <div key={v.id} className="card flex items-center gap-3 p-4">
                  <div className="text-2xl">{vehicleByKey(v.type).emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{v.name}</p>
                    <p className="text-xs text-ink-muted">{v.plate} · {vehicleByKey(v.type).label} · {(v.capacityKg / 1000).toLocaleString('fr-FR')} T</p>
                  </div>
                  <Badge tone={v.available ? 'green' : 'amber'}>{v.available ? 'Disponible' : 'En service'}</Badge>
                </div>
              ))}
              {vehicles.length === 0 && <p className="text-sm text-ink-muted">Aucun véhicule.</p>}
            </div>
          </section>

          {/* Chauffeurs */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <User size={15} /> Chauffeurs
            </h2>
            <div className="space-y-3">
              {drivers.map((d) => {
                const st = DRIVER_STATUS[d.status] ?? DRIVER_STATUS.OFFLINE;
                return (
                  <div key={d.id} className="card flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <User size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{d.name}</p>
                      <p className="flex items-center gap-1 text-xs text-ink-muted"><Phone size={11} /> {d.phone}</p>
                    </div>
                    <Badge tone={st.tone}><CircleDot size={11} /> {st.label}</Badge>
                  </div>
                );
              })}
              {drivers.length === 0 && <p className="text-sm text-ink-muted">Aucun chauffeur.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
