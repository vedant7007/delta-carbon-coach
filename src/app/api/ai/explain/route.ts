import { NextResponse } from 'next/server';
import { isAiEnabled } from '@/lib/ai/client';
import { explainInsight, fallbackPhrasing } from '@/lib/ai/explain';
import { aiExplainInputSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/server/auth';
import { parseJson, runGuarded } from '@/lib/server/http';
import { describeError, logger } from '@/lib/server/logger';
import { enforceRateLimit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/explain — warm phrasing of an already-computed insight.
 * Always returns usable text: the deterministic template is the fallback, and
 * the number is never altered by the model.
 */
export async function POST(request: Request): Promise<NextResponse> {
  return runGuarded(async () => {
    const user = await requireUser(request);
    const { insight } = await parseJson(request, aiExplainInputSchema);

    if (!isAiEnabled()) {
      return NextResponse.json({ degraded: true, text: fallbackPhrasing(insight) });
    }

    enforceRateLimit(`ai:explain:${user.uid}`);

    try {
      const text = await explainInsight(insight);
      return NextResponse.json({ degraded: false, text });
    } catch (err) {
      logger.error('AI explain failed, using template', { error: describeError(err) });
      return NextResponse.json({ degraded: true, text: fallbackPhrasing(insight) });
    }
  });
}
