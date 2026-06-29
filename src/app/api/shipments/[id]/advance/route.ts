import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { advanceSchema } from '@/lib/validation';
import { advanceShipment } from '@/lib/services';

export const dynamic = 'force-dynamic';

/** Driver/carrier pushes a tracking update (advances the shipment status). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const shipment = db().shipments.find((s) => s.id === params.id);
    if (!shipment) return fail(404, 'Expédition introuvable');

    // Only the assigned carrier, its driver, or an admin may update.
    const driver = db().drivers.find((d) => d.id === shipment.driverId);
    const allowed =
      user.role === 'ADMIN' ||
      user.id === shipment.carrierId ||
      (driver && driver.userId === user.id) ||
      user.carrierId === shipment.carrierId;
    if (!allowed) return fail(403, 'Action non autorisée');

    const body = advanceSchema.parse(await req.json().catch(() => ({})));
    const result = advanceShipment({ shipmentId: params.id, by: user.id, ...body });
    return ok(result);
  });
}
