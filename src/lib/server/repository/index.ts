import { shouldUseInMemoryStore } from '@/lib/config/env';
import { firestoreActivityRepository, firestoreUserRepository } from './firestore';
import { createInMemoryActivityRepository, createInMemoryUserRepository } from './memory';
import type { ActivityRepository, UserRepository } from './types';

/**
 * Composition root for the data layer. Selects the concrete repository
 * implementation ONCE, based on configuration: in-memory when there's no
 * Firestore to talk to (demo/E2E), Firestore otherwise. Consumers import these
 * instances and depend only on the interfaces in `./types`.
 */
const inMemory = shouldUseInMemoryStore();

export const activityRepository: ActivityRepository = inMemory
  ? createInMemoryActivityRepository()
  : firestoreActivityRepository;

export const userRepository: UserRepository = inMemory
  ? createInMemoryUserRepository()
  : firestoreUserRepository;

export type {
  ActivityRepository,
  UserRepository,
  StoredActivity,
  NewActivity,
  UserProfile,
} from './types';
