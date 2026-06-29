import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { carrierShipments, carrierBids, freightById } from '@/lib/queries';
import { ShipmentCard } from '@/components/app/cards';
import { Badge, EmptyState, SectionTitle } from '@/components/ui';
import { BID_STATUS } from '@/lib/labels';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CarrierMissions() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CARRIER') redirect('/app');
  const shipments = carrierShipments(user.id);
  const bids = carrierBids(user.id).filter((b) => b.status === 'PENDING');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Mes missions</h1>

      <section>
        <SectionTitle title={`Missions (${shipments.length})`} />
        {shipments.length === 0 ? (
          <EmptyState icon={<ClipboardList size={32} />} title="Aucune mission" description="Proposez vos prix sur le fret disponible pour décrocher des missions." action={<Link href="/app/carrier" className="btn-primary">Voir le fret disponible</Link>} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {shipments.map((s) => (
              <ShipmentCard key={s.id} shipment={s} freight={freightById(s.freightId)!} href={`/app/carrier/mission/${s.id}`} />
            ))}
          </div>
        )}
      </section>

      {bids.length > 0 && (
        <section>
          <SectionTitle title={`Offres en attente (${bids.length})`} />
          <div className="space-y-2">
            {bids.map((b) => {
              const f = freightById(b.freightId);
              if (!f) return null;
              return (
                <Link key={b.id} href={`/app/carrier/freight/${f.id}`} className="card flex items-center justify-between p-3 hover:shadow-pop">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{f.title}</p>
                    <p className="text-xs text-ink-muted">{f.pickup.city} → {f.delivery.city} · {f.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">{money(b.amount)}</p>
                    <Badge tone={BID_STATUS[b.status].tone}>{BID_STATUS[b.status].label}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
