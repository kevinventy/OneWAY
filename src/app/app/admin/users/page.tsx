import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Avatar, Badge } from '@/components/ui';
import { ROLE_LABEL, KYC_LABEL } from '@/lib/labels';
import { dateFr } from '@/lib/format';

export const dynamic = 'force-dynamic';

const ROLE_TONE: Record<string, 'blue' | 'amber' | 'green' | 'slate'> = {
  SHIPPER: 'green',
  CARRIER: 'blue',
  DRIVER: 'amber',
  ADMIN: 'slate',
};

export default async function AdminUsers() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') redirect('/app');
  const users = db().users.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">Utilisateurs ({users.length})</h1>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-ink-muted">
              <th className="p-3">Utilisateur</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Ville</th>
              <th className="p-3">KYC</th>
              <th className="p-3">Note</th>
              <th className="p-3">Inscrit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.companyName ?? u.name} color={u.avatarColor} size={32} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{u.companyName ?? u.name}</p>
                      <p className="truncate text-xs text-ink-muted">{u.email}</p>
                    </div>
                    {u.premium && <span className="chip bg-amber-100 text-amber-600">Premium</span>}
                  </div>
                </td>
                <td className="p-3"><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                <td className="p-3 text-ink-soft">{u.city ?? '—'}</td>
                <td className="p-3"><Badge tone={KYC_LABEL[u.kycStatus].tone}>{KYC_LABEL[u.kycStatus].label}</Badge></td>
                <td className="p-3 text-ink-soft">{u.ratingCount > 0 ? `⭐ ${u.rating.toFixed(1)} (${u.ratingCount})` : '—'}</td>
                <td className="p-3 text-xs text-ink-muted">{dateFr(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
