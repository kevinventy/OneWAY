import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Sparkles, FileText, Radio, Star, BadgeCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { freightById, bidsForFreight, userById, documentsFor, shipmentByFreight } from '@/lib/queries';
import { matchCarriers } from '@/lib/services';
import { RouteMap } from '@/components/map/RouteMap';
import { BidsList, type BidRow } from '@/components/app/BidsList';
import { Badge, SectionTitle } from '@/components/ui';
import { RouteLine } from '@/components/app/cards';
import { FREIGHT_STATUS } from '@/lib/labels';
import { money, km, dateFr } from '@/lib/format';
import { vehicleByKey, cargoByKey } from '@/data/catalog';

export const dynamic = 'force-dynamic';

export default async function FreightDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const freight = freightById(params.id);
  if (!freight) notFound();
  if (user.role === 'SHIPPER' && freight.shipperId !== user.id) redirect('/app/shipper');

  const v = vehicleByKey(freight.vehicleType);
  const c = cargoByKey(freight.cargoType);
  const bidsRaw = bidsForFreight(freight.id);
  const bids: BidRow[] = bidsRaw.map((b) => {
    const carrier = userById(b.carrierId)!;
    return {
      id: b.id, amount: b.amount, etaHours: b.etaHours, message: b.message, status: b.status,
      carrier: {
        name: carrier.name, companyName: carrier.companyName, rating: carrier.rating,
        ratingCount: carrier.ratingCount, premium: carrier.premium, city: carrier.city, avatarColor: carrier.avatarColor,
      },
    };
  });
  const suggestions = freight.status === 'PUBLISHED' ? matchCarriers(freight) : [];
  const docs = documentsFor({ freightId: freight.id });
  const shipment = shipmentByFreight(freight.id);

  return (
    <div className="space-y-5">
      <Link href="/app/shipper" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Mes annonces
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-brand-600">{freight.reference}</span>
            <Badge tone={FREIGHT_STATUS[freight.status].tone}>{FREIGHT_STATUS[freight.status].label}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-ink">{freight.title}</h1>
        </div>
        {shipment && (
          <Link href={`/app/shipper/tracking/${shipment.id}`} className="btn-primary">
            <Radio size={16} /> Suivre l’expédition
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <RouteMap
            from={{ ...freight.pickup, label: freight.pickup.city }}
            to={{ ...freight.delivery, label: freight.delivery.city }}
            current={shipment ? { lat: shipment.currentLat!, lng: shipment.currentLng! } : null}
            progress={shipment?.progress ?? 0}
            className="aspect-[16/10] w-full"
          />

          <div className="card p-5">
            <RouteLine from={`${freight.pickup.city} — ${freight.pickup.address}`} to={`${freight.delivery.city} — ${freight.delivery.address}`} />
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Info label="Distance" value={km(freight.distanceKm)} />
              <Info label="Durée estimée" value={freight.durationH ? `${freight.durationH} h` : '—'} />
              <Info label="Poids" value={`${(freight.weightKg / 1000).toLocaleString('fr-FR')} t`} />
              <Info label="Véhicule" value={`${v.emoji} ${v.label}`} />
              <Info label="Marchandise" value={`${c.emoji} ${c.label}`} />
              <Info label="Chargement" value={dateFr(freight.pickupDate)} />
              <Info label="Valeur déclarée" value={freight.declaredValue ? money(freight.declaredValue) : '—'} />
              <Info label="Assurance" value={freight.insurance ? 'Oui (0,5 %)' : 'Non'} />
              <Info label="Mode" value={freight.pricingMode === 'AUCTION' ? 'Enchères' : 'Prix fixe'} />
            </dl>
          </div>

          {/* Matching suggestions */}
          {suggestions.length > 0 && (
            <div>
              <SectionTitle title="Matching intelligent" />
              <p className="mb-3 -mt-2 text-sm text-ink-muted">Transporteurs recommandés selon proximité, capacité, prix et réputation.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <div key={s.carrierId} className="card flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate text-sm font-semibold text-ink">
                        {s.companyName} {s.premium && <BadgeCheck size={14} className="text-brand-600" />}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-ink-muted">
                        <span className="flex items-center gap-0.5 text-amber-500"><Star size={11} className="fill-amber-400 stroke-amber-400" /><span className="font-semibold text-ink">{s.rating.toFixed(1)}</span></span>
                        · {s.city ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink">{money(s.estimatedPrice)}</p>
                      <span className="chip bg-brand-50 text-brand-700"><Sparkles size={11} /> {Math.round(s.score * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: bids + price + docs */}
        <aside className="space-y-5">
          <div className="card overflow-hidden">
            <div className="bg-brand-950 p-4 text-white">
              <p className="text-xs text-brand-200">{freight.pricingMode === 'AUCTION' ? 'Enchère · départ' : 'Prix proposé'}</p>
              <p className="text-2xl font-extrabold">{money(freight.budget)}</p>
            </div>
          </div>

          <div>
            <SectionTitle title={`Offres reçues (${bids.length})`} />
            <BidsList bids={bids} canAccept={user.role === 'SHIPPER' && freight.status === 'PUBLISHED'} />
          </div>

          {docs.length > 0 && (
            <div>
              <SectionTitle title="Documents" />
              <div className="space-y-2">
                {docs.map((d) => (
                  <Link key={d.id} href={`/app/documents/${d.id}`} className="card flex items-center gap-3 p-3 text-sm hover:shadow-pop">
                    <FileText size={18} className="text-brand-600" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{d.title}</p>
                      <p className="text-xs text-ink-muted">{d.reference}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
