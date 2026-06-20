import { adminDb } from '../firebaseAdmin';
import { memory, shouldUseMemoryStore } from './memoryStore';
import type { OnboardingInput } from '@/lib/schemas';

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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (shouldUseMemoryStore()) return memory.getProfile(uid);
  const doc = await userDoc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as UserProfile;
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  if (shouldUseMemoryStore()) {
    memory.upsertProfile(profile);
    return;
  }
  await userDoc(profile.uid).set(profile, { merge: true });
}
