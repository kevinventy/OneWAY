import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { db, write } from '@/lib/db';
import { nanoId } from '@/lib/utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const thread = new URL(req.url).searchParams.get('thread');
    if (!thread) return fail(400, 'Paramètre thread requis');
    const list = db()
      .messages.filter((m) => m.threadId === thread && (m.fromUserId === user.id || m.toUserId === user.id))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return ok(list);
  });
}

const schema = z.object({ threadId: z.string(), body: z.string().min(1), toUserId: z.string().optional() });

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const { threadId, body, toUserId } = schema.parse(await req.json());

    // Infer the recipient from the shipment/freight participants.
    let recipient = toUserId;
    if (!recipient) {
      const shipment = db().shipments.find((s) => s.id === threadId);
      if (shipment) recipient = user.id === shipment.shipperId ? shipment.carrierId : shipment.shipperId;
      else {
        const freight = db().freights.find((f) => f.id === threadId);
        if (freight) recipient = freight.shipperId === user.id ? '' : freight.shipperId;
      }
    }
    if (!recipient) return fail(400, 'Destinataire introuvable');

    const message = write((d) => {
      const m = {
        id: nanoId('m'), threadId, fromUserId: user.id, toUserId: recipient!, body, read: false,
        createdAt: new Date().toISOString(),
      };
      d.messages.push(m);
      d.notifications.unshift({
        id: nanoId('n'), userId: recipient!, type: 'MESSAGE', read: false, title: 'Nouveau message',
        body: body.slice(0, 60), href: `/app/messages/${threadId}`, createdAt: new Date().toISOString(),
      });
      return m;
    });
    return ok(message, { status: 201 });
  });
}
