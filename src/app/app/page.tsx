import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const HOME: Record<string, string> = {
  SHIPPER: '/app/shipper',
  CARRIER: '/app/carrier',
  DRIVER: '/app/driver',
  ADMIN: '/app/admin',
};

export default async function AppIndex() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  redirect(HOME[user.role] ?? '/login');
}
