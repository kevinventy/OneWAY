import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, Truck, Package, Radio, Wallet, ShieldAlert, TrendingUp } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { adminStats } from '@/lib/queries';
import { db } from '@/lib/db';
import { Stat, SectionTitle, Badge } from '@/components/ui';
import { RevenueChart, VehicleChart } from '@/components/app/AdminCharts';
import { VEHICLE_TYPES } from '@/data/catalog';
import { money, moneyCompact } from '@/lib/format';
import { SHIPMENT_STATUS } from '@/lib/labels';
import { freightById } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') redirect('/app');
  const s = adminStats();
  const byVehicle = s.byVehicle.map((x) => ({ name: VEHICLE_TYPES.find((v) => v.key === x.name)?.label ?? x.name, value: x.value }));
  const recent = db().shipments.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Back-office ONE WAY</h1>
        <p className="text-ink-muted">Vue d’ensemble de la marketplace</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="GMV total" value={moneyCompact(s.gmv)} hint="Volume transactions" icon={<TrendingUp size={16} />} tone="blue" />
        <Stat label="Revenus (commission)" value={moneyCompact(s.revenue)} hint={`Take rate ~12 %`} icon={<Wallet size={16} />} tone="green" />
        <Stat label="Expéditions actives" value={s.activeShipments} icon={<Radio size={16} />} tone="amber" />
        <Stat label="KYC en attente" value={s.pendingKyc} icon={<ShieldAlert size={16} />} tone="red" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Utilisateurs" value={s.users} icon={<Users size={16} />} />
        <Stat label="Chargeurs" value={s.shippers} icon={<Package size={16} />} />
        <Stat label="Transporteurs" value={s.carriers} icon={<Truck size={16} />} />
        <Stat label="Livraisons" value={s.delivered} tone="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart data={s.monthly} />
        <VehicleChart data={byVehicle} />
      </div>

      <section>
        <SectionTitle title="Expéditions récentes" action={<Link href="/app/admin/users" className="text-sm font-semibold text-brand-600">Utilisateurs</Link>} />
        <div className="card divide-y divide-slate-100">
          {recent.map((sh) => {
            const f = freightById(sh.freightId);
            return (
              <div key={sh.id} className="flex items-center justify-between p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{sh.reference} · {f?.title}</p>
                  <p className="text-xs text-ink-muted">{f?.pickup.city} → {f?.delivery.city}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden font-semibold text-ink sm:block">{money(sh.price)}</span>
                  <Badge tone={SHIPMENT_STATUS[sh.status].tone}>{SHIPMENT_STATUS[sh.status].label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
