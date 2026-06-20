import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { parseJson, runGuarded } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rateLimit';
import { aiParseInputSchema } from '@/lib/schemas';
import { isAiEnabled } from '@/lib/ai/client';
import { parseActivitiesFromText } from '@/lib/ai/parse';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/parse — natural-language quick-log.
 *
 * On ANY failure (AI disabled, provider error, timeout, validation reject) the
 * route returns `{ degraded: true, activities: [] }` with HTTP 200 so the UI
 * can transparently open the manual form. The user is never blocked. The model
 * never returns a CO₂ number; the parsed activities still need user confirmation.
 */
export async function POST(request: Request): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const { text } = await parseJson(request, aiParseInputSchema);

    if (!isAiEnabled()) {
      return NextResponse.json({
        degraded: true,
        activities: [],
        message: 'Quick-type is unavailable — add it manually.',
      });
    }

    // Rate limit only real AI calls (10/min/uid). 429 is also a client fallback signal.
    enforceRateLimit(`ai:parse:${user.uid}`);

    try {
      const activities = await parseActivitiesFromText(text);
      return NextResponse.json({ degraded: false, activities });
    } catch (err) {
      console.error('AI parse failed, falling back to manual:', err);
      return NextResponse.json({
        degraded: true,
        activities: [],
        message: 'Quick-type is unavailable — add it manually.',
      });
    }
  });
}
