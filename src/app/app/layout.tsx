import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { unreadNotifications } from '@/lib/queries';
import { AppShell } from '@/components/app/AppShell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const unread = unreadNotifications(user.id);
  return (
    <AppShell user={user} unread={unread}>
      {children}
    </AppShell>
  );
}
