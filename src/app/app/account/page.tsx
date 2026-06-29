import { redirect } from 'next/navigation';
import { CheckCircle2, Star, Phone, Mail, MapPin } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { reviewsFor, userById } from '@/lib/queries';
import { db } from '@/lib/db';
import { Avatar, Badge, SectionTitle } from '@/components/ui';
import { LogoutButton } from '@/components/app/LogoutButton';
import { ROLE_LABEL, KYC_LABEL } from '@/lib/labels';
import { SUBSCRIPTION_PLANS } from '@/data/catalog';
import { money, dateFr } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const reviews = reviewsFor(user.id);
  const relevantPlans = SUBSCRIPTION_PLANS.filter(
    (p) => p.key === 'FREE' || (user.role === 'CARRIER' && p.key === 'CARRIER_PRO') || (user.role === 'SHIPPER' && p.key === 'SHIPPER_BUSINESS'),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Mon compte</h1>

      {/* Profile */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.companyName ?? user.name} color={user.avatarColor} size={56} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink">{user.companyName ?? user.name}</h2>
              {user.premium && <Badge tone="amber">Premium</Badge>}
            </div>
            <p className="text-sm text-ink-muted">{ROLE_LABEL[user.role]} · {user.name}</p>
            {user.ratingCount > 0 && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-amber-500">
                <Star size={14} className="fill-amber-400 stroke-amber-400" />
                <span className="font-semibold text-ink">{user.rating.toFixed(1)}</span>
                <span className="text-xs text-ink-muted">({user.ratingCount} avis)</span>
              </p>
            )}
          </div>
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2 text-ink-soft"><Mail size={15} className="text-ink-muted" /> {user.email}</p>
          <p className="flex items-center gap-2 text-ink-soft"><Phone size={15} className="text-ink-muted" /> {user.phone}</p>
          {user.city && <p className="flex items-center gap-2 text-ink-soft"><MapPin size={15} className="text-ink-muted" /> {user.city}</p>}
          <p className="flex items-center gap-2 text-ink-soft">Vérification KYC : <Badge tone={KYC_LABEL[user.kycStatus].tone}>{KYC_LABEL[user.kycStatus].label}</Badge></p>
        </dl>
        {user.kycStatus !== 'VERIFIED' && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
            🔐 Complétez votre vérification KYC (pièce d’identité, documents véhicule/permis) pour débloquer toutes les fonctionnalités et inspirer confiance.
          </div>
        )}
      </div>

      {/* Subscription */}
      {user.role !== 'ADMIN' && (
        <section>
          <SectionTitle title="Abonnement" />
          <div className="grid gap-3 sm:grid-cols-2">
            {relevantPlans.map((p) => {
              const current = (p.key === 'FREE' && !user.premium) || (user.premium && p.key !== 'FREE');
              return (
                <div key={p.key} className={`card p-5 ${current ? 'ring-2 ring-brand-500' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-ink">{p.name}</h3>
                    {current && <Badge tone="blue">Actuel</Badge>}
                  </div>
                  <p className="mt-1 text-2xl font-extrabold text-ink">
                    {p.priceMonthly === 0 ? 'Gratuit' : `${money(p.priceMonthly)}`}
                    {p.priceMonthly > 0 && <span className="text-sm font-medium text-ink-muted">/mois</span>}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" /> {f}</li>
                    ))}
                  </ul>
                  {!current && p.priceMonthly > 0 && <button className="btn-primary mt-4 w-full">Passer à {p.name}</button>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section>
          <SectionTitle title={`Avis reçus (${reviews.length})`} />
          <div className="space-y-2">
            {reviews.map((r) => {
              const from = userById(r.fromUserId);
              return (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{from?.companyName ?? from?.name}</p>
                    <span className="flex text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={14} className="fill-amber-400 stroke-amber-400" />
                      ))}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-ink-muted">“{r.comment}”</p>}
                  <p className="mt-1 text-xs text-ink-muted">{dateFr(r.createdAt)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="max-w-xs">
        <LogoutButton />
      </div>
    </div>
  );
}
