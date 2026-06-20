import { NextResponse } from 'next/server';
import { periodSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/server/auth';
import { runGuarded } from '@/lib/server/http';
import { getInsights } from '@/lib/server/services/footprintService';

export const dynamic = 'force-dynamic';

/** GET /api/insights — top ranked marginal-impact actions from the user's data. */
export async function GET(request: Request): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const period = periodSchema.safeParse(url.searchParams.get('period') ?? 'week');
    const actions = await getInsights(user.uid, period.success ? period.data : 'week', new Date());
    return NextResponse.json({ actions });
  });
}
