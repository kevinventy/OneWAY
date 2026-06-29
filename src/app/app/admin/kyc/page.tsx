import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { userById } from '@/lib/queries';
import { Avatar, Badge, EmptyState } from '@/components/ui';
import { KycReview } from '@/components/app/KycReview';
import { KYC_LABEL } from '@/lib/labels';
import { dateFr } from '@/lib/format';

export const dynamic = 'force-dynamic';

const DOC_TYPE: Record<string, string> = {
  ID: 'Pièce d’identité',
  LICENSE: 'Permis de conduire',
  VEHICLE_REG: 'Carte grise véhicule',
  INSURANCE: 'Assurance',
  COMPANY_REG: 'Immatriculation société (NIF)',
};

export default async function AdminKyc() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') redirect('/app');
  const docs = db().kyc.slice().sort((a, b) => (a.status === 'PENDING' ? -1 : 1));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Vérification KYC</h1>
        <p className="text-ink-muted">Validez les documents des transporteurs et chargeurs.</p>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={32} />} title="Aucun document à vérifier" />
      ) : (
        <div className="card divide-y divide-slate-100">
          {docs.map((d) => {
            const owner = userById(d.userId);
            return (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={owner?.companyName ?? owner?.name ?? '?'} color={owner?.avatarColor ?? '#64748b'} size={40} />
                  <div>
                    <p className="font-semibold text-ink">{owner?.companyName ?? owner?.name}</p>
                    <p className="text-xs text-ink-muted">{DOC_TYPE[d.type] ?? d.type} · {d.reference} · {dateFr(d.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={KYC_LABEL[d.status].tone}>{KYC_LABEL[d.status].label}</Badge>
                  <KycReview id={d.id} status={d.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
