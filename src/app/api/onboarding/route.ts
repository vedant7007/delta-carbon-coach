import { NextResponse } from 'next/server';
import { onboardingSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/server/auth';
import { parseJson, runGuarded } from '@/lib/server/http';
import { seedBaseline } from '@/lib/server/services/onboardingService';

export const dynamic = 'force-dynamic';

/** POST /api/onboarding — seed a baseline from the user's answers. */
export async function POST(request: Request): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const input = await parseJson(request, onboardingSchema);
    const seeded = await seedBaseline(user.uid, user.email, input, new Date());
    return NextResponse.json({ ok: true, seeded }, { status: 201 });
  });
}
