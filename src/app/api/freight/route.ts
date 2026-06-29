import { NextRequest } from 'next/server';
import { handle, ok } from '@/lib/api';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { db, write } from '@/lib/db';
import { freightSchema } from '@/lib/validation';
import { estimateRoute } from '@/lib/geo';
import { quickEstimate } from '@/lib/pricing';
import { nanoId, sequenceRef } from '@/lib/utils';
import type { Freight } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** List freights. Carriers see the open marketplace; shippers see their own. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const cargo = searchParams.get('cargo');
    const vehicle = searchParams.get('vehicle');
    const q = searchParams.get('q')?.toLowerCase();

    let list = db().freights.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (user?.role === 'SHIPPER') list = list.filter((f) => f.shipperId === user.id);
    else list = list.filter((f) => f.status === 'PUBLISHED'); // public marketplace feed

    if (status) list = list.filter((f) => f.status === status);
    if (cargo) list = list.filter((f) => f.cargoType === cargo);
    if (vehicle) list = list.filter((f) => f.vehicleType === vehicle);
    if (q)
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.pickup.city.toLowerCase().includes(q) ||
          f.delivery.city.toLowerCase().includes(q),
      );

    return ok(list);
  });
}

/** Create a freight listing (shipper only). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireRole('SHIPPER');
    const body = freightSchema.parse(await req.json());
    const route = estimateRoute(body.pickup.city, body.delivery.city);
    const budget = body.budget || quickEstimate(route.distanceKm, body.vehicleType, body.cargoType);

    const freight = write((d) => {
      const seq = ++d.meta.freightSeq;
      const f: Freight = {
        id: nanoId('f'),
        reference: sequenceRef('OW', seq),
        shipperId: user.id,
        title: body.title,
        cargoType: body.cargoType,
        weightKg: body.weightKg,
        volumeM3: body.volumeM3,
        dimensions: body.dimensions,
        photos: body.photos ?? [],
        pickup: body.pickup,
        delivery: body.delivery,
        pickupDate: body.pickupDate,
        deliveryDate: body.deliveryDate,
        urgency: body.urgency,
        pricingMode: body.pricingMode,
        vehicleType: body.vehicleType,
        declaredValue: body.declaredValue,
        insurance: body.insurance,
        distanceKm: route.distanceKm,
        durationH: route.durationH,
        budget,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
      };
      d.freights.push(f);
      // Generate the quote document
      d.documents.push({
        id: nanoId('doc'), freightId: f.id, type: 'QUOTE', reference: `DEV-${f.reference}`,
        title: `Devis de transport — ${f.reference}`, createdAt: new Date().toISOString(),
      });
      return f;
    });

    return ok(freight, { status: 201 });
  });
}
