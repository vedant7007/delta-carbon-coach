import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { parseJson, runGuarded } from '@/lib/server/http';
import { simulateInputSchema, periodSchema } from '@/lib/schemas';
import { simulate, periodStartIso } from '@/lib/engine';
import { listActivitiesSince } from '@/lib/server/repository/activityRepository';

export const dynamic = 'force-dynamic';

/**
 * POST /api/simulate — authoritative recompute of a what-if scenario against
 * the user's real logged data. The client also runs the same pure engine for
 * instant slider feedback; this endpoint is the trusted source of record.
 */
export async function POST(request: Request): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const { adjustments } = await parseJson(request, simulateInputSchema);

    const url = new URL(request.url);
    const periodParsed = periodSchema.safeParse(url.searchParams.get('period') ?? 'week');
    const period = periodParsed.success ? periodParsed.data : 'week';

    const baseline = await listActivitiesSince(user.uid, periodStartIso(period, new Date()));
    const result = simulate(baseline, adjustments);

    return NextResponse.json(result);
  });
}
