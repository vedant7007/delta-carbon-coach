import { describe, it, expect } from 'vitest';
import { buildParsePrompt, extractAndValidate } from '@/lib/ai/parse';
import { buildExplainPrompt, fallbackPhrasing } from '@/lib/ai/explain';

describe('AI parse — pure helpers', () => {
  it('builds a prompt that lists known factors and forbids CO2 numbers', () => {
    const prompt = buildParsePrompt('drove 30km');
    expect(prompt).toContain('transport.car.petrol');
    expect(prompt).toContain('Do NOT compute or include any CO2 numbers');
    expect(prompt).toContain('drove 30km');
  });

  it('extracts and validates clean JSON', () => {
    const out = extractAndValidate('{"activities":[{"factorId":"food.beef","amount":0.2}]}');
    expect(out).toEqual([{ factorId: 'food.beef', amount: 0.2 }]);
  });

  it('strips code fences', () => {
    const out = extractAndValidate('```json\n{"activities":[]}\n```');
    expect(out).toEqual([]);
  });

  it('rejects unknown factor ids (anti-hallucination)', () => {
    expect(() =>
      extractAndValidate('{"activities":[{"factorId":"food.dragon","amount":1}]}'),
    ).toThrow();
  });

  it('rejects malformed JSON', () => {
    expect(() => extractAndValidate('not json at all')).toThrow();
  });

  it('rejects negative amounts', () => {
    expect(() =>
      extractAndValidate('{"activities":[{"factorId":"food.beef","amount":-1}]}'),
    ).toThrow();
  });
});

describe('AI explain — pure helpers', () => {
  it('fallback phrasing keeps one decimal below 100', () => {
    const text = fallbackPhrasing({ title: 'Swap beef for chicken', annualKgSaved: 87.65 });
    expect(text).toMatch(/87.7 kg CO₂e per year/);
  });

  it('rounds large numbers to whole kg in the fallback', () => {
    const text = fallbackPhrasing({ title: 'Cut flights', annualKgSaved: 1234.5 });
    expect(text).toMatch(/1235 kg CO₂e per year/); // whole-number rounding above 100
  });

  it('builds an explain prompt that pins the number', () => {
    const prompt = buildExplainPrompt({ title: 'Cut car by 20%', annualKgSaved: 80 });
    expect(prompt).toContain('Do NOT change the number');
    expect(prompt).toContain('80');
  });
});
