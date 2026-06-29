import 'server-only';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';
import { toPublicUser, type PublicUser, type Role, type User } from './types';

const SESSION_COOKIE = 'oneway_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET || 'dev-secret-change-me-in-production-please-32chars-min';
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function readSession(token?: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return (payload.uid as string) ?? null;
  } catch {
    return null;
  }
}

/** Cookie options used both when setting and clearing the session. */
export const sessionCookie = {
  name: SESSION_COOKIE,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  },
};

/** Resolve the current authenticated user (server components & route handlers). */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const uid = await readSession(token);
  if (!uid) return null;
  const user = db().users.find((u) => u.id === uid);
  return user ? toPublicUser(user) : null;
}

/** Same as getCurrentUser but returns the full record (server-only internals). */
export async function getCurrentUserRecord(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const uid = await readSession(token);
  if (!uid) return null;
  return db().users.find((u) => u.id === uid) ?? null;
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Throw 401 if not authenticated. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, 'Authentification requise');
  return user;
}

/** Throw 401/403 if not authenticated or wrong role. */
export async function requireRole(...roles: Role[]): Promise<PublicUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError(403, 'Accès non autorisé');
  return user;
}

export { SESSION_COOKIE };
