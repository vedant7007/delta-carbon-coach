import { describe, it, expect, vi, afterEach } from 'vitest';
import { describeError, logger } from '@/lib/server/logger';

afterEach(() => vi.restoreAllMocks());

describe('describeError', () => {
  it('extracts the message from an Error', () => {
    expect(describeError(new Error('boom'))).toBe('boom');
  });
  it('stringifies non-Error values', () => {
    expect(describeError('plain')).toBe('plain');
    expect(describeError(42)).toBe('42');
  });
});

describe('logger', () => {
  it('error emits a structured JSON line via console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('oops', { code: 'x' });
    const [line] = spy.mock.calls[0]!;
    const parsed = JSON.parse(String(line));
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('oops');
    expect(parsed.context).toEqual({ code: 'x' });
    expect(parsed.time).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('warn emits via console.warn without a context key when omitted', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('careful');
    const parsed = JSON.parse(String(spy.mock.calls[0]![0]));
    expect(parsed.level).toBe('warn');
    expect(parsed).not.toHaveProperty('context');
  });
});
