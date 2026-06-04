import { useContext, useEffect } from 'react';
import { MobileFABContext } from '../components/layout/MobileFABContext';
import type { FABConfig } from '../components/layout/MobileFABContext';

/**
 * useFAB — pages call this to register a mobile FAB action.
 * Registers on mount, unregisters on unmount.
 *
 * Example:
 *   useFAB({ label: '發布案件', onClick: () => navigate('/jobs/new') });
 */
export function useFAB(config: FABConfig | null) {
  const ctx = useContext(MobileFABContext);
  const setFAB = ctx?.setFAB;
  const label = config?.label;
  const onClick = config?.onClick;

  useEffect(() => {
    if (!setFAB) return;
    if (config) {
      setFAB({ label: label!, icon: config.icon, onClick: onClick! });
    } else {
      setFAB(null);
    }
    return () => setFAB(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFAB, label, onClick]);
}
