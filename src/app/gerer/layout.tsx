import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Espace gérant réservé aux comptes ADMIN / transporteur (CARRIER). */
export default async function GererLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion?next=/gerer');
  if (user.role === 'DRIVER') redirect('/chauffeur');
  if (user.role !== 'ADMIN' && user.role !== 'CARRIER') redirect('/');
  return <>{children}</>;
}
