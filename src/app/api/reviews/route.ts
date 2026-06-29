import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { db, write } from '@/lib/db';
import { reviewSchema } from '@/lib/validation';
import { nanoId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** Leave a rating after a delivered shipment. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = reviewSchema.parse(await req.json());
    const shipment = db().shipments.find((s) => s.id === body.shipmentId);
    if (!shipment) return fail(404, 'Expédition introuvable');
    if (shipment.status !== 'DELIVERED') return fail(400, 'La livraison n’est pas encore confirmée');

    const isShipper = user.id === shipment.shipperId;
    const isCarrier = user.id === shipment.carrierId;
    if (!isShipper && !isCarrier) return fail(403, 'Action non autorisée');
    const toUserId = isShipper ? shipment.carrierId : shipment.shipperId;

    const review = write((d) => {
      const r = {
        id: nanoId('rv'),
        shipmentId: body.shipmentId,
        fromUserId: user.id,
        toUserId,
        rating: body.rating,
        comment: body.comment,
        createdAt: new Date().toISOString(),
      };
      d.reviews.push(r);
      // Recompute the target's rolling average.
      const target = d.users.find((u) => u.id === toUserId);
      if (target) {
        const all = d.reviews.filter((rv) => rv.toUserId === toUserId);
        target.ratingCount = all.length;
        target.rating = +(all.reduce((s, rv) => s + rv.rating, 0) / all.length).toFixed(2);
      }
      return r;
    });

    return ok(review, { status: 201 });
  });
}
