import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Espace chauffeur réservé aux comptes DRIVER (le gérant est redirigé). */
export default async function ChauffeurLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion?next=/chauffeur');
  if (user.role === 'ADMIN' || user.role === 'CARRIER') redirect('/gerer');
  if (user.role !== 'DRIVER') redirect('/');
  return <>{children}</>;
}
