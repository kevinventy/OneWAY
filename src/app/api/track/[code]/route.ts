import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { trackingByCode } from '@/lib/tracking';

export const dynamic = 'force-dynamic';

/** Suivi PUBLIC par code — aucun compte requis, données sanitisées. */
export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  return handle(async () => {
    const data = trackingByCode(params.code);
    if (!data) return fail(404, 'Code de suivi introuvable');
    return ok(data);
  });
}
