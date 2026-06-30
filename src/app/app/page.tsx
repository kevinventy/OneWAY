import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Redirige vers l'espace correspondant au rôle. */
export default async function AppHome() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  redirect(user.role === 'GERANT' ? '/app/gerant' : '/app/chauffeur');
}
