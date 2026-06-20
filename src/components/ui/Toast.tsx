'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

interface ToastItem {
  id: number;
  title: string;
  tone: 'info' | 'success' | 'warning';
}

interface ToastContextValue {
  notify: (title: string, tone?: ToastItem['tone']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((title: string, tone: ToastItem['tone'] = 'info') => {
    nextId += 1;
    const id = nextId;
    setToasts((prev) => [...prev, { id, title, tone }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={5000}
            onOpenChange={(open) => !open && dismiss(t.id)}
            className={cn(
              'rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4 py-3 shadow-lg',
              t.tone === 'warning' && 'border-[var(--color-warn)] bg-[var(--color-warn-soft)]',
              t.tone === 'success' && 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]',
            )}
          >
            <ToastPrimitive.Title className="text-sm font-medium text-[var(--color-ink)]">
              {t.title}
            </ToastPrimitive.Title>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[90vw] flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
