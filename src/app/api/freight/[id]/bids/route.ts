import { NextRequest } from 'next/server';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { bidSchema } from '@/lib/validation';
import { placeBid } from '@/lib/services';

export const dynamic = 'force-dynamic';

/** List bids for a freight. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const bids = db()
      .bids.filter((b) => b.freightId === params.id)
      .sort((a, b) => a.amount - b.amount);
    return ok(bids);
  });
}

/** Carrier places a bid on a freight. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireRole('CARRIER');
    const body = bidSchema.parse(await req.json());
    const bid = placeBid({
      freightId: params.id,
      carrierId: user.id,
      amount: body.amount,
      etaHours: body.etaHours,
      message: body.message,
      vehicleId: body.vehicleId,
    });
    return ok(bid, { status: 201 });
  });
}
