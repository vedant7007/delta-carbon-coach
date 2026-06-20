import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateText = vi.fn();
vi.mock('@/lib/ai/client', () => ({
  generateText: (...args: unknown[]) => generateText(...args),
  isAiEnabled: () => true,
}));

import { parseActivitiesFromText } from '@/lib/ai/parse';
import { explainInsight } from '@/lib/ai/explain';

beforeEach(() => vi.clearAllMocks());

describe('parseActivitiesFromText (with mocked model)', () => {
  it('returns validated activities from model JSON', async () => {
    generateText.mockResolvedValue('{"activities":[{"factorId":"food.beef","amount":0.2}]}');
    await expect(parseActivitiesFromText('a steak')).resolves.toEqual([
      { factorId: 'food.beef', amount: 0.2 },
    ]);
  });

  it('throws when the model returns an unknown factor', async () => {
    generateText.mockResolvedValue('{"activities":[{"factorId":"food.dragon","amount":1}]}');
    await expect(parseActivitiesFromText('a dragon')).rejects.toThrow();
  });
});

describe('explainInsight (with mocked model)', () => {
  it('returns trimmed text from model JSON', async () => {
    generateText.mockResolvedValue('{"text":"Great choice — saves a lot!"}');
    await expect(
      explainInsight({ title: 'Swap beef', annualKgSaved: 100 }),
    ).resolves.toBe('Great choice — saves a lot!');
  });

  it('throws on missing/empty text so the caller uses the template', async () => {
    generateText.mockResolvedValue('{"text":""}');
    await expect(explainInsight({ title: 'x', annualKgSaved: 1 })).rejects.toThrow();
  });

  it('throws on non-object output', async () => {
    generateText.mockResolvedValue('"just a string"');
    await expect(explainInsight({ title: 'x', annualKgSaved: 1 })).rejects.toThrow();
  });
});
