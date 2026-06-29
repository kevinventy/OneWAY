import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { write } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ status: z.enum(['VERIFIED', 'REJECTED', 'PENDING']) });

/** Admin validates or rejects a KYC document; syncs the user status. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireRole('ADMIN');
    const { status } = schema.parse(await req.json());

    const result = write((d) => {
      const doc = d.kyc.find((k) => k.id === params.id);
      if (!doc) return null;
      doc.status = status;
      // A user is VERIFIED when they have at least one verified doc and none rejected.
      const user = d.users.find((u) => u.id === doc.userId);
      if (user) {
        const docs = d.kyc.filter((k) => k.userId === user.id);
        if (docs.some((k) => k.status === 'REJECTED')) user.kycStatus = 'REJECTED';
        else if (docs.some((k) => k.status === 'VERIFIED')) user.kycStatus = 'VERIFIED';
        else user.kycStatus = 'PENDING';
      }
      return doc;
    });

    if (!result) return fail(404, 'Document KYC introuvable');
    return ok(result);
  });
}
