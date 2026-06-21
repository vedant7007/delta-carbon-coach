import type { Activity } from '@/lib/engine';
import type { OnboardingInput } from '@/lib/schemas';

/**
 * Repository contracts. Services depend on these interfaces, not on Firestore —
 * the concrete implementation (Firestore in production, in-memory for demo/E2E
 * and tests) is chosen by the composition root in `./index`. This is the
 * dependency-inversion boundary that keeps persistence swappable and testable.
 */

/** An activity as persisted, including its server-computed emissions. */
export interface StoredActivity extends Activity {
  kgCO2e: number;
}

/** The fields written when creating an activity (id is assigned by the store). */
export interface NewActivity {
  factorId: string;
  amount: number;
  kgCO2e: number;
  loggedAt: string;
  source: 'manual' | 'ai';
}

/** A user profile document (`users/{uid}`). */
export interface UserProfile {
  uid: string;
  email: string | null;
  onboarding?: OnboardingInput;
  createdAt: string;
}

/** Persistence for a user's activities (`users/{uid}/activities/{itemId}`). */
export interface ActivityRepository {
  /** Persists a new activity and returns it with its assigned id. */
  create(uid: string, data: NewActivity): Promise<StoredActivity>;
  /** Returns activities logged at/after `sinceIso`, newest first. */
  listSince(uid: string, sinceIso: string): Promise<StoredActivity[]>;
  /** Deletes an activity if present; resolves `false` when it doesn't exist. */
  remove(uid: string, id: string): Promise<boolean>;
}

/** Persistence for user profiles. */
export interface UserRepository {
  /** Creates or merges a user's profile document. */
  upsert(profile: UserProfile): Promise<void>;
}
