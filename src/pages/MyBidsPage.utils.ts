/**
 * Pure utilities for MyBidsPage — extracted so that react-refresh is happy
 * (component files must only export components; non-component exports live here).
 */
import type { Bid } from '../lib/api/coverones';

type BidStatus = Bid['status'];

export type StepState = 'done' | 'now' | 'todo';

export interface StepInfo {
  label: string;
  state: StepState;
}

/**
 * Returns the ordered stepper steps for a given bid's current status.
 * Steps are derived purely from status — no bid-events API currently exists,
 * so timestamps are omitted to avoid invented data.
 */
export function stepsForBid(bid: Bid): StepInfo[] {
  const byStatus: Record<BidStatus, StepInfo[]> = {
    PENDING: [
      { label: '收到案件', state: 'done' },
      { label: '準備提案', state: 'done' },
      { label: '送出投標', state: 'done' },
      { label: '買方評估', state: 'now'  },
      { label: '合約簽訂', state: 'todo' },
    ],
    ACCEPTED: [
      { label: '收到案件', state: 'done' },
      { label: '準備提案', state: 'done' },
      { label: '送出投標', state: 'done' },
      { label: '買方評估', state: 'done' },
      { label: '合約簽訂', state: 'done' },
    ],
    REJECTED: [
      { label: '收到案件', state: 'done' },
      { label: '準備提案', state: 'done' },
      { label: '送出投標', state: 'done' },
      { label: '買方評估', state: 'done' },
      { label: '結果公告', state: 'done' },
    ],
    WITHDRAWN: [
      { label: '收到案件', state: 'done' },
      { label: '準備提案', state: 'done' },
      { label: '送出投標', state: 'done' },
      { label: '撤回',     state: 'done' },
      { label: '—',        state: 'todo' },
    ],
  };
  // TS exhaustiveness: byStatus covers all BidStatus values; `?? byStatus.PENDING`
  // is kept only as a runtime safety net for any future upstream status addition
  // that hasn't been wired here yet.
  return byStatus[bid.status] ?? byStatus.PENDING;
}
