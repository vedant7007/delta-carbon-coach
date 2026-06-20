import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { runGuarded, ApiError } from '@/lib/server/http';
import { periodSchema } from '@/lib/schemas';
import { getSummary } from '@/lib/server/services/footprintService';

export const dynamic = 'force-dynamic';

/** GET /api/footprint/summary?period= — totals, breakdown, trend, regional avg. */
export async function GET(request: Request): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const parsed = periodSchema.safeParse(url.searchParams.get('period') ?? 'week');
    if (!parsed.success) {
      throw new ApiError('bad_request', 'Invalid period');
    }
    const region = url.searchParams.get('region') === 'GLOBAL' ? 'GLOBAL' : 'IN';

    const summary = await getSummary(user.uid, parsed.data, new Date(), region);

    const response = NextResponse.json(summary);
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return response;
  });
}
