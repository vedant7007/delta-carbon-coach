import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/server/auth', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/ai/parse', () => ({ parseActivitiesFromText: vi.fn() }));
vi.mock('@/lib/ai/explain', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/explain')>('@/lib/ai/explain');
  return { ...actual, explainInsight: vi.fn() };
});

import { requireUser } from '@/lib/server/auth';
import { parseActivitiesFromText } from '@/lib/ai/parse';
import { explainInsight } from '@/lib/ai/explain';
import { POST as parsePOST } from '@/app/api/ai/parse/route';
import { POST as explainPOST } from '@/app/api/ai/explain/route';

const ORIGINAL_ENV = { ...process.env };

function aiReq(body: unknown, uid = 'u1'): Request {
  void uid;
  return new Request('http://localhost/api/ai', {
    method: 'POST',
    headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ uid: `u-${Math.random()}`, email: null });
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('POST /api/ai/parse', () => {
  it('degrades gracefully (200) when AI is disabled — user is never blocked', async () => {
    process.env.AI_DISABLED = '1';
    const res = await parsePOST(aiReq({ text: 'drove 30km' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.degraded).toBe(true);
    expect(json.activities).toEqual([]);
    expect(vi.mocked(parseActivitiesFromText)).not.toHaveBeenCalled();
  });

  it('returns parsed activities on success', async () => {
    process.env.AI_DISABLED = '';
    process.env.GEMINI_API_KEY = 'test-key';
    vi.mocked(parseActivitiesFromText).mockResolvedValue([
      { factorId: 'transport.car.petrol', amount: 30 },
    ]);
    const res = await parsePOST(aiReq({ text: 'drove 30km' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.degraded).toBe(false);
    expect(json.activities[0].factorId).toBe('transport.car.petrol');
  });

  it('degrades (200) when the AI call throws', async () => {
    process.env.AI_DISABLED = '';
    process.env.GEMINI_API_KEY = 'test-key';
    vi.mocked(parseActivitiesFromText).mockRejectedValue(new Error('timeout'));
    const res = await parsePOST(aiReq({ text: 'drove 30km' }));
    expect(res.status).toBe(200);
    expect((await res.json()).degraded).toBe(true);
  });

  it('rejects empty text (400)', async () => {
    const res = await parsePOST(aiReq({ text: '' }));
    expect(res.status).toBe(400);
  });

  it('rate-limits after the per-minute budget (429)', async () => {
    process.env.AI_DISABLED = '';
    process.env.GEMINI_API_KEY = 'test-key';
    vi.mocked(parseActivitiesFromText).mockResolvedValue([]);
    // Pin a single uid so all calls hit the same bucket.
    vi.mocked(requireUser).mockResolvedValue({ uid: 'rate-test', email: null });

    let lastStatus = 200;
    for (let i = 0; i < 12; i += 1) {
      const res = await parsePOST(aiReq({ text: 'drove 30km' }));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

describe('POST /api/ai/explain', () => {
  it('uses the deterministic template when AI is disabled', async () => {
    process.env.AI_DISABLED = '1';
    const res = await explainPOST(
      aiReq({ insight: { title: 'Swap beef for chicken', annualKgSaved: 120 } }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.degraded).toBe(true);
    expect(json.text).toMatch(/120 kg CO₂e per year/);
  });

  it('returns AI phrasing on success without altering the number', async () => {
    process.env.AI_DISABLED = '';
    process.env.GEMINI_API_KEY = 'test-key';
    vi.mocked(explainInsight).mockResolvedValue('Nice one — swapping beef saves 120 kg a year!');
    const res = await explainPOST(
      aiReq({ insight: { title: 'Swap beef for chicken', annualKgSaved: 120 } }),
    );
    const json = await res.json();
    expect(json.degraded).toBe(false);
    expect(json.text).toContain('120');
  });

  it('falls back to the template when AI throws', async () => {
    process.env.AI_DISABLED = '';
    process.env.GEMINI_API_KEY = 'test-key';
    vi.mocked(explainInsight).mockRejectedValue(new Error('bad json'));
    const res = await explainPOST(
      aiReq({ insight: { title: 'Cut car by 20%', annualKgSaved: 80 } }),
    );
    const json = await res.json();
    expect(json.degraded).toBe(true);
    expect(json.text).toMatch(/80 kg CO₂e per year/);
  });
});
