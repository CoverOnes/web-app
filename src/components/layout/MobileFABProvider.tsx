import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { MobileFABContext } from './MobileFABContext';
import type { FABConfig } from './MobileFABContext';
import MobileFAB from './MobileFAB';

interface MobileFABProviderProps {
  children: ReactNode;
}

/**
 * MobileFABProvider — wraps the layout; pages use useFAB() hook to register a FAB action.
 */
const MobileFABProvider = ({ children }: MobileFABProviderProps) => {
  const [fabConfig, setFabConfig] = useState<FABConfig | null>(null);

  const setFAB = useCallback((config: FABConfig | null) => {
    setFabConfig(config);
  }, []);

  return (
    <MobileFABContext.Provider value={{ setFAB }}>
      {children}
      {fabConfig && (
        <MobileFAB
          label={fabConfig.label}
          icon={fabConfig.icon}
          onClick={fabConfig.onClick}
        />
      )}
    </MobileFABContext.Provider>
  );
};

export default MobileFABProvider;
