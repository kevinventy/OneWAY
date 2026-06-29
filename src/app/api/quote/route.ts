import { NextRequest } from 'next/server';
import { handle, ok } from '@/lib/api';
import { quoteSchema } from '@/lib/validation';
import { computeQuote } from '@/lib/pricing';
import { estimateRoute } from '@/lib/geo';

export const dynamic = 'force-dynamic';

/** Public price calculator endpoint (no auth) — powers /calculateur. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const input = quoteSchema.parse(await req.json());
    const result = computeQuote(input);
    return ok(result);
  });
}

/** Optional helper: estimate a route distance/duration by city names. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    return ok(estimateRoute(from, to));
  });
}
