import { handle, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { db, write } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const list = db()
      .notifications.filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return ok(list);
  });
}

/** Mark all notifications as read. */
export async function PATCH() {
  return handle(async () => {
    const user = await requireUser();
    write((d) => {
      d.notifications.filter((n) => n.userId === user.id).forEach((n) => (n.read = true));
    });
    return ok({ updated: true });
  });
}
