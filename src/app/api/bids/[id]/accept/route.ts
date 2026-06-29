import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { acceptBid } from '@/lib/services';

export const dynamic = 'force-dynamic';

/** Shipper accepts a bid → books the mission. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireRole('SHIPPER');
    const bid = db().bids.find((b) => b.id === params.id);
    if (!bid) return fail(404, 'Offre introuvable');
    const freight = db().freights.find((f) => f.id === bid.freightId);
    if (!freight || freight.shipperId !== user.id) return fail(403, 'Action non autorisée');

    const shipment = acceptBid(bid.freightId, bid.id);
    return ok(shipment, { status: 201 });
  });
}
