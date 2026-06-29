import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { matchCarriers } from '@/lib/services';

export const dynamic = 'force-dynamic';

/** Smart matching: ranked carrier suggestions for a freight. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireUser();
    const freight = db().freights.find((f) => f.id === params.id);
    if (!freight) return fail(404, 'Annonce introuvable');
    return ok(matchCarriers(freight));
  });
}
