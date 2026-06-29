import { redirect } from 'next/navigation';
import { Truck, User, Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { vehiclesOf, driversOf } from '@/lib/queries';
import { Badge, SectionTitle, Stat } from '@/components/ui';
import { VEHICLE_TYPES } from '@/data/catalog';

export const dynamic = 'force-dynamic';

const DRIVER_STATUS: Record<string, { label: string; tone: 'green' | 'amber' | 'slate' }> = {
  AVAILABLE: { label: 'Disponible', tone: 'green' },
  ON_MISSION: { label: 'En mission', tone: 'amber' },
  OFFLINE: { label: 'Hors ligne', tone: 'slate' },
};

export default async function FleetPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CARRIER') redirect('/app');
  const vehicles = vehiclesOf(user.id);
  const drivers = driversOf(user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Ma flotte</h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Véhicules" value={vehicles.length} icon={<Truck size={16} />} tone="blue" />
        <Stat label="Disponibles" value={vehicles.filter((v) => v.available).length} tone="green" />
        <Stat label="Chauffeurs" value={drivers.length} icon={<User size={16} />} tone="amber" />
      </div>

      <section>
        <SectionTitle title="Véhicules" action={<button className="btn-outline text-sm"><Plus size={15} /> Ajouter</button>} />
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicles.map((v) => {
            const t = VEHICLE_TYPES.find((x) => x.key === v.type);
            return (
              <div key={v.id} className="card flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t?.emoji}</span>
                  <div>
                    <p className="font-semibold text-ink">{v.name}</p>
                    <p className="text-xs text-ink-muted">{t?.label} · {v.plate} · {(v.capacityKg / 1000).toLocaleString('fr-FR')} t</p>
                  </div>
                </div>
                <Badge tone={v.available ? 'green' : 'amber'}>{v.available ? 'Disponible' : 'En mission'}</Badge>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle title="Chauffeurs (sous-comptes)" action={<button className="btn-outline text-sm"><Plus size={15} /> Inviter</button>} />
        <div className="grid gap-3 sm:grid-cols-2">
          {drivers.map((d) => {
            const st = DRIVER_STATUS[d.status];
            return (
              <div key={d.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-ink">{d.name}</p>
                  <p className="text-xs text-ink-muted">Permis {d.licenseNumber} · {d.phone}</p>
                  {d.userId && <span className="chip mt-1 bg-brand-50 text-brand-700">Compte chauffeur actif</span>}
                </div>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
