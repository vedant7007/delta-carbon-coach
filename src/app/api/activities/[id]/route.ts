import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { runGuarded, ApiError, type RouteContext } from '@/lib/server/http';
import { removeActivity } from '@/lib/server/services/activityService';

export const dynamic = 'force-dynamic';

/** DELETE /api/activities/[id] — delete an activity (ownership enforced). */
export async function DELETE(request: Request, context: RouteContext): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const { id } = await context.params;
    if (!id) {
      throw new ApiError('bad_request', 'Missing activity id');
    }
    await removeActivity(user.uid, id);
    return NextResponse.json({ ok: true });
  });
}
