import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { notificationsFor } from '@/lib/queries';
import { EmptyState } from '@/components/ui';
import { MarkAllRead } from '@/components/app/MarkAllRead';
import { timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

const TYPE_EMOJI: Record<string, string> = {
  BID: '⚖️', MISSION: '🚛', TRACKING: '📍', FREIGHT: '📦', default: '🔔',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const list = notificationsFor(user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Notifications</h1>
        {list.some((n) => !n.read) && <MarkAllRead />}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Bell size={32} />} title="Aucune notification" />
      ) : (
        <div className="card divide-y divide-slate-100">
          {list.map((n) => {
            const inner = (
              <div className={`flex items-start gap-3 p-4 ${!n.read ? 'bg-brand-50/40' : ''}`}>
                <span className="text-xl">{TYPE_EMOJI[n.type] ?? TYPE_EMOJI.default}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{n.title}</p>
                  <p className="text-sm text-ink-muted">{n.body}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
              </div>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className="block hover:bg-slate-50">{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
