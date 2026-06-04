import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListings } from '../lib/query';
import { ProjectCard } from '../components/marketplace/ProjectCard';
import { PageHead } from '../components/layout/PageHead';
import { Tabs } from '../components/ui/Tabs';
import { tabButtonId } from '../utils/tabIds';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import type { Listing } from '../lib/api/coverones';

type TabId = 'ALL' | 'OPEN' | 'AWARDED' | 'CLOSED';

const TABS: { id: TabId; label: string }[] = [
  { id: 'ALL',    label: '全部案件' },
  { id: 'OPEN',   label: '開放中' },
  { id: 'AWARDED', label: '已得標' },
  { id: 'CLOSED', label: '已關閉' },
];

function filterListings(listings: Listing[], tab: TabId): Listing[] {
  if (tab === 'ALL') return listings;
  return listings.filter((l) => l.status === tab);
}

const JobBoardPage = () => {
  const navigate = useNavigate();
  const kycTier = useAuthStore((s) => s.user?.kycTier ?? 0);
  const { data: listings, isLoading, isError } = useListings({ status: 'OPEN' });
  const [activeTab, setActiveTab] = useState<TabId>('ALL');

  const canPost = kycTier >= 2;

  const filteredListings = listings ? filterListings(listings, activeTab) : [];

  const openCount = listings?.filter((l) => l.status === 'OPEN').length ?? 0;
  const totalCount = listings?.length ?? 0;

  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count: t.id === 'ALL' ? totalCount
      : t.id === 'OPEN' ? openCount
      : undefined,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--co-bg)' }}>
      {/* Page head */}
      <PageHead
        crumb="主選單 / 案件看板"
        title="案件看板"
        description={isLoading ? '載入中...' : `共 ${totalCount} 個案件`}
        actions={
          canPost ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/jobs/new')}
              aria-label="發布案件"
            >
              + 發布案件
            </Button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* 發布案件 stays disabled (needs Tier 2) but now sits next to a
                  visible CTA so the user knows HOW to unlock it. */}
              <Tooltip content="需要 KYC Tier 2 驗證才能發布案件。">
                <Button variant="primary" size="md" disabled aria-label="發布案件 (需要 KYC)">
                  + 發布案件
                </Button>
              </Tooltip>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/kyc')}
                aria-label="完成 KYC 認證以解鎖發布案件"
              >
                <Icon.Lock size={13} />
                完成 KYC 認證
              </Button>
            </div>
          )
        }
      />

      {/* Tab strip */}
      <Tabs tabs={tabsWithCount} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} idPrefix="jobs" />

      {/* Stats row */}
      <div style={{ padding: '16px 28px 0 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="開放案件" value={openCount} />
          <StatCard label="本月應標" value="—" />
          <StatCard label="進行中" value="—" />
          <StatCard label="本季接案" value="—" />
        </div>
      </div>

      {/* Content */}
      <div
        role="tabpanel"
        id={`jobs-panel-${activeTab}`}
        aria-labelledby={tabButtonId('jobs', activeTab)}
        style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px 28px' }}
      >
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            <LoadingSkeleton count={6} height="h-36" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<Icon.X size={48} />}
            title="載入失敗"
            description="請重新整理頁面。"
          />
        ) : !filteredListings || filteredListings.length === 0 ? (
          <EmptyState
            icon={<Icon.MessageSquare size={48} />}
            title={activeTab === 'ALL' ? '目前沒有案件' : `沒有「${TABS.find(t => t.id === activeTab)?.label}」的案件`}
            description={canPost ? '成為第一個發布案件的人。' : '瀏覽案件並提交您的第一個投標。'}
            ctaLabel={canPost ? '發布案件' : undefined}
            onCta={canPost ? () => navigate('/jobs/new') : undefined}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filteredListings.map((listing) => (
              <ProjectCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobBoardPage;
