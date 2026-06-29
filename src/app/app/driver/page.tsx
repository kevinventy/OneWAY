import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Map, Navigation } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { driverShipments, freightById } from '@/lib/queries';
import { ShipmentCard } from '@/components/app/cards';
import { EmptyState, SectionTitle, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function DriverDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'DRIVER') redirect('/app');
  const shipments = driverShipments(user.id);
  const active = shipments.filter((s) => !['DELIVERED', 'CANCELLED'].includes(s.status));
  const done = shipments.filter((s) => s.status === 'DELIVERED');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Bonjour, {user.name.split(' ')[0]} 🧑‍✈️</h1>
        <p className="text-ink-muted">Vos missions de transport</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Missions en cours" value={active.length} icon={<Navigation size={16} />} tone="amber" />
        <Stat label="Livraisons effectuées" value={done.length} icon={<Map size={16} />} tone="green" />
      </div>

      <section>
        <SectionTitle title="Missions en cours" />
        {active.length === 0 ? (
          <EmptyState icon={<Map size={32} />} title="Aucune mission active" description="Votre transporteur vous affectera des missions ici." />
        ) : (
          <div className="space-y-3">
            {active.map((s) => (
              <ShipmentCard key={s.id} shipment={s} freight={freightById(s.freightId)!} href={`/app/driver/mission/${s.id}`} subtitle="Appuyez pour piloter la mission" />
            ))}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <SectionTitle title="Historique" />
          <div className="space-y-3">
            {done.map((s) => (
              <ShipmentCard key={s.id} shipment={s} freight={freightById(s.freightId)!} href={`/app/driver/mission/${s.id}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
