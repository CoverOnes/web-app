/**
 * MobileFABContext — context definition only (no components, no hooks).
 * Component: MobileFABProvider.tsx
 * Hook: src/hooks/useFAB.ts
 */
import { createContext } from 'react';
import type { ReactNode } from 'react';

export interface FABConfig {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
}

export interface MobileFABContextValue {
  setFAB: (config: FABConfig | null) => void;
}

export const MobileFABContext = createContext<MobileFABContextValue | null>(null);
