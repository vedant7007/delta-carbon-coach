import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerConfig, isAiEnabled, shouldUseInMemoryStore } from '@/lib/config/env';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('server config', () => {
  it('treats empty-string vars as undefined (common in CI)', () => {
    process.env.GEMINI_API_KEY = '';
    process.env.FIREBASE_PROJECT_ID = '';
    const config = getServerConfig();
    expect(config.geminiApiKey).toBeUndefined();
    expect(config.firebaseProjectId).toBeUndefined();
  });

  it('defaults the Gemini model when unset', () => {
    delete process.env.GEMINI_MODEL;
    expect(getServerConfig().geminiModel).toMatch(/gemini/);
  });

  it('prefers NEXT_PUBLIC project id when the server var is absent', () => {
    delete process.env.FIREBASE_PROJECT_ID;
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'fallback-project';
    expect(getServerConfig().firebaseProjectId).toBe('fallback-project');
  });
});

describe('isAiEnabled', () => {
  it('is true only with a key and not force-disabled', () => {
    process.env.AI_DISABLED = '';
    process.env.GEMINI_API_KEY = 'key';
    expect(isAiEnabled()).toBe(true);
  });
  it('is false when force-disabled', () => {
    process.env.AI_DISABLED = '1';
    process.env.GEMINI_API_KEY = 'key';
    expect(isAiEnabled()).toBe(false);
  });
  it('is false without a key', () => {
    process.env.AI_DISABLED = '';
    delete process.env.GEMINI_API_KEY;
    expect(isAiEnabled()).toBe(false);
  });
});

describe('shouldUseInMemoryStore', () => {
  it('is true with no project id', () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    process.env.DELTA_E2E = '';
    expect(shouldUseInMemoryStore()).toBe(true);
  });
  it('is false with a project id and not E2E', () => {
    process.env.FIREBASE_PROJECT_ID = 'p';
    process.env.DELTA_E2E = '';
    expect(shouldUseInMemoryStore()).toBe(false);
  });
  it('is true in E2E even with a project id', () => {
    process.env.FIREBASE_PROJECT_ID = 'p';
    process.env.DELTA_E2E = '1';
    expect(shouldUseInMemoryStore()).toBe(true);
  });
});
