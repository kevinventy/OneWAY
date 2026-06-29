import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { verifyPassword, signSession, sessionCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { toPublicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = loginSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const user = db().users.find((u) => u.email.toLowerCase() === email);
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return fail(401, 'Email ou mot de passe incorrect');
    }
    const token = await signSession(user.id);
    const res = ok(toPublicUser(user));
    res.cookies.set(sessionCookie.name, token, sessionCookie.options);
    return res;
  });
}
