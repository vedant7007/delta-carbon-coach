import { NextResponse } from 'next/server';
import { simulateInputSchema, periodSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/server/auth';
import { parseJson, runGuarded } from '@/lib/server/http';
import { getSimulation } from '@/lib/server/services/footprintService';

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
    const period = periodSchema.safeParse(url.searchParams.get('period') ?? 'week');

    const result = await getSimulation(
      user.uid,
      adjustments,
      period.success ? period.data : 'week',
      new Date(),
    );
    return NextResponse.json(result);
  });
}
