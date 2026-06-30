import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Aiguillage après connexion : redirige selon le rôle. */
export default async function EspaceDispatch() {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion');
  if (user.role === 'DRIVER') redirect('/chauffeur');
  if (user.role === 'ADMIN' || user.role === 'CARRIER') redirect('/gerer');
  redirect('/'); // SHIPPER ou autre
}
