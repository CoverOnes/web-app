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

type ApiErrorBody = {
  code?: string;
  data?: {
    code?: string;
  };
};

function filterListings(listings: Listing[], tab: TabId): Listing[] {
  if (tab === 'ALL') return listings;
  return listings.filter((l) => l.status === tab);
}

function getApiErrorCode(error: unknown): string | undefined {
  const response = (error as { response?: { data?: ApiErrorBody } })?.response;
  return response?.data?.code ?? response?.data?.data?.code;
}

const JobBoardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const kycTier = user?.kycTier ?? 0;
  const { data: listings, isLoading, isError, error } = useListings({ status: 'OPEN' });
  const [activeTab, setActiveTab] = useState<TabId>('ALL');

  const canPost = kycTier >= 2;
  const needsEmailVerification = !!user && !user.emailVerified;
  const errorCode = getApiErrorCode(error);
  const isEmailVerificationError = isError && (
    errorCode === 'EMAIL_NOT_VERIFIED' || needsEmailVerification
  );
  const isTierRequiredError = isError && errorCode === 'KYC_TIER_REQUIRED' && !isEmailVerificationError;
  const isOnboardingError = isEmailVerificationError || isTierRequiredError;

  const goToVerifyEmail = () => {
    navigate('/register/verify-sent', { state: { email: user?.email ?? '' } });
  };

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
          ) : needsEmailVerification ? (
            <Button
              variant="primary"
              size="md"
              onClick={goToVerifyEmail}
              aria-label="驗證 Email 以啟用案件功能"
            >
              驗證 Email
            </Button>
          ) : (
            <Tooltip content="發布案件需要 KYC Tier 2。">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/kyc')}
                aria-label="完成 KYC 認證以解鎖發布案件"
              >
                <Icon.Lock size={13} />
                完成 KYC 認證
              </Button>
            </Tooltip>
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
        ) : isEmailVerificationError ? (
          <EmptyState
            icon={<Icon.Lock size={48} />}
            title="請先驗證 Email"
            description="驗證信已寄出。完成信箱驗證後，案件瀏覽會升級為可用狀態；發布案件仍需完成更高層級 KYC。"
            ctaLabel="查看驗證信狀態"
            onCta={goToVerifyEmail}
          />
        ) : isTierRequiredError ? (
          <EmptyState
            icon={<Icon.Lock size={48} />}
            title="完成帳戶驗證後即可查看案件"
            description="目前帳戶等級尚未開放案件列表。前往 KYC 查看下一步；發布案件需要 KYC Tier 2。"
            ctaLabel="完成 KYC 認證"
            onCta={() => navigate('/kyc')}
          />
        ) : isError && !isOnboardingError ? (
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
