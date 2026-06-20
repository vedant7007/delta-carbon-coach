import type { OnboardingInput } from '@/lib/schemas';
import { adminDb } from '../firebaseAdmin';
import { memory, shouldUseMemoryStore } from './memoryStore';

/** users/{uid} document: profile + onboarding baseline. */
export interface UserProfile {
  uid: string;
  email: string | null;
  onboarding?: OnboardingInput;
  createdAt: string;
}

function userDoc(uid: string) {
  return adminDb().collection('users').doc(uid);
}

/**
 * Creates or merges a user's profile + onboarding baseline.
 * @param profile - The full profile document to persist (merged, not replaced).
 */
export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  if (shouldUseMemoryStore()) {
    memory.upsertProfile(profile);
    return;
  }
  await userDoc(profile.uid).set(profile, { merge: true });
}
