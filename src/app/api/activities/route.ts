import { NextResponse } from 'next/server';
import { activityInputSchema, periodSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/server/auth';
import { parseJson, runGuarded, ApiError } from '@/lib/server/http';
import { logActivity, listActivities } from '@/lib/server/services/activityService';

export const dynamic = 'force-dynamic';

/** POST /api/activities — log a manual activity (server recomputes the number). */
export async function POST(request: Request): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const input = await parseJson(request, activityInputSchema);
    const activity = await logActivity(user.uid, input, 'manual', new Date());
    return NextResponse.json({ activity }, { status: 201 });
  });
}

/** GET /api/activities?period=day|week|month — list the user's activities. */
export async function GET(request: Request): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const parsed = periodSchema.safeParse(url.searchParams.get('period') ?? 'week');
    if (!parsed.success) {
      throw new ApiError('bad_request', 'Invalid period');
    }
    const activities = await listActivities(user.uid, parsed.data, new Date());
    return NextResponse.json({ activities });
  });
}
