'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebaseClient';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** Demo mode runs without a live Firebase project (local dev / E2E). */
  demoMode: boolean;
  getToken: () => Promise<string | null>;
  signInEmail: (email: string, password: string, isNew: boolean) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_KEY = 'delta-demo-user';

function toAuthUser(u: User): AuthUser {
  return { uid: u.uid, email: u.email, displayName: u.displayName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const demoMode = !isFirebaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoMode) {
      try {
        const raw = localStorage.getItem(DEMO_KEY);
        if (raw) setUser(JSON.parse(raw) as AuthUser);
      } catch {
        /* ignore corrupt storage */
      }
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? toAuthUser(u) : null);
      setLoading(false);
    });
  }, [demoMode]);

  const getToken = useCallback(async () => {
    if (demoMode) return user ? `demo-${user.uid}` : null;
    const auth = getFirebaseAuth();
    const current = auth?.currentUser;
    return current ? current.getIdToken() : null;
  }, [demoMode, user]);

  const signInDemo = useCallback(async () => {
    const demoUser: AuthUser = {
      uid: 'demo-user',
      email: 'you@delta.app',
      displayName: 'Demo User',
    };
    localStorage.setItem(DEMO_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
  }, []);

  const signInEmail = useCallback(
    async (email: string, password: string, isNew: boolean) => {
      if (demoMode) return signInDemo();
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Auth unavailable');
      if (isNew) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    },
    [demoMode, signInDemo],
  );

  const signInGoogle = useCallback(async () => {
    if (demoMode) return signInDemo();
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Auth unavailable');
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, [demoMode, signInDemo]);

  const signOut = useCallback(async () => {
    if (demoMode) {
      localStorage.removeItem(DEMO_KEY);
      setUser(null);
      return;
    }
    const auth = getFirebaseAuth();
    if (auth) await fbSignOut(auth);
  }, [demoMode]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      demoMode,
      getToken,
      signInEmail,
      signInGoogle,
      signInDemo,
      signOut,
    }),
    [user, loading, demoMode, getToken, signInEmail, signInGoogle, signInDemo, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
