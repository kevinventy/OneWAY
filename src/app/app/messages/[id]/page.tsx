import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { shipmentById, freightById, userById } from '@/lib/queries';
import { LiveRefresh } from '@/components/app/LiveRefresh';
import { MessageComposer } from '@/components/app/MessageComposer';
import { Avatar } from '@/components/ui';
import { dateTimeFr } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function MessagesThread({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const threadId = params.id;

  const shipment = shipmentById(threadId);
  const freight = shipment ? freightById(shipment.freightId) : freightById(threadId);
  const otherId = shipment
    ? user.id === shipment.shipperId ? shipment.carrierId : shipment.shipperId
    : freight?.shipperId !== user.id ? freight?.shipperId : undefined;
  const other = otherId ? userById(otherId) : undefined;

  const messages = db()
    .messages.filter((m) => m.threadId === threadId && (m.fromUserId === user.id || m.toUserId === user.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <LiveRefresh intervalMs={6000} />
      <Link href="/app" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Retour
      </Link>

      <div className="card flex items-center gap-3 p-3">
        <Avatar name={other?.companyName ?? other?.name ?? '?'} color={other?.avatarColor ?? '#64748b'} size={40} />
        <div>
          <p className="font-semibold text-ink">{other?.companyName ?? other?.name ?? 'Conversation'}</p>
          <p className="text-xs text-ink-muted">{freight?.title}</p>
        </div>
      </div>

      <div className="my-3 flex-1 space-y-2">
        {messages.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">Démarrez la conversation 👋</p>}
        {messages.map((m) => {
          const mine = m.fromUserId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-white text-ink shadow-card'}`}>
                <p>{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? 'text-brand-100' : 'text-ink-muted'}`}>{dateTimeFr(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-20 lg:bottom-0">
        <MessageComposer threadId={threadId} />
      </div>
    </div>
  );
}
