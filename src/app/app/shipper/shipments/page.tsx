import { redirect } from 'next/navigation';
import { Radio } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { shipperShipments, freightById } from '@/lib/queries';
import { ShipmentCard } from '@/components/app/cards';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ShipperShipments() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SHIPPER') redirect('/app');
  const shipments = shipperShipments(user.id);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">Mes expéditions</h1>
      {shipments.length === 0 ? (
        <EmptyState icon={<Radio size={32} />} title="Aucune expédition en cours" description="Vos expéditions apparaîtront ici dès qu’une offre sera acceptée." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shipments.map((s) => (
            <ShipmentCard key={s.id} shipment={s} freight={freightById(s.freightId)!} href={`/app/shipper/tracking/${s.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
