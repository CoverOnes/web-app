/**
 * Returns the stable id for a tab button.
 * Used by Tabs.tsx (to set the button id) and by consumer pages
 * (to reference the same id via aria-labelledby on the tabpanel).
 *
 * Example: tabButtonId('jobs', 'ALL') → 'jobs-tab-ALL'
 */
export function tabButtonId(idPrefix: string, tabId: string): string {
  return `${idPrefix}-tab-${tabId}`;
}
