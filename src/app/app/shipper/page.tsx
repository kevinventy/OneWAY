import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PlusCircle, Package, Radio, CheckCircle2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { shipperFreights, shipperShipments, bidsForFreight, freightById } from '@/lib/queries';
import { db } from '@/lib/db';
import { Stat, EmptyState, SectionTitle } from '@/components/ui';
import { FreightCard, ShipmentCard } from '@/components/app/cards';

export const dynamic = 'force-dynamic';

export default async function ShipperDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SHIPPER') redirect('/app');

  const freights = shipperFreights(user.id);
  const shipments = shipperShipments(user.id);
  const active = shipments.filter((s) => !['DELIVERED', 'CANCELLED'].includes(s.status));
  const open = freights.filter((f) => f.status === 'PUBLISHED');
  const delivered = shipments.filter((s) => s.status === 'DELIVERED');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bonjour, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-ink-muted">{user.companyName ?? 'Tableau de bord chargeur'}</p>
        </div>
        <Link href="/app/shipper/new" className="btn-primary">
          <PlusCircle size={18} /> Publier un fret
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Annonces ouvertes" value={open.length} icon={<Package size={16} />} tone="blue" />
        <Stat label="En transit" value={active.length} icon={<Radio size={16} />} tone="amber" />
        <Stat label="Livrées" value={delivered.length} icon={<CheckCircle2 size={16} />} tone="green" />
      </div>

      {active.length > 0 && (
        <section>
          <SectionTitle title="Expéditions en cours" action={<Link href="/app/shipper/shipments" className="text-sm font-semibold text-brand-600">Tout voir</Link>} />
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((s) => {
              const f = freightById(s.freightId)!;
              return <ShipmentCard key={s.id} shipment={s} freight={f} href={`/app/shipper/tracking/${s.id}`} />;
            })}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="Mes annonces de fret" />
        {freights.length === 0 ? (
          <EmptyState
            icon={<Package size={32} />}
            title="Aucune annonce pour le moment"
            description="Publiez votre premier fret pour recevoir des offres de transporteurs vérifiés."
            action={<Link href="/app/shipper/new" className="btn-primary"><PlusCircle size={16} /> Publier un fret</Link>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {freights.map((f) => {
              const count = db().bids.filter((b) => b.freightId === f.id && b.status === 'PENDING').length;
              return <FreightCard key={f.id} freight={f} href={`/app/shipper/freight/${f.id}`} bidsCount={f.status === 'PUBLISHED' ? count : undefined} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
