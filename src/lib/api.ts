import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from './auth';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Wrap a route handler so domain/auth/validation errors become clean JSON. */
export function handle(fn: () => Promise<Response> | Response) {
  return Promise.resolve()
    .then(fn)
    .catch((err) => {
      if (err instanceof AuthError) return fail(err.status, err.message);
      if (err instanceof ZodError) {
        return fail(422, 'Données invalides', { issues: err.flatten().fieldErrors });
      }
      console.error('[api]', err);
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      return fail(500, message);
    });
}
