import { redirect } from 'next/navigation';
import { Boxes, MapPin } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { openMarketplace, vehiclesOf, carrierBids } from '@/lib/queries';
import { FilterBar } from '@/components/app/FilterBar';
import { FreightCard } from '@/components/app/cards';
import { Stat, EmptyState } from '@/components/ui';
import { quickEstimate } from '@/lib/pricing';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CarrierFeed({
  searchParams,
}: {
  searchParams: { q?: string; cargo?: string; vehicle?: string };
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CARRIER') redirect('/app');

  const freights = openMarketplace({ q: searchParams.q, cargo: searchParams.cargo, vehicle: searchParams.vehicle });
  const fleet = vehiclesOf(user.id);
  const myBids = carrierBids(user.id);
  const potentialGmv = freights.reduce((s, f) => s + f.budget, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Fret disponible</h1>
        <p className="text-ink-muted">Trouvez des chargements près de vous et proposez votre prix.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Annonces ouvertes" value={freights.length} icon={<Boxes size={16} />} tone="blue" />
        <Stat label="Mes offres" value={myBids.filter((b) => b.status === 'PENDING').length} icon={<MapPin size={16} />} tone="amber" />
        <Stat label="Volume dispo." value={money(potentialGmv)} tone="green" />
      </div>

      <FilterBar />

      {freights.length === 0 ? (
        <EmptyState icon={<Boxes size={32} />} title="Aucun fret ne correspond" description="Élargissez vos filtres ou revenez plus tard — de nouvelles annonces arrivent en continu." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {freights.map((f) => {
            const mine = myBids.find((b) => b.freightId === f.id && b.status === 'PENDING');
            return (
              <FreightCard
                key={f.id}
                freight={f}
                href={`/app/carrier/freight/${f.id}`}
                footer={
                  mine ? (
                    <span className="chip bg-emerald-100 text-emerald-700">Offre : {money(mine.amount)}</span>
                  ) : (
                    <span className="chip bg-brand-50 text-brand-700">Estimation {money(quickEstimate(f.distanceKm, f.vehicleType, f.cargoType))}</span>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
