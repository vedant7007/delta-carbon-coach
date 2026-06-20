import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ApiError, errorResponse, parseJson, runGuarded } from '@/lib/server/http';
import { NextResponse } from 'next/server';

describe('errorResponse', () => {
  it('maps codes to the right status', async () => {
    expect(errorResponse('unauthorized', 'x').status).toBe(401);
    expect(errorResponse('bad_request', 'x').status).toBe(400);
    expect(errorResponse('not_found', 'x').status).toBe(404);
    expect(errorResponse('rate_limited', 'x').status).toBe(429);
    expect(errorResponse('internal', 'x').status).toBe(500);
  });

  it('includes fields when provided', async () => {
    const res = errorResponse('bad_request', 'x', { amount: 'too small' });
    expect((await res.json()).error.fields.amount).toBe('too small');
  });
});

describe('parseJson', () => {
  const schema = z.object({ n: z.number() });

  it('returns parsed data on valid body', async () => {
    const data = await parseJson(new Request('http://x', { method: 'POST', body: '{"n":5}' }), schema);
    expect(data.n).toBe(5);
  });

  it('throws a 400 ApiError on invalid JSON', async () => {
    await expect(
      parseJson(new Request('http://x', { method: 'POST', body: 'nope' }), schema),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('throws a 400 ApiError with field detail on schema failure', async () => {
    await expect(
      parseJson(new Request('http://x', { method: 'POST', body: '{"n":"x"}' }), schema),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe('runGuarded', () => {
  it('passes through a successful response', async () => {
    const res = await runGuarded(async () => NextResponse.json({ ok: true }));
    expect(res.status).toBe(200);
  });

  it('maps an ApiError to its status', async () => {
    const res = await runGuarded(async () => {
      throw new ApiError('forbidden', 'nope');
    });
    expect(res.status).toBe(403);
  });

  it('maps a ZodError to 400', async () => {
    const res = await runGuarded(async () => {
      z.object({ a: z.string() }).parse({});
      return NextResponse.json({});
    });
    expect(res.status).toBe(400);
  });

  it('maps an unknown throw to a generic 500 without leaking detail', async () => {
    const res = await runGuarded(async () => {
      throw new Error('secret internal detail');
    });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.message).not.toContain('secret internal detail');
  });
});
