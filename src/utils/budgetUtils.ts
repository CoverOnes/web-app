/**
 * Sum milestone amounts using integer minor-unit arithmetic to avoid JS float
 * precision artifacts (e.g. 0.1 + 0.2 → 0.30000000000000004).
 * Each amount string is stripped to digits+dot, rounded to the nearest cent
 * (×100), accumulated as an integer, then divided by 100 before returning.
 *
 * Fix for five-army audit finding: PostJobPage.tsx:1410-1425 — budget summed
 * with JS float into a string sent to backend (money precision).
 */
export function sumMilestoneAmounts(milestones: { amount: string }[]): number {
  const totalCents = milestones.reduce((sumCents, m) => {
    // Skip negative amounts before stripping non-numeric chars so that
    // '-100' is not silently converted to '100' and included in the sum.
    if (m.amount.trim().startsWith('-')) return sumCents;
    const raw = m.amount.replace(/[^0-9.]/g, '');
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return sumCents;
    return sumCents + Math.round(n * 100);
  }, 0);
  return totalCents / 100;
}
