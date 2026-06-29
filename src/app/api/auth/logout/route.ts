import { handle, ok } from '@/lib/api';
import { sessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  return handle(async () => {
    const res = ok({ loggedOut: true });
    res.cookies.set(sessionCookie.name, '', { ...sessionCookie.options, maxAge: 0 });
    return res;
  });
}
