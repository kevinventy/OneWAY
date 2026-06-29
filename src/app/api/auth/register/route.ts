import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { hashPassword, signSession, sessionCookie } from '@/lib/auth';
import { write, db } from '@/lib/db';
import { registerSchema } from '@/lib/validation';
import { nanoId } from '@/lib/utils';
import { toPublicUser, type User } from '@/lib/types';

const COLORS = ['#1d3df5', '#ff9500', '#16a34a', '#9333ea', '#e11d48', '#0891b2'];

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = registerSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    if (db().users.some((u) => u.email.toLowerCase() === email)) {
      return fail(409, 'Un compte existe déjà avec cet email');
    }
    const user: User = await (async () => {
      const passwordHash = await hashPassword(body.password);
      return write((d) => {
        const u: User = {
          id: nanoId('u'),
          role: body.role,
          name: body.name,
          email,
          phone: body.phone,
          passwordHash,
          companyName: body.companyName,
          city: body.city,
          kycStatus: 'NONE',
          rating: 0,
          ratingCount: 0,
          premium: false,
          avatarColor: COLORS[d.users.length % COLORS.length],
          createdAt: new Date().toISOString(),
        };
        d.users.push(u);
        return u;
      });
    })();

    const token = await signSession(user.id);
    const res = ok(toPublicUser(user), { status: 201 });
    res.cookies.set(sessionCookie.name, token, sessionCookie.options);
    return res;
  });
}
