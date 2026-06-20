import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Firestore security rules assertion. We use a deny-all model: clients never
 * touch Firestore directly — all access goes through the server (Admin SDK).
 * A full emulator round-trip is overkill for a deny-all policy, so we assert
 * the rule shape statically (and document the emulator command in the README).
 */
const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8');

describe('firestore.rules', () => {
  it('denies all client reads and writes', () => {
    expect(rules).toMatch(/allow\s+read,\s*write:\s*if\s+false/);
  });

  it('does not grant any allow:true or request.auth-based access', () => {
    expect(rules).not.toMatch(/if\s+true/);
    expect(rules).not.toMatch(/request\.auth/);
  });

  it('uses the secured rules version', () => {
    expect(rules).toMatch(/rules_version\s*=\s*'2'/);
  });
});
